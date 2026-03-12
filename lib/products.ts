import { prisma } from "@/lib/prisma";

const PRODUCT_TYPE = "PRODUCT";

type OfferingRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  handle: string | null;
  cover_image_url: string | null;
  currency_code: string;
  base_data: unknown;
  created_at: Date;
  updated_at: Date;
};

export type ProductDto = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  handle: string | null;
  coverImageUrl: string | null;
  currencyCode: string;
  price: number | null;
  sku: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapOfferingToProduct(offering: OfferingRecord): ProductDto {
  const baseData = (offering.base_data ?? {}) as Record<string, unknown>;
  const price =
    typeof baseData.price === "number"
      ? baseData.price
      : baseData.price !== undefined
        ? Number.parseFloat(String(baseData.price))
        : null;
  const sku =
    typeof baseData.sku === "string"
      ? baseData.sku
      : baseData.sku !== undefined
        ? String(baseData.sku)
        : null;

  return {
    id: offering.id,
    title: offering.title,
    description: offering.description,
    status: offering.status,
    handle: offering.handle,
    coverImageUrl: offering.cover_image_url,
    currencyCode: offering.currency_code,
    price: Number.isNaN(price as number) ? null : price,
    sku,
    createdAt: offering.created_at,
    updatedAt: offering.updated_at,
  };
}

export async function listProducts(tenantId: string): Promise<ProductDto[]> {
  const products = await prisma.storeOffering.findMany({
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
    },
    where: {
      tenant_id: tenantId,
      type: PRODUCT_TYPE,
      deleted_at: null,
    },
    orderBy: { updated_at: "desc" },
  });

  return products.map(mapOfferingToProduct);
}
