import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type ProductsRouteModule = typeof import("@/app/api/v1/admin/products/route");
type ProductRouteModule = typeof import("@/app/api/v1/admin/products/[id]/route");

type StoreOffering = {
  id: string;
  tenant_id: string;
  catalog_id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  handle: string | null;
  cover_image_url: string | null;
  currency_code: string;
  base_data: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

const tenantId = "tenant-test";
const catalogId = "catalog-test";

const store: StoreOffering[] = [];
const storeImages: Array<{
  id: string;
  tenant_id: string;
  offering_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}> = [];
const storeCategories: Array<{
  id: string;
  tenant_id: string;
  offering_id: string;
  category_id: string;
}> = [];
const categories = [
  { id: "cat-1", name: "Category One" },
  { id: "cat-2", name: "Category Two" },
];
const storePrices: Array<{
  id: string;
  tenant_id: string;
  price_list_id: string;
  offering_id: string | null;
  variant_id: string | null;
  list_price: number | null;
  sale_price: number;
  is_active: boolean;
}> = [];
const defaultPriceListId = "price-list-default";

function applySelect<T extends Record<string, unknown>>(
  record: T,
  select?: Record<string, boolean>
) {
  if (!select) return record;
  return Object.keys(select).reduce((acc, key) => {
    if (select[key]) {
      acc[key] = record[key];
    }
    return acc;
  }, {} as Record<string, unknown>);
}

const prismaMock = {
  priceList: {
    findFirst: vi.fn(async () => ({ id: defaultPriceListId })),
  },
  price: {
    findMany: vi.fn(async ({ where }) => {
      return storePrices.filter(
        (item) =>
          item.tenant_id === where.tenant_id &&
          item.price_list_id === where.price_list_id &&
          item.offering_id === where.offering_id
      );
    }),
    findFirst: vi.fn(async ({ where }) => {
      return (
        storePrices.find(
          (item) =>
            item.tenant_id === where.tenant_id &&
            item.price_list_id === where.price_list_id &&
            item.offering_id === where.offering_id
        ) ?? null
      );
    }),
    create: vi.fn(async ({ data, select }) => {
      const created = { ...data };
      storePrices.push(created);
      return applySelect(created, select);
    }),
    update: vi.fn(async ({ where, data, select }) => {
      const index = storePrices.findIndex((item) => item.id === where.id);
      if (index === -1) {
        throw new Error("NotFound");
      }
      storePrices[index] = { ...storePrices[index], ...data };
      return applySelect(storePrices[index], select);
    }),
  },
  storeOffering: {
    findMany: vi.fn(async ({ where, orderBy, select }) => {
      const filtered = store.filter((item) => {
        if (where?.tenant_id && item.tenant_id !== where.tenant_id) return false;
        if (where?.type && item.type !== where.type) return false;
        if (where?.deleted_at === null && item.deleted_at !== null) return false;
        return true;
      });

      if (orderBy?.updated_at === "desc") {
        filtered.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
      }

      return filtered.map((item) => applySelect(item, select));
    }),
    findFirst: vi.fn(async ({ where, select }) => {
      const found = store.find((item) => {
        if (where?.id && item.id !== where.id) return false;
        if (where?.tenant_id && item.tenant_id !== where.tenant_id) return false;
        if (where?.type && item.type !== where.type) return false;
        if (where?.deleted_at === null && item.deleted_at !== null) return false;
        if (where?.handle && item.handle !== where.handle) return false;
        if (where?.NOT?.id && item.id === where.NOT.id) return false;
        return true;
      });
      return found ? applySelect(found, select) : null;
    }),
    create: vi.fn(async ({ data, select }) => {
      const created: StoreOffering = {
        ...data,
        description: data.description ?? null,
        handle: data.handle ?? null,
        cover_image_url: data.cover_image_url ?? null,
        base_data: data.base_data ?? null,
        deleted_at: null,
      };
      store.push(created);
      return applySelect(created, select);
    }),
    update: vi.fn(async ({ where, data, select }) => {
      const index = store.findIndex((item) => item.id === where.id);
      if (index === -1) {
        throw new Error("NotFound");
      }
      const next = {
        ...store[index],
        ...data,
      } as StoreOffering;
      store[index] = next;
      return applySelect(next, select);
    }),
    deleteMany: vi.fn(async () => {
      store.splice(0, store.length);
    }),
  },
  storeOfferingImage: {
    findMany: vi.fn(async ({ where }) => {
      return storeImages.filter(
        (item) =>
          item.tenant_id === where.tenant_id && item.offering_id === where.offering_id
      );
    }),
    create: vi.fn(async ({ data, select }) => {
      const created = { ...data };
      storeImages.push(created);
      return applySelect(created, select);
    }),
    update: vi.fn(async ({ where, data, select }) => {
      const index = storeImages.findIndex((item) => item.id === where.id);
      if (index === -1) {
        throw new Error("NotFound");
      }
      storeImages[index] = { ...storeImages[index], ...data };
      return applySelect(storeImages[index], select);
    }),
    delete: vi.fn(async ({ where }) => {
      const index = storeImages.findIndex((item) => item.id === where.id);
      if (index !== -1) {
        storeImages.splice(index, 1);
      }
    }),
    findFirst: vi.fn(async ({ where }) => {
      return (
        storeImages.find(
          (item) =>
            item.id === where.id && item.tenant_id === where.tenant_id
        ) ?? null
      );
    }),
  },
  category: {
    findMany: vi.fn(async () => categories),
  },
  storeOfferingCategory: {
    deleteMany: vi.fn(async ({ where }) => {
      for (let i = storeCategories.length - 1; i >= 0; i -= 1) {
        if (
          storeCategories[i].tenant_id === where.tenant_id &&
          storeCategories[i].offering_id === where.offering_id
        ) {
          storeCategories.splice(i, 1);
        }
      }
    }),
    createMany: vi.fn(async ({ data }) => {
      storeCategories.push(...data);
      return { count: data.length };
    }),
    findMany: vi.fn(async () => storeCategories),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/tenant", () => ({
  getDefaultTenantId: vi.fn(async () => tenantId),
  getDefaultCatalogId: vi.fn(async () => catalogId),
  getDefaultPriceListId: vi.fn(async () => defaultPriceListId),
}));

