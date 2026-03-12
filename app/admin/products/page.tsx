import ProductsClient from "@/app/admin/products/products-client";
import { listProducts } from "@/lib/products";
import { getDefaultTenantId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const tenantId = await getDefaultTenantId();
  const products = await listProducts(tenantId);
  const serializedProducts = products.map((product) => ({
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));

  return <ProductsClient initialProducts={serializedProducts} />;
}
