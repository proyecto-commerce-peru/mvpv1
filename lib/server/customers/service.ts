import { prisma } from "@/lib/server/db";
import { ApiError } from "@/lib/server/errors";
import { encodeCursor, decodeCursor } from "@/lib/server/pagination";

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

function toPage<T extends { id: string; created_at: Date }>(items: T[], limit: number) {
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

export async function listCustomers(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.customer.findMany({
    where: {
      tenant_id: tenantId,
      deleted_at: null,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return toPage(items, limit);
}

export async function createCustomer(input: {
  tenantId: string;
  fullName?: string;
  phoneE164: string;
  email?: string;
  marketingOptIn?: boolean;
}) {
  const duplicated = await prisma.customer.findFirst({
    where: { tenant_id: input.tenantId, phone_e164: input.phoneE164, deleted_at: null },
    select: { id: true },
  });

  if (duplicated) {
    throw new ApiError(409, "CUSTOMER_EXISTS", "Customer phone already exists");
  }

  return prisma.customer.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      full_name: input.fullName,
      phone_e164: input.phoneE164,
      email: input.email,
      marketing_opt_in: input.marketingOptIn ?? false,
      status: "ACTIVE",
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function createAddress(input: {
  tenantId: string;
  customerId: string;
  label?: string;
  countryCode?: string;
  city?: string;
  district?: string;
  addressLine1: string;
  addressLine2?: string;
  reference?: string;
  postalCode?: string;
  isDefault?: boolean;
}) {
  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, tenant_id: input.tenantId, deleted_at: null },
    select: { id: true },
  });

  if (!customer) {
    throw new ApiError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
  }

  if (input.isDefault) {
    await prisma.customerAddress.updateMany({
      where: {
        tenant_id: input.tenantId,
        customer_id: input.customerId,
        is_default: true,
      },
      data: {
        is_default: false,
        updated_at: new Date(),
      },
    });
  }

  return prisma.customerAddress.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      customer_id: input.customerId,
      label: input.label,
      country_code: input.countryCode ?? "PE",
      city: input.city,
      district: input.district,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2,
      reference: input.reference,
      postal_code: input.postalCode,
      is_default: input.isDefault ?? false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function listTags(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.tag.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: limit + 1,
  });

  const hasMore = items.length > limit;
  const rows = hasMore ? items.slice(0, limit) : items;

  return {
    rows,
    meta: {
      has_more: hasMore,
      next_cursor: null,
      limit,
    },
  };
}

export async function createTag(tenantId: string, name: string) {
  const duplicated = await prisma.tag.findFirst({
    where: {
      tenant_id: tenantId,
      name,
    },
    select: { id: true },
  });

  if (duplicated) {
    throw new ApiError(409, "TAG_EXISTS", "Tag already exists");
  }

  return prisma.tag.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      name,
    },
  });
}