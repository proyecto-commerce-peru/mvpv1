import { prisma } from "@/lib/server/db";
import type { Session } from "@/lib/auth";

export async function resolveSessionUser(
  session: Pick<Session, "user"> | null | undefined
) {
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      id: userId,
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
      tenant_id: true,
      status: true,
    },
  });
}

export async function resolveSessionTenantId(
  session: Pick<Session, "user"> | null | undefined
): Promise<string | null> {
  const user = await resolveSessionUser(session);
  return user?.tenant_id ?? null;
}
