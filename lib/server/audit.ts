import { prisma } from "@/lib/server/db";

export async function writeAuditLog(input: {
  tenantId: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}) {
  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      actor_user_id: input.actorUserId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      before: input.before as never,
      after: input.after as never,
      ip: input.ip,
      user_agent: input.userAgent,
      created_at: new Date(),
    },
  });
}