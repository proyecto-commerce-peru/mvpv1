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

function pageMeta<T extends { id: string; created_at: Date }>(items: T[], limit: number) {
  const hasMore = items.length > limit;
  const rows = hasMore ? items.slice(0, limit) : items;
  const next = hasMore
    ? encodeCursor({
        id: rows[rows.length - 1].id,
        created_at: rows[rows.length - 1].created_at.toISOString(),
      })
    : null;

  return {
    rows,
    meta: {
      has_more: hasMore,
      next_cursor: next,
      limit,
    },
  };
}

export async function listCategories(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.category.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return pageMeta(items, limit);
}

export async function createCategory(input: {
  tenantId: string;
  catalogId: string;
  name: string;
  slug: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const existing = await prisma.category.findFirst({
    where: {
      catalog_id: input.catalogId,
      slug: input.slug,
    },
    select: { id: true },
  });

  if (existing) {
    throw new ApiError(409, "CATEGORY_SLUG_EXISTS", "Category slug already exists in catalog");
  }

  return prisma.category.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      catalog_id: input.catalogId,
      parent_id: input.parentId,
      name: input.name,
      slug: input.slug,
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function listOfferings(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.storeOffering.findMany({
    where: {
      tenant_id: tenantId,
      deleted_at: null,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return pageMeta(items, limit);
}

export async function createOffering(input: {
  tenantId: string;
  catalogId: string;
  type: string;
  title: string;
  description?: string;
  handle?: string;
  currencyCode?: string;
  isTaxIncluded?: boolean;
}) {
  return prisma.storeOffering.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      catalog_id: input.catalogId,
      type: input.type,
      title: input.title,
      description: input.description,
      handle: input.handle,
      currency_code: input.currencyCode ?? "PEN",
      is_tax_included: input.isTaxIncluded ?? true,
      status: "ACTIVE",
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function listVariants(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.storeVariant.findMany({
    where: {
      tenant_id: tenantId,
      deleted_at: null,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return pageMeta(items, limit);
}

export async function createVariant(input: {
  tenantId: string;
  offeringId: string;
  sku?: string;
  barcode?: string;
  priceFinal: unknown;
  taxRate?: unknown;
}) {
  const offering = await prisma.storeOffering.findFirst({
    where: { id: input.offeringId, tenant_id: input.tenantId, deleted_at: null },
    select: { id: true },
  });

  if (!offering) {
    throw new ApiError(404, "OFFERING_NOT_FOUND", "Offering not found");
  }

  return prisma.storeVariant.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      offering_id: input.offeringId,
      sku: input.sku,
      barcode: input.barcode,
      status: "ACTIVE",
      price_final: parseDecimalInput(input.priceFinal, "price_final"),
      tax_rate: parseDecimalInput(input.taxRate ?? 0, "tax_rate"),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function listPrices(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.price.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return pageMeta(items, limit);
}

export async function createPrice(input: {
  tenantId: string;
  priceListId: string;
  offeringId?: string;
  variantId?: string;
  listPrice?: unknown;
  salePrice: unknown;
  isActive?: boolean;
}) {
  return prisma.price.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      price_list_id: input.priceListId,
      offering_id: input.offeringId,
      variant_id: input.variantId,
      list_price: input.listPrice === undefined ? null : parseDecimalInput(input.listPrice, "list_price"),
      sale_price: parseDecimalInput(input.salePrice, "sale_price"),
      is_active: input.isActive ?? true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}
