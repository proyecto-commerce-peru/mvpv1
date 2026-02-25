import { prisma } from "@/lib/server/db";
import { ApiError } from "@/lib/server/errors";
import { decodeCursor, encodeCursor } from "@/lib/server/pagination";
import { parseDecimalInput } from "@/lib/server/decimal";

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

export async function listPaymentMethods(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.paymentMethod.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createPaymentMethod(input: {
  tenantId: string;
  provider: string;
  name: string;
  isActive?: boolean;
  config?: unknown;
}) {
  const now = new Date();
  return prisma.paymentMethod.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      provider: input.provider,
      name: input.name,
      is_active: input.isActive ?? true,
      config: input.config as never,
      created_at: now,
      updated_at: now,
    },
  });
}

export async function updatePaymentMethod(tenantId: string, id: string, input: {
  provider?: string;
  name?: string;
  isActive?: boolean;
  config?: unknown;
}) {
  const existing = await prisma.paymentMethod.findFirst({ where: { id, tenant_id: tenantId }, select: { id: true } });
  if (!existing) {
    throw new ApiError(404, "PAYMENT_METHOD_NOT_FOUND", "Payment method not found");
  }

  return prisma.paymentMethod.update({
    where: { id },
    data: {
      provider: input.provider,
      name: input.name,
      is_active: input.isActive,
      config: input.config as never,
      updated_at: new Date(),
    },
  });
}

export async function listPayments(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.payment.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createPayment(input: {
  tenantId: string;
  orderId: string;
  methodId: string;
  amount: unknown;
  currencyCode?: string;
  providerPaymentId?: string;
  idempotencyKey: string;
  providerPayload?: unknown;
  status?: string;
  paidAt?: Date;
}) {
  const order = await prisma.order.findFirst({ where: { id: input.orderId, tenant_id: input.tenantId }, select: { id: true } });
  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  const method = await prisma.paymentMethod.findFirst({ where: { id: input.methodId, tenant_id: input.tenantId }, select: { id: true } });
  if (!method) {
    throw new ApiError(404, "PAYMENT_METHOD_NOT_FOUND", "Payment method not found");
  }

  const now = new Date();
  return prisma.payment.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      order_id: input.orderId,
      method_id: input.methodId,
      status: input.status ?? "PENDING",
      amount: parseDecimalInput(input.amount, "amount"),
      currency_code: input.currencyCode ?? "PEN",
      provider_payment_id: input.providerPaymentId,
      idempotency_key: input.idempotencyKey,
      provider_payload: input.providerPayload as never,
      paid_at: input.paidAt,
      created_at: now,
      updated_at: now,
    },
  });
}

export async function getPaymentById(tenantId: string, id: string) {
  const payment = await prisma.payment.findFirst({ where: { id, tenant_id: tenantId } });
  if (!payment) {
    throw new ApiError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }
  return payment;
}

export async function updatePayment(tenantId: string, id: string, input: {
  status?: string;
  providerPaymentId?: string | null;
  providerPayload?: unknown;
  paidAt?: Date | null;
}) {
  await getPaymentById(tenantId, id);
  return prisma.payment.update({
    where: { id },
    data: {
      status: input.status,
      provider_payment_id: input.providerPaymentId === undefined ? undefined : input.providerPaymentId,
      provider_payload: input.providerPayload as never,
      paid_at: input.paidAt === undefined ? undefined : input.paidAt,
      updated_at: new Date(),
    },
  });
}