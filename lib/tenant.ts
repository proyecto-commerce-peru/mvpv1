import { prisma } from "@/lib/prisma";

export async function getDefaultTenantId(): Promise<string> {
  const tenantId = process.env.TENANT_ID?.trim();
  if (tenantId) {
    return tenantId;
  }

  const tenant = await prisma.tenant.findFirst({
    select: { id: true },
    orderBy: { created_at: "asc" },
  });

  if (!tenant) {
    throw new Error("No tenant found. Seed the database or set TENANT_ID.");
  }

  return tenant.id;
}

export async function getDefaultCatalogId(tenantId: string): Promise<string> {
  const catalog = await prisma.catalog.findFirst({
    select: { id: true },
    where: { tenant_id: tenantId },
    orderBy: { created_at: "asc" },
  });

  if (!catalog) {
    throw new Error("No catalog found for tenant.");
  }

  return catalog.id;
}
