import CategoriesClient from "@/app/admin/categories/categories-client";
import { prisma } from "@/lib/prisma";
import { getDefaultCatalogId, getDefaultTenantId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const tenantId = await getDefaultTenantId();
  const catalogId = await getDefaultCatalogId(tenantId);
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      sort_order: true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
    where: { tenant_id: tenantId, catalog_id: catalogId },
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
  });

  const serialized = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sort_order,
    isActive: category.is_active,
    createdAt: category.created_at.toISOString(),
    updatedAt: category.updated_at.toISOString(),
  }));

  return <CategoriesClient initialCategories={serialized} />;
}
