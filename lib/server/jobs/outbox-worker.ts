import { prisma } from "@/lib/server/db";
import { ApiError } from "@/lib/server/errors";
import { sendMetaTextMessage } from "@/lib/server/whatsapp/meta-provider";
import { parseMetaIncomingMessages } from "@/lib/server/whatsapp/webhook-parser";

function nextBackoffMinutes(attempts: number): number {
  if (attempts <= 1) return 1;
  if (attempts <= 3) return 5;
  if (attempts <= 5) return 15;
  return 60;
}

async function processSendMessage(eventId: string) {
  const event = await prisma.outboxEvent.findUnique({ where: { id: eventId } });
  if (!event) return;

  const payload = event.payload as {
    message_id?: string;
    conversation_id?: string;
    text?: string;
  };

  if (!payload.message_id || !payload.conversation_id || !payload.text) {
    throw new ApiError(422, "OUTBOX_PAYLOAD_INVALID", "Invalid whatsapp.message.send payload");
  }

  const message = await prisma.whatsappMessage.findFirst({
    where: {
      id: payload.message_id,
      tenant_id: event.tenant_id,
    },
    include: {
      conversation: {
        include: {
          whatsappAccount: true,
          customer: true,
        },
      },
    },
  });

  if (!message) {
    throw new ApiError(404, "MESSAGE_NOT_FOUND", "Outbound message not found");
  }

  const account = message.conversation.whatsappAccount;
  const customer = message.conversation.customer;

  const providerResponse = await sendMetaTextMessage({
    phoneNumberId: account.phone_number_id,
    recipientPhoneE164: customer.phone_e164,
    text: payload.text,
  });

  await prisma.whatsappMessage.update({
    where: { id: message.id },
    data: {
      provider_message_id: providerResponse.provider_message_id,
      status: "SENT",
    },
  });
}

async function processWebhook(eventId: string) {
  const event = await prisma.outboxEvent.findUnique({ where: { id: eventId } });
  if (!event) return;

  const payload = event.payload as { external_id?: string };
  if (!payload.external_id) {
    throw new ApiError(422, "OUTBOX_PAYLOAD_INVALID", "Invalid whatsapp.webhook.process payload");
  }

  const webhook = await prisma.webhookEvent.findFirst({
    where: {
      tenant_id: event.tenant_id,
      external_id: payload.external_id,
      provider: "META_CLOUD_API",
    },
  });

  if (!webhook) {
    throw new ApiError(404, "WEBHOOK_EVENT_NOT_FOUND", "Webhook event not found");
  }

  const incoming = parseMetaIncomingMessages(webhook.payload);

  for (const msg of incoming) {
    const account = await prisma.whatsappAccount.findFirst({
      where: {
        tenant_id: event.tenant_id,
        phone_number_id: msg.phone_number_id,
      },
    });

    if (!account) {
      continue;
    }

    let customer = await prisma.customer.findFirst({
      where: {
        tenant_id: event.tenant_id,
        phone_e164: msg.from,
        deleted_at: null,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          id: crypto.randomUUID(),
          tenant_id: event.tenant_id,
          phone_e164: msg.from,
          status: "ACTIVE",
          marketing_opt_in: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    let conversation = await prisma.whatsappConversation.findFirst({
      where: {
        tenant_id: event.tenant_id,
        whatsapp_account_id: account.id,
        customer_id: customer.id,
      },
    });

    if (!conversation) {
      conversation = await prisma.whatsappConversation.create({
        data: {
          id: crypto.randomUUID(),
          tenant_id: event.tenant_id,
          whatsapp_account_id: account.id,
          customer_id: customer.id,
          wa_conversation_id: null,
          status: "OPEN",
          last_message_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    const exists = await prisma.whatsappMessage.findFirst({
      where: {
        tenant_id: event.tenant_id,
        provider_message_id: msg.external_id,
      },
      select: { id: true },
    });

    if (exists) {
      continue;
    }

    await prisma.whatsappMessage.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: event.tenant_id,
        conversation_id: conversation.id,
        direction: "INBOUND",
        message_type: "TEXT",
        provider_message_id: msg.external_id,
        text_body: msg.text,
        payload: msg.raw as never,
        status: "RECEIVED",
        sent_at: new Date(),
        created_at: new Date(),
      },
    });

    await prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data: {
        last_message_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  await prisma.webhookEvent.update({
    where: { id: webhook.id },
    data: {
      status: "PROCESSED",
      processed_at: new Date(),
    },
  });
}

export async function processOutboxBatch(limit = 20): Promise<{ processed: number; failed: number }> {
  const events = await prisma.outboxEvent.findMany({
    where: {
      status: "PENDING",
      available_at: { lte: new Date() },
    },
    orderBy: [{ created_at: "asc" }],
    take: limit,
  });

  let processed = 0;
  let failed = 0;

  for (const event of events) {
    try {
      if (event.topic === "whatsapp.message.send") {
        await processSendMessage(event.id);
      } else if (event.topic === "whatsapp.webhook.process") {
        await processWebhook(event.id);
      }

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "SENT",
          sent_at: new Date(),
        },
      });

      processed += 1;
    } catch (error) {
      const attempts = event.attempts + 1;
      const delayMin = nextBackoffMinutes(attempts);
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          attempts,
          last_error: error instanceof Error ? error.message : "unknown error",
          available_at: new Date(Date.now() + delayMin * 60_000),
        },
      });
      failed += 1;
    }
  }

  return { processed, failed };
}