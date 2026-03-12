import { notFound } from "next/navigation";

import ProductEditorClient from "@/app/admin/products/[id]/product-editor-client";
import { mapOfferingToProduct } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getDefaultPriceListId, getDefaultTenantId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function ProductEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await getDefaultTenantId();
  const offering = await prisma.storeOffering.findFirst({
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      handle: true,
      cover_image_url: true,
      currency_code: true,
      base_data: true,
      created_at: true,
      updated_at: true,
      catalog_id: true,
    },
    where: {
      id,
      tenant_id: tenantId,
      deleted_at: null,
    },
  });

  if (!offering) {
    notFound();
  }

  const priceListId = await getDefaultPriceListId(tenantId, offering.catalog_id);
  const [images, categories, assignedCategories, price] = await Promise.all([
    prisma.storeOfferingImage.findMany({
      select: { id: true, url: true, alt_text: true, sort_order: true },
      where: { tenant_id: tenantId, offering_id: id },
      orderBy: { sort_order: "asc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      where: { tenant_id: tenantId, catalog_id: offering.catalog_id },
      orderBy: { name: "asc" },
    }),
    prisma.storeOfferingCategory.findMany({
      select: { category_id: true },
      where: { tenant_id: tenantId, offering_id: id },
    }),
    prisma.price.findFirst({
      select: { id: true, list_price: true, sale_price: true, is_active: true },
      where: {
        tenant_id: tenantId,
        price_list_id: priceListId,
        offering_id: id,
        variant_id: null,
      },
    }),
  ]);

  return (
    <ProductEditorClient
      product={{
        ...mapOfferingToProduct(offering),
        createdAt: offering.created_at.toISOString(),
        updatedAt: offering.updated_at.toISOString(),
      }}
      images={images.map((image) => ({
        id: image.id,
        url: image.url,
        altText: image.alt_text,
        sortOrder: image.sort_order,
      }))}
      categories={categories}
      selectedCategoryIds={assignedCategories.map((item) => item.category_id)}
      price={
        price
          ? {
              id: price.id,
              listPrice: price.list_price ? Number(price.list_price) : null,
              salePrice: price.sale_price ? Number(price.sale_price) : null,
              isActive: price.is_active,
            }
          : null
      }
    />
  );
}
