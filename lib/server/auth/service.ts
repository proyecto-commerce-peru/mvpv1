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
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || tenant.deleted_at) {
    throw new ApiError(404, "TENANT_NOT_FOUND", "Tenant not found");
  }
}

export async function registerWithPassword(input: {
  tenantId: string;
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthTokenResponse> {
  await ensureTenantExists(input.tenantId);

  const existing = await prisma.user.findFirst({
    where: {
      tenant_id: input.tenantId,
      email: input.email,
      deleted_at: null,
    },
    select: { id: true },
  });

  if (existing) {
    throw new ApiError(409, "USER_EXISTS", "User already exists");
  }

  const now = new Date();
  const passwordHash = hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        email: input.email,
        status: "ACTIVE",
        created_at: now,
        updated_at: now,
      },
    });

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

    return created;
  });

  return {
    access_token: issueAccessToken(user.id, input.tenantId),
    token_type: "Bearer",
    expires_in: 3600,
  };
}

export async function loginWithPassword(input: {
  tenantId: string;
  email: string;
  password: string;
}): Promise<AuthTokenResponse> {
  await ensureTenantExists(input.tenantId);

  const user = await prisma.user.findFirst({
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
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const identity = user.AuthIdentity[0];
  if (!identity?.password_hash || !verifyPassword(input.password, identity.password_hash)) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date(), updated_at: new Date() },
  });

  return {
    access_token: issueAccessToken(user.id, input.tenantId),
    token_type: "Bearer",
    expires_in: 3600,
  };
}

export async function issueMagicLinkToken(input: {
  tenantId: string;
  email: string;
}): Promise<{ token: string | null }> {
  await ensureTenantExists(input.tenantId);

  const user = await prisma.user.findFirst({
    where: {
      tenant_id: input.tenantId,
      email: input.email,
      deleted_at: null,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!user) {
    return { token: null };
  }

  const token = generateOpaqueToken("ml");
  const tokenHash = hashOpaqueToken(token);

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

  return { token };
}

export async function verifyMagicLinkToken(input: {
  tenantId: string;
  token: string;
}): Promise<AuthTokenResponse> {
  if (!input.token.startsWith("ml_")) {
    throw new ApiError(401, "INVALID_MAGIC_LINK", "Invalid magic link token");
  }

  const tokenHash = hashOpaqueToken(input.token);

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

  if (!record || record.user.deleted_at || record.user.status !== "ACTIVE") {
    throw new ApiError(401, "INVALID_MAGIC_LINK", "Invalid or expired magic link token");
  }

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.update({
      where: { id: record.id },
      data: { used_at: new Date() },
    });

    await tx.user.update({
      where: { id: record.user_id },
      data: {
        email_verified_at: new Date(),
        last_login_at: new Date(),
        updated_at: new Date(),
      },
    });
  });

  return {
    access_token: issueAccessToken(record.user_id, input.tenantId),
    token_type: "Bearer",
    expires_in: 3600,
  };
}

export async function issuePasswordResetToken(input: {
  tenantId: string;
  email: string;
}): Promise<{ token: string | null }> {
  await ensureTenantExists(input.tenantId);

  const user = await prisma.user.findFirst({
    where: {
      tenant_id: input.tenantId,
      email: input.email,
      deleted_at: null,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!user) {
    return { token: null };
  }

  const token = generateOpaqueToken("pr");
  const tokenHash = hashOpaqueToken(token);

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

  return { token };
}

export async function resetPassword(input: {
  tenantId: string;
  token: string;
  password: string;
}): Promise<void> {
  if (!input.token.startsWith("pr_")) {
    throw new ApiError(401, "INVALID_RESET_TOKEN", "Invalid reset token");
  }

  const tokenHash = hashOpaqueToken(input.token);

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

  if (!record || record.user.deleted_at || record.user.status !== "ACTIVE") {
    throw new ApiError(401, "INVALID_RESET_TOKEN", "Invalid or expired reset token");
  }

  const passwordHash = hashPassword(input.password);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.update({
      where: { id: record.id },
      data: { used_at: new Date() },
    });

    const identity = await tx.authIdentity.findFirst({
      where: {
        tenant_id: input.tenantId,
        user_id: record.user_id,
        provider: PASSWORD_PROVIDER,
      },
    });

    if (identity) {
      await tx.authIdentity.update({
        where: { id: identity.id },
        data: {
          password_hash: passwordHash,
          password_updated_at: new Date(),
          updated_at: new Date(),
        },
      });
    } else {
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
    }
  });
}

export function toPrismaKnownError(error: unknown): Prisma.PrismaClientKnownRequestError | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error;
  }
  return null;
}