describe("products API", () => {
  let productsRoute: ProductsRouteModule;
  let productRoute: ProductRouteModule;
  let priceRoute: typeof import("@/app/api/v1/admin/products/[id]/prices/route");
  let imagesRoute: typeof import("@/app/api/v1/admin/products/[id]/images/route");
  let imageRoute: typeof import("@/app/api/v1/admin/products/[id]/images/[imageId]/route");
  let categoriesRoute: typeof import("@/app/api/v1/admin/products/[id]/categories/route");
  let categoriesListRoute: typeof import("@/app/api/v1/admin/categories/route");
  let uploadsRoute: typeof import("@/app/api/v1/admin/uploads/route");

  beforeAll(async () => {
    vi.resetModules();
    productsRoute = (await import("@/app/api/v1/admin/products/route")) as ProductsRouteModule;
    productRoute = (await import("@/app/api/v1/admin/products/[id]/route")) as ProductRouteModule;
    priceRoute = await import("@/app/api/v1/admin/products/[id]/prices/route");
    imagesRoute = await import("@/app/api/v1/admin/products/[id]/images/route");
    imageRoute = await import("@/app/api/v1/admin/products/[id]/images/[imageId]/route");
    categoriesRoute = await import("@/app/api/v1/admin/products/[id]/categories/route");
    categoriesListRoute = await import("@/app/api/v1/admin/categories/route");
    uploadsRoute = await import("@/app/api/v1/admin/uploads/route");
  });

  beforeEach(async () => {
    await prismaMock.storeOffering.deleteMany();
  });

  it("creates a product", async () => {
    const request = new Request("http://localhost/api/v1/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Product",
        handle: "test-product",
        price: "12.50",
        status: "ACTIVE",
        currencyCode: "PEN",
      }),
    });

    const response = await productsRoute.POST(request);
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.title).toBe("Test Product");
    expect(json.price).toBe(12.5);
  });

  it("rejects invalid payloads", async () => {
    const request = new Request("http://localhost/api/v1/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", handle: "", price: -1 }),
    });

    const response = await productsRoute.POST(request);
    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.error).toBe("ValidationError");
  });

  it("rejects duplicate handles", async () => {
    const payload = {
      title: "First Product",
      handle: "duplicate-handle",
      price: 10,
    };

    const requestA = new Request("http://localhost/api/v1/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await productsRoute.POST(requestA);

    const requestB = new Request("http://localhost/api/v1/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, title: "Second Product" }),
    });
    const response = await productsRoute.POST(requestB);
    expect(response.status).toBe(422);
  });

  it("updates a product", async () => {
    const createResponse = await productsRoute.POST(
      new Request("http://localhost/api/v1/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Update Me",
          handle: "update-me",
          price: 15,
        }),
      })
    );
    const created = await createResponse.json();

    const patchRequest = new Request(`http://localhost/api/v1/admin/products/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title", price: 20 }),
    });

    const response = await productRoute.PATCH(patchRequest, {
      params: Promise.resolve({ id: created.id }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.title).toBe("Updated Title");
    expect(json.price).toBe(20);
  });

  it("soft deletes a product", async () => {
    const createResponse = await productsRoute.POST(
      new Request("http://localhost/api/v1/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Delete Me",
          handle: "delete-me",
          price: 5,
        }),
      })
    );
    const created = await createResponse.json();

    const deleteResponse = await productRoute.DELETE(
      new Request(`http://localhost/api/v1/admin/products/${created.id}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: created.id }) }
    );
    expect(deleteResponse.status).toBe(204);

    const getResponse = await productRoute.GET(
      new Request(`http://localhost/api/v1/admin/products/${created.id}`),
      { params: Promise.resolve({ id: created.id }) }
    );
    expect(getResponse.status).toBe(404);
  });

  it("creates and fetches price", async () => {
    const createResponse = await productsRoute.POST(
      new Request("http://localhost/api/v1/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Price Test",
          handle: "price-test",
          price: 10,
        }),
      })
    );
    const created = await createResponse.json();

    const priceResponse = await priceRoute.POST(
      new Request(`http://localhost/api/v1/admin/products/${created.id}/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listPrice: 20, salePrice: 15 }),
      }),
      { params: Promise.resolve({ id: created.id }) }
    );
    expect(priceResponse.status).toBe(200);

    const listResponse = await priceRoute.GET(
      new Request(`http://localhost/api/v1/admin/products/${created.id}/prices`),
      { params: Promise.resolve({ id: created.id }) }
    );
    const listJson = await listResponse.json();
    expect(listJson.items.length).toBe(1);
  });

  it("adds and updates images", async () => {
    const createResponse = await productsRoute.POST(
      new Request("http://localhost/api/v1/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Image Test",
          handle: "image-test",
          price: 10,
        }),
      })
    );
    const created = await createResponse.json();

    const addResponse = await imagesRoute.POST(
      new Request(`http://localhost/api/v1/admin/products/${created.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://example.com/image.png" }),
      }),
      { params: Promise.resolve({ id: created.id }) }
    );
    expect(addResponse.status).toBe(200);
    const image = await addResponse.json();

    const patchResponse = await imageRoute.PATCH(
      new Request(
        `http://localhost/api/v1/admin/products/${created.id}/images/${image.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ altText: "Alt", sortOrder: 1 }),
        }
      ),
      { params: Promise.resolve({ id: created.id, imageId: image.id }) }
    );
    expect(patchResponse.status).toBe(200);
  });

  it("replaces categories", async () => {
    const createResponse = await productsRoute.POST(
      new Request("http://localhost/api/v1/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Category Test",
          handle: "category-test",
          price: 10,
        }),
      })
    );
    const created = await createResponse.json();

    const categoriesResponse = await categoriesListRoute.GET();
    const categories = await categoriesResponse.json();
    expect(Array.isArray(categories.items)).toBe(true);

    const replaceResponse = await categoriesRoute.PUT(
      new Request(
        `http://localhost/api/v1/admin/products/${created.id}/categories`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryIds: [
              "00000000-0000-0000-0000-000000000000",
              "ffffffff-ffff-ffff-ffff-ffffffffffff",
            ],
          }),
        }
      ),
      { params: Promise.resolve({ id: created.id }) }
    );
    expect(replaceResponse.status).toBe(200);
  });

  it("rejects invalid uploads", async () => {
    const request = new Request("http://localhost/api/v1/admin/uploads", {
      method: "POST",
      body: new FormData(),
    });
    const response = await uploadsRoute.POST(request);
    expect(response.status).toBe(422);
  });
});
