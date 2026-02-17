import { prisma } from "@/lib/server/db";
import { ApiError } from "@/lib/server/errors";
import { decodeCursor, encodeCursor } from "@/lib/server/pagination";

function cursorWhere(cursor?: string) {
  if (!cursor) {
    return {};
  }

  const payload = decodeCursor(cursor);
  return {
    OR: [
      { created_at: { lt: new Date(payload.created_at) } },
      {
        AND: [{ created_at: new Date(payload.created_at) }, { id: { lt: payload.id } }],
      },
    ],
  };
}

function page<T extends { id: string; created_at: Date }>(items: T[], limit: number) {
  const hasMore = items.length > limit;
  const rows = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore
    ? encodeCursor({
        id: rows[rows.length - 1].id,
        created_at: rows[rows.length - 1].created_at.toISOString(),
      })
    : null;

  return {
    rows,
    meta: {
      has_more: hasMore,
      next_cursor: nextCursor,
      limit,
    },
  };
}

export async function listWhatsappAccounts(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.whatsappAccount.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createWhatsappAccount(input: {
  tenantId: string;
  storeId?: string;
  provider: string;
  phoneNumberId: string;
  wabaId?: string;
  displayPhone?: string;
  config?: unknown;
}) {
  const duplicated = await prisma.whatsappAccount.findFirst({
    where: { tenant_id: input.tenantId, phone_number_id: input.phoneNumberId },
    select: { id: true },
  });

  if (duplicated) {
    throw new ApiError(409, "WHATSAPP_ACCOUNT_EXISTS", "phone_number_id already exists");
  }

  return prisma.whatsappAccount.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      store_id: input.storeId,
      provider: input.provider,
      phone_number_id: input.phoneNumberId,
      waba_id: input.wabaId,
      display_phone: input.displayPhone,
      config: (input.config ?? null) as never,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function listConversations(tenantId: string, limit: number, cursor?: string) {
  const whereCursor = cursor
    ? (() => {
        const payload = decodeCursor(cursor);
        return {
          OR: [
            { last_message_at: { lt: new Date(payload.created_at) } },
            {
              AND: [{ last_message_at: new Date(payload.created_at) }, { id: { lt: payload.id } }],
            },
          ],
        };
      })()
    : {};

  const items = await prisma.whatsappConversation.findMany({
    where: {
      tenant_id: tenantId,
      ...whereCursor,
    },
    orderBy: [{ last_message_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(
    items.map((it) => ({
      ...it,
      created_at: it.last_message_at ?? it.created_at,
    })),
    limit,
  );
}

export async function listMessages(tenantId: string, conversationId: string, limit: number, cursor?: string) {
  const conversation = await prisma.whatsappConversation.findFirst({
    where: { id: conversationId, tenant_id: tenantId },
    select: { id: true },
  });

  if (!conversation) {
    throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
  }

  const items = await prisma.whatsappMessage.findMany({
    where: {
      tenant_id: tenantId,
      conversation_id: conversationId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function sendMessage(input: {
  tenantId: string;
  conversationId: string;
  textBody: string;
}) {
  const conversation = await prisma.whatsappConversation.findFirst({
    where: {
      id: input.conversationId,
      tenant_id: input.tenantId,
    },
    select: { id: true },
  });

  if (!conversation) {
    throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
  }

  const now = new Date();

  const message = await prisma.whatsappMessage.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      conversation_id: input.conversationId,
      direction: "OUTBOUND",
      message_type: "TEXT",
      text_body: input.textBody,
      status: "SENT",
      sent_at: now,
      created_at: now,
    },
  });

  await prisma.whatsappConversation.update({
    where: { id: input.conversationId },
    data: {
      last_message_at: now,
      updated_at: now,
    },
  });

  await prisma.outboxEvent.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      topic: "whatsapp.message.send",
      payload: {
        message_id: message.id,
        conversation_id: input.conversationId,
        text: input.textBody,
      } as never,
      status: "PENDING",
      available_at: now,
      attempts: 0,
      created_at: now,
    },
  });

  return message;
}

export async function ingestMetaWebhook(input: {
  tenantId: string;
  eventType: string;
  externalId: string;
  payload: unknown;
}) {
  const exists = await prisma.webhookEvent.findFirst({
    where: {
      tenant_id: input.tenantId,
      provider: "META_CLOUD_API",
      external_id: input.externalId,
    },
    select: { id: true },
  });

  if (exists) {
    return { duplicated: true };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.webhookEvent.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        provider: "META_CLOUD_API",
        event_type: input.eventType,
        external_id: input.externalId,
        payload: input.payload as never,
        received_at: now,
        status: "RECEIVED",
      },
    });

    await tx.outboxEvent.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        topic: "whatsapp.webhook.process",
        payload: {
          external_id: input.externalId,
          event_type: input.eventType,
        } as never,
        status: "PENDING",
        available_at: now,
        attempts: 0,
        created_at: now,
      },
    });
  });

  return { duplicated: false };
}