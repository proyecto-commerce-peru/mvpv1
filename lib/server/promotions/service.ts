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

export async function listCoupons(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.coupon.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createCoupon(input: {
  tenantId: string;
  code: string;
  discountType: string;
  discountValue: unknown;
  status?: string;
  minOrderTotal?: unknown;
  maxUses?: number;
  startsAt?: Date;
  endsAt?: Date;
}) {
  const now = new Date();
  return prisma.coupon.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      code: input.code,
      status: input.status ?? "ACTIVE",
      discount_type: input.discountType,
      discount_value: parseDecimalInput(input.discountValue, "discount_value"),
      min_order_total: input.minOrderTotal === undefined ? null : parseDecimalInput(input.minOrderTotal, "min_order_total"),
      max_uses: input.maxUses,
      used_count: 0,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      created_at: now,
      updated_at: now,
    },
  });
}

export async function getCouponById(tenantId: string, id: string) {
  const coupon = await prisma.coupon.findFirst({ where: { id, tenant_id: tenantId } });
  if (!coupon) {
    throw new ApiError(404, "COUPON_NOT_FOUND", "Coupon not found");
  }
  return coupon;
}

export async function updateCoupon(tenantId: string, id: string, input: {
  code?: string;
  status?: string;
  discountType?: string;
  discountValue?: unknown;
  minOrderTotal?: unknown | null;
  maxUses?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
}) {
  await getCouponById(tenantId, id);

  return prisma.coupon.update({
    where: { id },
    data: {
      code: input.code,
      status: input.status,
      discount_type: input.discountType,
      discount_value: input.discountValue === undefined ? undefined : parseDecimalInput(input.discountValue, "discount_value"),
      min_order_total:
        input.minOrderTotal === undefined
          ? undefined
          : input.minOrderTotal === null
            ? null
            : parseDecimalInput(input.minOrderTotal, "min_order_total"),
      max_uses: input.maxUses === undefined ? undefined : input.maxUses,
      starts_at: input.startsAt === undefined ? undefined : input.startsAt,
      ends_at: input.endsAt === undefined ? undefined : input.endsAt,
      updated_at: new Date(),
    },
  });
}

export async function deleteCoupon(tenantId: string, id: string) {
  await getCouponById(tenantId, id);
  await prisma.coupon.delete({ where: { id } });
}

export async function listCouponRules(tenantId: string, couponId: string) {
  await getCouponById(tenantId, couponId);
  return prisma.couponRule.findMany({
    where: {
      tenant_id: tenantId,
      coupon_id: couponId,
    },
    orderBy: [{ id: "desc" }],
  });
}

export async function createCouponRule(input: {
  tenantId: string;
  couponId: string;
  scope: string;
  ruleType: string;
  offeringId?: string;
  categoryId?: string;
  rule?: unknown;
}) {
  await getCouponById(input.tenantId, input.couponId);

  return prisma.couponRule.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      coupon_id: input.couponId,
      scope: input.scope,
      offering_id: input.offeringId,
      category_id: input.categoryId,
      rule_type: input.ruleType,
      rule: input.rule as never,
    },
  });
}

export async function updateCouponRule(input: {
  tenantId: string;
  couponId: string;
  ruleId: string;
  scope?: string;
  ruleType?: string;
  offeringId?: string | null;
  categoryId?: string | null;
  rule?: unknown;
}) {
  await getCouponById(input.tenantId, input.couponId);

  const existing = await prisma.couponRule.findFirst({
    where: {
      id: input.ruleId,
      tenant_id: input.tenantId,
      coupon_id: input.couponId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError(404, "COUPON_RULE_NOT_FOUND", "Coupon rule not found");
  }

  return prisma.couponRule.update({
    where: { id: input.ruleId },
    data: {
      scope: input.scope,
      rule_type: input.ruleType,
      offering_id: input.offeringId === undefined ? undefined : input.offeringId,
      category_id: input.categoryId === undefined ? undefined : input.categoryId,
      rule: input.rule as never,
    },
  });
}

export async function deleteCouponRule(tenantId: string, couponId: string, ruleId: string) {
  await getCouponById(tenantId, couponId);

  const existing = await prisma.couponRule.findFirst({
    where: {
      id: ruleId,
      tenant_id: tenantId,
      coupon_id: couponId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError(404, "COUPON_RULE_NOT_FOUND", "Coupon rule not found");
  }

  await prisma.couponRule.delete({ where: { id: ruleId } });
}