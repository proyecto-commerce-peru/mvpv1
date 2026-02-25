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

export async function getMembershipPlanByOffering(tenantId: string, offeringId: string) {
  return prisma.membershipPlan.findFirst({
    where: {
      tenant_id: tenantId,
      offering_id: offeringId,
    },
  });
}

export async function upsertMembershipPlan(input: {
  tenantId: string;
  offeringId: string;
  billingType: string;
  periodUnit?: string;
  periodCount?: number;
  validityDays?: number;
  creditsIncluded?: number;
  rolloverCredits?: boolean;
  trialDays?: number;
  entitlements?: unknown;
}) {
  const offering = await prisma.storeOffering.findFirst({
    where: {
      id: input.offeringId,
      tenant_id: input.tenantId,
      deleted_at: null,
    },
    select: { id: true },
  });

  if (!offering) {
    throw new ApiError(404, "OFFERING_NOT_FOUND", "Offering not found");
  }

  const now = new Date();
  const existing = await getMembershipPlanByOffering(input.tenantId, input.offeringId);

  if (!existing) {
    return prisma.membershipPlan.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        offering_id: input.offeringId,
        billing_type: input.billingType,
        period_unit: input.periodUnit,
        period_count: input.periodCount,
        validity_days: input.validityDays,
        credits_included: input.creditsIncluded,
        rollover_credits: input.rolloverCredits ?? false,
        trial_days: input.trialDays ?? 0,
        entitlements: input.entitlements as never,
        created_at: now,
        updated_at: now,
      },
    });
  }

  return prisma.membershipPlan.update({
    where: { id: existing.id },
    data: {
      billing_type: input.billingType,
      period_unit: input.periodUnit,
      period_count: input.periodCount,
      validity_days: input.validityDays,
      credits_included: input.creditsIncluded,
      rollover_credits: input.rolloverCredits,
      trial_days: input.trialDays,
      entitlements: input.entitlements as never,
      updated_at: now,
    },
  });
}

export async function listCustomerMemberships(tenantId: string, customerId: string, limit: number, cursor?: string) {
  const customer = await prisma.customer.findFirst({ where: { id: customerId, tenant_id: tenantId }, select: { id: true } });
  if (!customer) {
    throw new ApiError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
  }

  const items = await prisma.customerMembership.findMany({
    where: {
      tenant_id: tenantId,
      customer_id: customerId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createCustomerMembership(input: {
  tenantId: string;
  customerId: string;
  membershipPlanId: string;
  orderId?: string;
  status?: string;
  startedAt: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  expiresAt?: Date;
  creditsBalance?: number;
  autoRenew?: boolean;
  metadata?: unknown;
}) {
  const customer = await prisma.customer.findFirst({ where: { id: input.customerId, tenant_id: input.tenantId }, select: { id: true } });
  if (!customer) {
    throw new ApiError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
  }

  const plan = await prisma.membershipPlan.findFirst({ where: { id: input.membershipPlanId, tenant_id: input.tenantId }, select: { id: true } });
  if (!plan) {
    throw new ApiError(404, "MEMBERSHIP_PLAN_NOT_FOUND", "Membership plan not found");
  }

  const now = new Date();
  return prisma.customerMembership.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      customer_id: input.customerId,
      membership_plan_id: input.membershipPlanId,
      order_id: input.orderId,
      status: input.status ?? "ACTIVE",
      started_at: input.startedAt,
      current_period_start: input.currentPeriodStart,
      current_period_end: input.currentPeriodEnd,
      expires_at: input.expiresAt,
      credits_balance: input.creditsBalance ?? 0,
      auto_renew: input.autoRenew ?? false,
      metadata: input.metadata as never,
      created_at: now,
      updated_at: now,
    },
  });
}

export async function updateCustomerMembership(tenantId: string, id: string, input: {
  status?: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  expiresAt?: Date | null;
  creditsBalance?: number;
  autoRenew?: boolean;
  metadata?: unknown;
}) {
  const existing = await prisma.customerMembership.findFirst({ where: { id, tenant_id: tenantId }, select: { id: true } });
  if (!existing) {
    throw new ApiError(404, "CUSTOMER_MEMBERSHIP_NOT_FOUND", "Customer membership not found");
  }

  return prisma.customerMembership.update({
    where: { id },
    data: {
      status: input.status,
      current_period_start: input.currentPeriodStart === undefined ? undefined : input.currentPeriodStart,
      current_period_end: input.currentPeriodEnd === undefined ? undefined : input.currentPeriodEnd,
      expires_at: input.expiresAt === undefined ? undefined : input.expiresAt,
      credits_balance: input.creditsBalance,
      auto_renew: input.autoRenew,
      metadata: input.metadata as never,
      updated_at: new Date(),
    },
  });
}