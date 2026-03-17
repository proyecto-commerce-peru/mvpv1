import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { ApiError } from "@/lib/server/errors";
import { generateOpaqueToken, hashOpaqueToken, hashPassword, verifyPassword } from "@/lib/server/auth/crypto";
import { issueAccessToken } from "@/lib/server/auth/token";

const PASSWORD_PROVIDER = "PASSWORD";
const MAGIC_LINK_TTL_MINUTES = 10;
const RESET_TTL_MINUTES = 30;

export type AuthTokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
};

function nowPlusMinutes(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

async function ensureTenantExists(tenantId: string): Promise<void> {
  console.log("[ensureTenantExists] Verificando tenant:", tenantId);
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  console.log("[ensureTenantExists] Tenant encontrado:", tenant ? "SÍ" : "NO");
  if (!tenant || tenant.deleted_at) {
    console.error("[ensureTenantExists] ❌ Tenant no existe o está eliminado");
    throw new ApiError(404, "TENANT_NOT_FOUND", "Tenant not found");
  }
  console.log("[ensureTenantExists] ✓ Tenant válido");
}

export async function registerWithPassword(input: {
  tenantId: string;
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthTokenResponse> {
  console.log("[registerWithPassword] ▶️ Iniciando registro:", { tenantId: input.tenantId, email: input.email, fullName: input.fullName });

  try {
    console.log("[registerWithPassword] Verificando tenant...");
    await ensureTenantExists(input.tenantId);

    console.log("[registerWithPassword] Buscando usuario existente...");
    const existing = await prisma.appUser.findFirst({
      where: {
        tenant_id: input.tenantId,
        email: input.email,
        deleted_at: null,
      },
      select: { id: true },
    });

    if (existing) {
      console.error("[registerWithPassword] ❌ Usuario ya existe con ID:", existing.id);
      throw new ApiError(409, "USER_EXISTS", "User already exists");
    }

    console.log("[registerWithPassword] ✓ Usuario no existe, hasheando password...");
    const now = new Date();
    const passwordHash = hashPassword(input.password);
    console.log("[registerWithPassword] ✓ Password hasheado correctamente");

    console.log("[registerWithPassword] ▶️ Iniciando transacción...");
    const user = await prisma.$transaction(async (tx) => {
      console.log("[registerWithPassword] [TX] Creando usuario base...");
      const created = await tx.appUser.create({
        data: {
          id: crypto.randomUUID(),
          tenant_id: input.tenantId,
          email: input.email,
          status: "ACTIVE",
          created_at: now,
          updated_at: now,
        },
      });
      console.log("[registerWithPassword] [TX] ✓ Usuario creado con ID:", created.id);

      console.log("[registerWithPassword] [TX] Creando perfil...");
      await tx.userProfile.create({
        data: {
          id: crypto.randomUUID(),
          tenant_id: input.tenantId,
          user_id: created.id,
          full_name: input.fullName,
          locale: "es-PE",
          timezone: "America/Lima",
          created_at: now,
          updated_at: now,
        },
      });
      console.log("[registerWithPassword] [TX] ✓ Perfil creado");

      console.log("[registerWithPassword] [TX] Creando identidad de auth...");
      await tx.authIdentity.create({
        data: {
          id: crypto.randomUUID(),
          tenant_id: input.tenantId,
          user_id: created.id,
          provider: PASSWORD_PROVIDER,
          password_hash: passwordHash,
          password_updated_at: now,
          mfa_enabled: false,
          created_at: now,
          updated_at: now,
        },
      });
      console.log("[registerWithPassword] [TX] ✓ Identidad creada");

      return created;
    });

    console.log("[registerWithPassword] ✓ Transacción completada, issuando token...");
    const token = issueAccessToken(user.id, input.tenantId);
    console.log("[registerWithPassword] ✓✓✓ Token generado - REGISTRO EXITOSO");

    return {
      access_token: token,
      token_type: "Bearer",
      expires_in: 3600,
    };
  } catch (error) {
    console.error("[registerWithPassword] ❌❌❌ ERROR:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function loginWithPassword(input: {
  tenantId: string;
  email: string;
  password: string;
}): Promise<AuthTokenResponse> {
  console.log("[loginWithPassword] ▶️ Iniciando login:", { tenantId: input.tenantId, email: input.email });

  try {
    console.log("[loginWithPassword] Verificando tenant...");
    await ensureTenantExists(input.tenantId);

    console.log("[loginWithPassword] Buscando usuario...");
    const user = await prisma.appUser.findFirst({
      where: {
        tenant_id: input.tenantId,
        email: input.email,
        deleted_at: null,
        status: "ACTIVE",
      },
      include: {
        AuthIdentity: {
          where: { provider: PASSWORD_PROVIDER },
          take: 1,
        },
      },
    });

    if (!user) {
      console.error("[loginWithPassword] ❌ Usuario no encontrado:", input.email);
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    console.log("[loginWithPassword] ✓ Usuario encontrado con ID:", user.id);
    console.log("[loginWithPassword] Verificando identidad de auth...");
    const identity = user.AuthIdentity[0];

    if (!identity) {
      console.error("[loginWithPassword] ❌ No hay identidad de auth");
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    if (!identity.password_hash) {
      console.error("[loginWithPassword] ❌ No hay password_hash");
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    console.log("[loginWithPassword] Verificando contraseña...");
    const passwordMatch = verifyPassword(input.password, identity.password_hash);

    if (!passwordMatch) {
      console.error("[loginWithPassword] ❌ Contraseña incorrecta");
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    console.log("[loginWithPassword] ✓ Contraseña válida, actualizando último login...");
    await prisma.appUser.update({
      where: { id: user.id },
      data: { last_login_at: new Date(), updated_at: new Date() },
    });
    console.log("[loginWithPassword] ✓ Último login actualizado");

    console.log("[loginWithPassword] Issuando token...");
    const token = issueAccessToken(user.id, input.tenantId);
    console.log("[loginWithPassword] ✓✓✓ Token generado - LOGIN EXITOSO");

    return {
      access_token: token,
      token_type: "Bearer",
      expires_in: 3600,
    };
  } catch (error) {
    console.error("[loginWithPassword] ❌❌❌ ERROR:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function issueMagicLinkToken(input: {
  tenantId: string;
  email: string;
}): Promise<{ token: string | null }> {
  console.log("[issueMagicLinkToken] ▶️ Emitiendo magic link para:", input.email);

  try {
    console.log("[issueMagicLinkToken] Verificando tenant...");
    await ensureTenantExists(input.tenantId);

    console.log("[issueMagicLinkToken] Buscando usuario...");
    const user = await prisma.appUser.findFirst({
      where: {
        tenant_id: input.tenantId,
        email: input.email,
        deleted_at: null,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (!user) {
      console.log("[issueMagicLinkToken] Usuario no encontrado (retornando null por seguridad)");
      return { token: null };
    }

    console.log("[issueMagicLinkToken] ✓ Usuario encontrado, generando token...");
    const token = generateOpaqueToken("ml");
    const tokenHash = hashOpaqueToken(token);
    console.log("[issueMagicLinkToken] ✓ Token generado");

    console.log("[issueMagicLinkToken] Guardando token en BD...");
    await prisma.passwordResetToken.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: nowPlusMinutes(MAGIC_LINK_TTL_MINUTES),
        created_at: new Date(),
      },
    });
    console.log("[issueMagicLinkToken] ✓✓✓ Token guardado - EXITOSO");

    return { token };
  } catch (error) {
    console.error("[issueMagicLinkToken] ❌❌❌ ERROR:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function verifyMagicLinkToken(input: {
  tenantId: string;
  token: string;
}): Promise<AuthTokenResponse> {
  console.log("[verifyMagicLinkToken] ▶️ Verificando magic link token");

  try {
    console.log("[verifyMagicLinkToken] Validando prefijo del token...");
    if (!input.token.startsWith("ml_")) {
      console.error("[verifyMagicLinkToken] ❌ Token no tiene prefijo ml_");
      throw new ApiError(401, "INVALID_MAGIC_LINK", "Invalid magic link token");
    }

    console.log("[verifyMagicLinkToken] ✓ Prefijo válido, hasheando token...");
    const tokenHash = hashOpaqueToken(input.token);

    console.log("[verifyMagicLinkToken] Buscando token en BD...");
    const record = await prisma.passwordResetToken.findFirst({
      where: {
        tenant_id: input.tenantId,
        token_hash: tokenHash,
        used_at: null,
        expires_at: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!record) {
      console.error("[verifyMagicLinkToken] ❌ Token no encontrado o expirado");
      throw new ApiError(401, "INVALID_MAGIC_LINK", "Invalid or expired magic link token");
    }

    console.log("[verifyMagicLinkToken] ✓ Token encontrado, validando usuario...");
    if (record.user.deleted_at) {
      console.error("[verifyMagicLinkToken] ❌ Usuario está eliminado");
      throw new ApiError(401, "INVALID_MAGIC_LINK", "Invalid or expired magic link token");
    }

    if (record.user.status !== "ACTIVE") {
      console.error("[verifyMagicLinkToken] ❌ Usuario no está activo:", record.user.status);
      throw new ApiError(401, "INVALID_MAGIC_LINK", "Invalid or expired magic link token");
    }

    console.log("[verifyMagicLinkToken] ✓ Usuario válido, actualizando BD...");
    await prisma.$transaction(async (tx) => {
      console.log("[verifyMagicLinkToken] [TX] Marcando token como usado...");
      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { used_at: new Date() },
      });

      console.log("[verifyMagicLinkToken] [TX] Actualizando usuario...");
      await tx.appUser.update({
        where: { id: record.user_id },
        data: {
          email_verified_at: new Date(),
          last_login_at: new Date(),
          updated_at: new Date(),
        },
      });
    });

    console.log("[verifyMagicLinkToken] ✓ Issuando token...");
    const token = issueAccessToken(record.user_id, input.tenantId);
    console.log("[verifyMagicLinkToken] ✓✓✓ Token generado - EXITOSO");

    return {
      access_token: token,
      token_type: "Bearer",
      expires_in: 3600,
    };
  } catch (error) {
    console.error("[verifyMagicLinkToken] ❌❌❌ ERROR:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function issuePasswordResetToken(input: {
  tenantId: string;
  email: string;
}): Promise<{ token: string | null }> {
  console.log("[issuePasswordResetToken] ▶️ Emitiendo reset token para:", input.email);

  try {
    console.log("[issuePasswordResetToken] Verificando tenant...");
    await ensureTenantExists(input.tenantId);

    console.log("[issuePasswordResetToken] Buscando usuario...");
    const user = await prisma.appUser.findFirst({
      where: {
        tenant_id: input.tenantId,
        email: input.email,
        deleted_at: null,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (!user) {
      console.log("[issuePasswordResetToken] Usuario no encontrado (retornando null por seguridad)");
      return { token: null };
    }

    console.log("[issuePasswordResetToken] ✓ Usuario encontrado, generando token...");
    const token = generateOpaqueToken("pr");
    const tokenHash = hashOpaqueToken(token);
    console.log("[issuePasswordResetToken] ✓ Token generado");

    console.log("[issuePasswordResetToken] Guardando token en BD...");
    await prisma.passwordResetToken.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: nowPlusMinutes(RESET_TTL_MINUTES),
        created_at: new Date(),
      },
    });
    console.log("[issuePasswordResetToken] ✓✓✓ Token guardado - EXITOSO");

    return { token };
  } catch (error) {
    console.error("[issuePasswordResetToken] ❌❌❌ ERROR:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function resetPassword(input: {
  tenantId: string;
  token: string;
  password: string;
}): Promise<void> {
  console.log("[resetPassword] ▶️ Reseteando contraseña");

  try {
    console.log("[resetPassword] Validando prefijo del token...");
    if (!input.token.startsWith("pr_")) {
      console.error("[resetPassword] ❌ Token no tiene prefijo pr_");
      throw new ApiError(401, "INVALID_RESET_TOKEN", "Invalid reset token");
    }

    console.log("[resetPassword] ✓ Prefijo válido, hasheando token...");
    const tokenHash = hashOpaqueToken(input.token);

    console.log("[resetPassword] Buscando token en BD...");
    const record = await prisma.passwordResetToken.findFirst({
      where: {
        tenant_id: input.tenantId,
        token_hash: tokenHash,
        used_at: null,
        expires_at: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!record) {
      console.error("[resetPassword] ❌ Token no encontrado o expirado");
      throw new ApiError(401, "INVALID_RESET_TOKEN", "Invalid or expired reset token");
    }

    if (record.user.deleted_at) {
      console.error("[resetPassword] ❌ Usuario está eliminado");
      throw new ApiError(401, "INVALID_RESET_TOKEN", "Invalid or expired reset token");
    }

    if (record.user.status !== "ACTIVE") {
      console.error("[resetPassword] ❌ Usuario no está activo:", record.user.status);
      throw new ApiError(401, "INVALID_RESET_TOKEN", "Invalid or expired reset token");
    }

    console.log("[resetPassword] ✓ Usuario válido, hasheando nueva contraseña...");
    const passwordHash = hashPassword(input.password);
    console.log("[resetPassword] ✓ Contraseña hasheada");

    console.log("[resetPassword] ▶️ Actualizando BD en transacción...");
    await prisma.$transaction(async (tx) => {
      console.log("[resetPassword] [TX] Marcando token como usado...");
      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { used_at: new Date() },
      });

      console.log("[resetPassword] [TX] Buscando identidad de auth existente...");
      const identity = await tx.authIdentity.findFirst({
        where: {
          tenant_id: input.tenantId,
          user_id: record.user_id,
          provider: PASSWORD_PROVIDER,
        },
      });

      if (identity) {
        console.log("[resetPassword] [TX] ✓ Identidad existe, actualizando...");
        await tx.authIdentity.update({
          where: { id: identity.id },
          data: {
            password_hash: passwordHash,
            password_updated_at: new Date(),
            updated_at: new Date(),
          },
        });
        console.log("[resetPassword] [TX] ✓ Identidad actualizada");
      } else {
        console.log("[resetPassword] [TX] Identidad no existe, creando...");
        await tx.authIdentity.create({
          data: {
            id: crypto.randomUUID(),
            tenant_id: input.tenantId,
            user_id: record.user_id,
            provider: PASSWORD_PROVIDER,
            password_hash: passwordHash,
            password_updated_at: new Date(),
            mfa_enabled: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
        console.log("[resetPassword] [TX] ✓ Identidad creada");
      }
    });

    console.log("[resetPassword] ✓✓✓ Contraseña reseteada - EXITOSO");
  } catch (error) {
    console.error("[resetPassword] ❌❌❌ ERROR:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export function toPrismaKnownError(error: unknown): Prisma.PrismaClientKnownRequestError | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error;
  }
  return null;
}