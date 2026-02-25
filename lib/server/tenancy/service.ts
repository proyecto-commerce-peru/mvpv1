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

export async function listTenants(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.tenant.findMany({
    where: {
      id: tenantId,
      deleted_at: null,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createTenant(input: {
  name: string;
  slug: string;
  legalName?: string;
  taxId?: string;
  status?: string;
  countryCode?: string;
  timezone?: string;
  currencyCode?: string;
  metadata?: unknown;
}) {
  const exists = await prisma.tenant.findFirst({
    where: { slug: input.slug },
    select: { id: true },
  });

  if (exists) {
    throw new ApiError(409, "TENANT_SLUG_EXISTS", "Tenant slug already exists");
  }

  const now = new Date();
  return prisma.tenant.create({
    data: {
      id: crypto.randomUUID(),
      name: input.name,
      slug: input.slug,
      legal_name: input.legalName,
      tax_id: input.taxId,
      status: input.status ?? "ACTIVE",
      country_code: input.countryCode ?? "PE",
      timezone: input.timezone ?? "America/Lima",
      currency_code: input.currencyCode ?? "PEN",
      metadata: input.metadata as never,
      created_at: now,
      updated_at: now,
    },
  });
}

export async function getTenantById(tenantId: string, id: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { id, deleted_at: null, ...(id === tenantId ? {} : { id: "__forbidden__" }) },
  });

  if (!tenant) {
    throw new ApiError(404, "TENANT_NOT_FOUND", "Tenant not found");
  }

  return tenant;
}

export async function updateTenant(tenantId: string, id: string, input: {
  name?: string;
  legalName?: string | null;
  taxId?: string | null;
  status?: string;
  countryCode?: string;
  timezone?: string;
  currencyCode?: string;
  metadata?: unknown;
}) {
  await getTenantById(tenantId, id);

  return prisma.tenant.update({
    where: { id },
    data: {
      name: input.name,
      legal_name: input.legalName === undefined ? undefined : input.legalName,
      tax_id: input.taxId === undefined ? undefined : input.taxId,
      status: input.status,
      country_code: input.countryCode,
      timezone: input.timezone,
      currency_code: input.currencyCode,
      metadata: input.metadata as never,
      updated_at: new Date(),
    },
  });
}

export async function listTenantSettings(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.tenantSetting.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createTenantSetting(input: {
  tenantId: string;
  key: string;
  value: unknown;
  scope?: string;
}) {
  const now = new Date();
  return prisma.tenantSetting.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      key: input.key,
      value: input.value as never,
      scope: input.scope ?? "TENANT",
      created_at: now,
      updated_at: now,
    },
  });
}

export async function updateTenantSetting(tenantId: string, id: string, input: {
  key?: string;
  value?: unknown;
  scope?: string;
}) {
  const existing = await prisma.tenantSetting.findFirst({
    where: { id, tenant_id: tenantId },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError(404, "TENANT_SETTING_NOT_FOUND", "Tenant setting not found");
  }

  return prisma.tenantSetting.update({
    where: { id },
    data: {
      key: input.key,
      value: input.value as never,
      scope: input.scope,
      updated_at: new Date(),
    },
  });
}

export async function deleteTenantSetting(tenantId: string, id: string) {
  const existing = await prisma.tenantSetting.findFirst({ where: { id, tenant_id: tenantId }, select: { id: true } });
  if (!existing) {
    throw new ApiError(404, "TENANT_SETTING_NOT_FOUND", "Tenant setting not found");
  }

  await prisma.tenantSetting.delete({ where: { id } });
}

export async function listStores(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.tenantStore.findMany({
    where: {
      tenant_id: tenantId,
      deleted_at: null,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createStore(input: {
  tenantId: string;
  name: string;
  channel?: string;
  status?: string;
  addressText?: string;
  metadata?: unknown;
}) {
  const now = new Date();
  return prisma.tenantStore.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      name: input.name,
      channel: input.channel ?? "WEB",
      status: input.status ?? "ACTIVE",
      address_text: input.addressText,
      metadata: input.metadata as never,
      created_at: now,
      updated_at: now,
    },
  });
}

export async function getStoreById(tenantId: string, id: string) {
  const store = await prisma.tenantStore.findFirst({
    where: {
      id,
      tenant_id: tenantId,
      deleted_at: null,
    },
  });

  if (!store) {
    throw new ApiError(404, "STORE_NOT_FOUND", "Store not found");
  }

  return store;
}

export async function updateStore(tenantId: string, id: string, input: {
  name?: string;
  channel?: string;
  status?: string;
  addressText?: string | null;
  metadata?: unknown;
}) {
  await getStoreById(tenantId, id);

  return prisma.tenantStore.update({
    where: { id },
    data: {
      name: input.name,
      channel: input.channel,
      status: input.status,
      address_text: input.addressText === undefined ? undefined : input.addressText,
      metadata: input.metadata as never,
      updated_at: new Date(),
    },
  });
}

export async function listTenantDomains(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.tenantDomain.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createTenantDomain(input: {
  tenantId: string;
  domain: string;
  isPrimary?: boolean;
}) {
  return prisma.tenantDomain.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      domain: input.domain.toLowerCase(),
      is_primary: input.isPrimary ?? false,
      is_verified: false,
      created_at: new Date(),
    },
  });
}

export async function verifyTenantDomain(tenantId: string, id: string) {
  const domain = await prisma.tenantDomain.findFirst({ where: { id, tenant_id: tenantId } });
  if (!domain) {
    throw new ApiError(404, "TENANT_DOMAIN_NOT_FOUND", "Tenant domain not found");
  }

  return prisma.tenantDomain.update({
    where: { id },
    data: {
      is_verified: true,
      verified_at: new Date(),
    },
  });
}