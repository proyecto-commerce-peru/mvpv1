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

export async function getCategoryById(tenantId: string, id: string) {
  const category = await prisma.category.findFirst({ where: { id, tenant_id: tenantId } });
  if (!category) {
    throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }
  return category;
}

export async function updateCategory(tenantId: string, id: string, input: {
  name?: string;
  slug?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  await getCategoryById(tenantId, id);

  return prisma.category.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      parent_id: input.parentId === undefined ? undefined : input.parentId,
      sort_order: input.sortOrder,
      is_active: input.isActive,
      updated_at: new Date(),
    },
  });
}

export async function deleteCategory(tenantId: string, id: string) {
  await getCategoryById(tenantId, id);
  await prisma.category.delete({ where: { id } });
}

export async function getOfferingById(tenantId: string, id: string) {
  const offering = await prisma.storeOffering.findFirst({
    where: {
      id,
      tenant_id: tenantId,
      deleted_at: null,
    },
  });
  if (!offering) {
    throw new ApiError(404, "OFFERING_NOT_FOUND", "Offering not found");
  }
  return offering;
}

export async function updateOffering(tenantId: string, id: string, input: {
  title?: string;
  description?: string | null;
  handle?: string | null;
  status?: string;
  currencyCode?: string;
  isTaxIncluded?: boolean;
}) {
  await getOfferingById(tenantId, id);
  return prisma.storeOffering.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description === undefined ? undefined : input.description,
      handle: input.handle === undefined ? undefined : input.handle,
      status: input.status,
      currency_code: input.currencyCode,
      is_tax_included: input.isTaxIncluded,
      updated_at: new Date(),
    },
  });
}

export async function softDeleteOffering(tenantId: string, id: string) {
  await getOfferingById(tenantId, id);
  await prisma.storeOffering.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function getVariantById(tenantId: string, id: string) {
  const variant = await prisma.storeVariant.findFirst({
    where: {
      id,
      tenant_id: tenantId,
      deleted_at: null,
    },
  });
  if (!variant) {
    throw new ApiError(404, "VARIANT_NOT_FOUND", "Variant not found");
  }
  return variant;
}

export async function updateVariant(tenantId: string, id: string, input: {
  sku?: string | null;
  barcode?: string | null;
  status?: string;
  priceFinal?: unknown;
  taxRate?: unknown;
}) {
  await getVariantById(tenantId, id);
  return prisma.storeVariant.update({
    where: { id },
    data: {
      sku: input.sku === undefined ? undefined : input.sku,
      barcode: input.barcode === undefined ? undefined : input.barcode,
      status: input.status,
      price_final: input.priceFinal === undefined ? undefined : parseDecimalInput(input.priceFinal, "price_final"),
      tax_rate: input.taxRate === undefined ? undefined : parseDecimalInput(input.taxRate, "tax_rate"),
      updated_at: new Date(),
    },
  });
}

export async function softDeleteVariant(tenantId: string, id: string) {
  await getVariantById(tenantId, id);
  await prisma.storeVariant.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function getPriceById(tenantId: string, id: string) {
  const price = await prisma.price.findFirst({ where: { id, tenant_id: tenantId } });
  if (!price) {
    throw new ApiError(404, "PRICE_NOT_FOUND", "Price not found");
  }
  return price;
}

export async function updatePrice(tenantId: string, id: string, input: {
  listPrice?: unknown | null;
  salePrice?: unknown;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
}) {
  await getPriceById(tenantId, id);
  return prisma.price.update({
    where: { id },
    data: {
      list_price: input.listPrice === undefined
        ? undefined
        : input.listPrice === null
          ? null
          : parseDecimalInput(input.listPrice, "list_price"),
      sale_price: input.salePrice === undefined ? undefined : parseDecimalInput(input.salePrice, "sale_price"),
      starts_at: input.startsAt === undefined ? undefined : input.startsAt,
      ends_at: input.endsAt === undefined ? undefined : input.endsAt,
      is_active: input.isActive,
      updated_at: new Date(),
    },
  });
}

export async function deletePrice(tenantId: string, id: string) {
  await getPriceById(tenantId, id);
  await prisma.price.delete({ where: { id } });
}

export async function listCatalogs(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.catalog.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return pageMeta(items, limit);
}

export async function createCatalog(input: {
  tenantId: string;
  storeId: string;
  name: string;
  status?: string;
}) {
  const now = new Date();
  return prisma.catalog.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      store_id: input.storeId,
      name: input.name,
      status: input.status ?? "ACTIVE",
      created_at: now,
      updated_at: now,
    },
  });
}

export async function updateCatalog(tenantId: string, id: string, input: {
  name?: string;
  status?: string;
}) {
  const existing = await prisma.catalog.findFirst({ where: { id, tenant_id: tenantId }, select: { id: true } });
  if (!existing) {
    throw new ApiError(404, "CATALOG_NOT_FOUND", "Catalog not found");
  }

  return prisma.catalog.update({
    where: { id },
    data: {
      name: input.name,
      status: input.status,
      updated_at: new Date(),
    },
  });
}

export async function listPriceLists(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.priceList.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return pageMeta(items, limit);
}

export async function createPriceList(input: {
  tenantId: string;
  catalogId: string;
  name: string;
  currencyCode?: string;
  isDefault?: boolean;
}) {
  const now = new Date();
  return prisma.priceList.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      catalog_id: input.catalogId,
      name: input.name,
      currency_code: input.currencyCode ?? "PEN",
      is_default: input.isDefault ?? false,
      created_at: now,
      updated_at: now,
    },
  });
}

export async function updatePriceList(tenantId: string, id: string, input: {
  name?: string;
  currencyCode?: string;
  isDefault?: boolean;
}) {
  const existing = await prisma.priceList.findFirst({ where: { id, tenant_id: tenantId }, select: { id: true } });
  if (!existing) {
    throw new ApiError(404, "PRICE_LIST_NOT_FOUND", "Price list not found");
  }

  return prisma.priceList.update({
    where: { id },
    data: {
      name: input.name,
      currency_code: input.currencyCode,
      is_default: input.isDefault,
      updated_at: new Date(),
    },
  });
}

export async function deletePriceList(tenantId: string, id: string) {
  const existing = await prisma.priceList.findFirst({ where: { id, tenant_id: tenantId }, select: { id: true } });
  if (!existing) {
    throw new ApiError(404, "PRICE_LIST_NOT_FOUND", "Price list not found");
  }
  await prisma.priceList.delete({ where: { id } });
}
