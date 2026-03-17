import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/auth/crypto";

const OWNER_PERMISSION_KEYS = [
  "catalog:read", "catalog:write", "catalog:delete",
  "images:read", "images:write",
  "prices:read", "prices:write",
  "promotions:read", "promotions:write",
  "orders:read", "orders:write",
  "whatsapp:read", "whatsapp:write",
  "payments:read", "payments:write",
  "shipping:read", "shipping:write",
  "agent:read", "agent:write",
  "users:read", "users:write",
  "tenant:read", "tenant:write",
  "reports:read",
];

const PASSWORD_PROVIDER = "PASSWORD";
const GOOGLE_PROVIDER = "GOOGLE";

function isSignUpLikePath(path: string) {
  return (
    path === "/sign-up" ||
    path === "/sign-up/email" ||
    path.startsWith("/sign-in/social") ||
    path.startsWith("/api/auth/callback/") ||
    path.startsWith("/callback/")  // Detectar callbacks dinámicos
  );
}

async function bootstrapUserTenant(input: {
  userId: string;
  email: string;
  name?: string | null;
  provider: string;
}) {
  console.log("[OAUTH-DEBUG] 🔧 bootstrapUserTenant called with:", {
    userId: input.userId,
    email: input.email,
    provider: input.provider,
  });

  const now = new Date();
  const tenantId = crypto.randomUUID();
  const ownerRoleId = crypto.randomUUID();
  const userProfileId = crypto.randomUUID();
  const authIdentityId = crypto.randomUUID();
  const userRoleId = crypto.randomUUID();
  const tenantName = input.name?.trim() || input.email;
  const slugBase = tenantName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  const tenantSlug = `${slugBase || "tenant"}-${tenantId.slice(0, 8)}`;

  console.log("[OAUTH-DEBUG] 📊 Generated IDs:", { tenantId, tenantSlug });

  const existingUser = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, tenant_id: true, email: true, name: true },
  });

  console.log("[OAUTH-DEBUG] 👤 Existing user lookup:", {
    found: !!existingUser,
    tenant_id: existingUser?.tenant_id,
  });

  if (!existingUser) {
    console.log("[OAUTH-DEBUG] ❌ User not found in database!");
    return;
  }

  if (existingUser.tenant_id) {
    console.log("[OAUTH-DEBUG] ℹ️ User already has tenant_id, account linking scenario");
    console.log("[OAUTH-DEBUG] 🔗 Account linking data:", {
      userId: existingUser.id,
      existingTenantId: existingUser.tenant_id,
      newProvider: input.provider,
    });

    const upsertedIdentity = await prisma.authIdentity.upsert({
      where: {
        tenant_id_user_id_provider: {
          tenant_id: existingUser.tenant_id,
          user_id: existingUser.id,
          provider: input.provider,
        },
      },
      create: {
        id: crypto.randomUUID(),
        tenant_id: existingUser.tenant_id,
        user_id: existingUser.id,
        provider: input.provider,
        mfa_enabled: false,
        created_at: now,
        updated_at: now,
      },
      update: {
        updated_at: now,
      },
    });

    console.log("[OAUTH-DEBUG] ✅ AuthIdentity upserted successfully:", {
      authIdentityId: upsertedIdentity.id,
      provider: upsertedIdentity.provider,
    });
    console.log("[OAUTH-DEBUG] ℹ️ Skipping full bootstrap, user already has tenant");
    return;
  }

  console.log("[OAUTH-DEBUG] 🔄 Starting new user bootstrap transaction...");

  await prisma.$transaction(async (tx) => {
    console.log("[OAUTH-DEBUG] 🔍 Looking up system OWNER role...");
    const systemOwnerRole = await tx.role.findFirst({
      where: {
        name: "OWNER",
        tenant: { slug: "system" },
      },
      select: {
        RolePermission: {
          select: { permission_id: true },
        },
      },
    });

    console.log("[OAUTH-DEBUG] 📋 System owner role found:", !!systemOwnerRole);

    const ownerPermissionIds = systemOwnerRole
      ? systemOwnerRole.RolePermission.map(({ permission_id }) => permission_id)
      : (
          await tx.permission.findMany({
            where: { key: { in: OWNER_PERMISSION_KEYS } },
            select: { id: true },
          })
        ).map(({ id }) => id);

    if (!systemOwnerRole) {
      console.warn("[better-auth hook] ⚠️ System OWNER role not found. Using fallback OWNER permissions.");
    }

    if (ownerPermissionIds.length === 0) {
      throw new Error("No OWNER permissions available. Seed permissions first.");
    }

    console.log("[OAUTH-DEBUG] 🏗️ Creating new tenant...", {
      tenantId,
      tenantSlug,
      ownerPermissions: ownerPermissionIds.length,
    });

    await tx.tenant.create({
      data: {
        id: tenantId,
        name: tenantName,
        slug: tenantSlug,
        status: "PENDING",
        country_code: "PE",
        timezone: "America/Lima",
        currency_code: "PEN",
        createdAt: now,
        updatedAt: now,
      },
    });

    console.log("[OAUTH-DEBUG] ✅ Tenant created");
    console.log("[OAUTH-DEBUG] 👤 Updating user with tenant_id...");

    await tx.user.update({
      where: { id: existingUser.id },
      data: {
        tenant_id: tenantId,
        name: existingUser.name || tenantName,
        status: "ACTIVE",
      },
    });

    console.log("[OAUTH-DEBUG] ✅ User updated with tenant_id");
    console.log("[OAUTH-DEBUG] 📝 Creating UserProfile...");

    await tx.userProfile.upsert({
      where: {
        tenant_id_user_id: {
          tenant_id: tenantId,
          user_id: existingUser.id,
        },
      },
      create: {
        id: userProfileId,
        tenant_id: tenantId,
        user_id: existingUser.id,
        full_name: existingUser.name || tenantName,
        locale: "es-PE",
        timezone: "America/Lima",
        created_at: now,
        updated_at: now,
      },
      update: {
        full_name: existingUser.name || tenantName,
        updated_at: now,
      },
    });

    await tx.authIdentity.upsert({
      where: {
        tenant_id_user_id_provider: {
          tenant_id: tenantId,
          user_id: existingUser.id,
          provider: input.provider,
        },
      },
      create: {
        id: authIdentityId,
        tenant_id: tenantId,
        user_id: existingUser.id,
        provider: input.provider,
        mfa_enabled: false,
        created_at: now,
        updated_at: now,
      },
      update: {
        updated_at: now,
      },
    });

    console.log("[OAUTH-DEBUG] 🔐 Creating OWNER role...");

    await tx.role.create({
      data: {
        id: ownerRoleId,
        tenant_id: tenantId,
        name: "OWNER",
        description: "Propietario del tenant. Acceso completo.",
        is_system: true,
        created_at: now,
        updated_at: now,
      },
    });

    console.log("[OAUTH-DEBUG] ✅ OWNER role created");

    await tx.userRole.create({
      data: {
        id: userRoleId,
        tenant_id: tenantId,
        user_id: existingUser.id,
        role_id: ownerRoleId,
        created_at: now,
      },
    });

    console.log("[OAUTH-DEBUG] ✅ UserRole assigned");
    console.log("[OAUTH-DEBUG] 🔑 Creating RolePermissions...", {
      totalPermissions: ownerPermissionIds.length,
    });

    await tx.rolePermission.createMany({
      data: ownerPermissionIds.map((permission_id) => ({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        role_id: ownerRoleId,
        permission_id,
      })),
    });

    console.log("[OAUTH-DEBUG] ✅ All role permissions assigned");
  });

  console.log("[OAUTH-DEBUG] ✅ Tenant bootstrap completed successfully!", {
    userId: existingUser.id,
    tenantId,
    tenantSlug,
    provider: input.provider,
  });
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  basePath: "/api/auth",

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: (profile) => ({
        email: profile.email,
        name: profile.name,
        emailVerified: Boolean(profile.email_verified),
      }),
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,

    onPasswordChange: async ({ userId, password }) => {
      const baUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!baUser) return;

      const domainUser = await prisma.user.findFirst({
        where: { email: baUser.email, deleted_at: null },
        include: {
          AuthIdentity: {
            where: { provider: PASSWORD_PROVIDER },
            take: 1,
          },
        },
      });

      if (!domainUser || !domainUser.AuthIdentity[0]) return;

      const newHash = hashPassword(password);
      const now = new Date();

      await prisma.authIdentity.update({
        where: { id: domainUser.AuthIdentity[0].id },
        data: {
          password_hash: newHash,
          password_updated_at: now,
          updated_at: now,
        },
      });
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  hooks: {
    before: createAuthMiddleware(async (context) => {
      if (!isSignUpLikePath(context.path)) {
        return;
      }

      console.log("[better-auth hook] ✓ AUTH FLOW TRIGGERED", {
        path: context.path,
        hasBody: !!context.body,
      });
    }),
    after: createAuthMiddleware(async (context) => {
      console.log("[OAUTH-DEBUG] 📍 AFTER HOOK TRIGGERED");
      console.log("[OAUTH-DEBUG] Path:", context.path);
      console.log("[OAUTH-DEBUG] isSignUpLikePath:", isSignUpLikePath(context.path));

      if (!isSignUpLikePath(context.path)) {
        console.log("[OAUTH-DEBUG] ❌ Path not sign-up-like, skipping");
        return;
      }

      const newSession = context.context.newSession;
      const authUser = newSession?.user;

      console.log("[OAUTH-DEBUG] 📝 Auth User Data:");
      console.log("[OAUTH-DEBUG]   - id:", authUser?.id);
      console.log("[OAUTH-DEBUG]   - email:", authUser?.email);
      console.log("[OAUTH-DEBUG]   - emailVerified:", authUser?.emailVerified);
      console.log("[OAUTH-DEBUG]   - name:", authUser?.name);

      if (!authUser?.id || !authUser.email) {
        console.log("[OAUTH-DEBUG] ❌ Missing authUser.id or email, returning");
        return;
      }

      const provider = (context.path.startsWith("/sign-in/social") || context.path.includes("/callback/"))
        ? GOOGLE_PROVIDER
        : PASSWORD_PROVIDER;

      console.log("[OAUTH-DEBUG] 🔍 Provider:", provider);

      try {
        if (provider === GOOGLE_PROVIDER && !authUser.emailVerified) {
          console.log("[OAUTH-DEBUG] ⚠️ Google account not email verified, skipping bootstrap");
          return;
        }

        console.log("[OAUTH-DEBUG] 🚀 Starting bootstrapUserTenant...");
        console.log("[OAUTH-DEBUG] About to call bootstrapUserTenant with provider:", provider);

        await bootstrapUserTenant({
          userId: authUser.id,
          email: authUser.email,
          name: authUser.name,
          provider,
        });

        console.log("[OAUTH-DEBUG] ✅ bootstrapUserTenant completed successfully!");
      } catch (error) {
        console.error("[OAUTH-DEBUG] ❌ ERROR in bootstrapUserTenant:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;

