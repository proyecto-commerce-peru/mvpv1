import { prisma } from "@/lib/server/db";
import { ApiError } from "@/lib/server/errors";
import { decodeCursor, encodeCursor, type CursorPayload } from "@/lib/server/pagination";
import { hashPassword } from "@/lib/server/auth/crypto";

type ListUsersInput = {
  tenantId: string;
  limit: number;
  cursor?: string;
};

export async function listUsers(input: ListUsersInput) {
  let cursorPayload: CursorPayload | undefined;

  if (input.cursor) {
    cursorPayload = decodeCursor(input.cursor);
  }

  const users = await prisma.appUser.findMany({
    where: {
      tenant_id: input.tenantId,
      deleted_at: null,
      ...(cursorPayload
        ? {
            OR: [
              { created_at: { lt: new Date(cursorPayload.created_at) } },
              {
                AND: [
                  { created_at: new Date(cursorPayload.created_at) },
                  { id: { lt: cursorPayload.id } },
                ],
              },
            ],
          }
        : {}),
    },
    include: {
      UserProfile: {
        take: 1,
      },
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: input.limit + 1,
  });

  const hasMore = users.length > input.limit;
  const pageItems = hasMore ? users.slice(0, input.limit) : users;

  const nextCursor =
    hasMore && pageItems.length > 0
      ? encodeCursor({
          created_at: pageItems[pageItems.length - 1].created_at.toISOString(),
          id: pageItems[pageItems.length - 1].id,
        })
      : null;

  return {
    items: pageItems,
    meta: {
      next_cursor: nextCursor,
      has_more: hasMore,
      limit: input.limit,
    },
  };
}

export async function getUserById(tenantId: string, id: string) {
  const user = await prisma.appUser.findFirst({
    where: {
      id,
      tenant_id: tenantId,
      deleted_at: null,
    },
    include: {
      UserProfile: {
        take: 1,
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return user;
}

export async function createUser(input: {
  tenantId: string;
  email: string;
  password: string;
  fullName: string;
  status?: string;
}) {
  const existing = await prisma.appUser.findFirst({
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
  const hash = hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const user = await tx.appUser.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        email: input.email,
        status: input.status ?? "ACTIVE",
        created_at: now,
        updated_at: now,
      },
      include: {
        UserProfile: {
          take: 1,
        },
      },
    });

    await tx.userProfile.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        user_id: user.id,
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
        user_id: user.id,
        provider: "PASSWORD",
        password_hash: hash,
        password_updated_at: now,
        mfa_enabled: false,
        created_at: now,
        updated_at: now,
      },
    });

    const hydrated = await tx.appUser.findUnique({
      where: { id: user.id },
      include: {
        UserProfile: {
          take: 1,
        },
      },
    });

    if (!hydrated) {
      throw new ApiError(500, "USER_CREATE_FAILED", "Unable to fetch created user");
    }

    return hydrated;
  });
}

export async function updateUser(
  tenantId: string,
  id: string,
  input: { email?: string; status?: string; fullName?: string; phone?: string | null },
) {
  const existing = await prisma.appUser.findFirst({
    where: {
      id,
      tenant_id: tenantId,
      deleted_at: null,
    },
    include: {
      UserProfile: {
        take: 1,
      },
    },
  });

  if (!existing) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  if (input.email && input.email !== existing.email) {
    const duplicated = await prisma.appUser.findFirst({
      where: {
        tenant_id: tenantId,
        email: input.email,
        deleted_at: null,
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicated) {
      throw new ApiError(409, "EMAIL_IN_USE", "Email already in use");
    }
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.appUser.update({
      where: { id },
      data: {
        email: input.email,
        status: input.status,
        updated_at: now,
      },
    });

    const profile = existing.UserProfile[0];
    if (profile && (input.fullName !== undefined || input.phone !== undefined)) {
      await tx.userProfile.update({
        where: { id: profile.id },
        data: {
          full_name: input.fullName,
          phone: input.phone,
          updated_at: now,
        },
      });
    }

    const hydrated = await tx.appUser.findUnique({
      where: { id },
      include: {
        UserProfile: {
          take: 1,
        },
      },
    });

    if (!hydrated) {
      throw new ApiError(500, "USER_UPDATE_FAILED", "Unable to fetch updated user");
    }

    return hydrated;
  });

  return updated;
}

export async function softDeleteUser(tenantId: string, id: string): Promise<void> {
  const existing = await prisma.appUser.findFirst({
    where: {
      id,
      tenant_id: tenantId,
      deleted_at: null,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  await prisma.appUser.update({
    where: { id },
    data: {
      status: "INACTIVE",
      deleted_at: new Date(),
      updated_at: new Date(),
    },
  });
}