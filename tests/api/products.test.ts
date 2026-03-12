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
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/tenant", () => ({
  getDefaultTenantId: vi.fn(async () => tenantId),
  getDefaultCatalogId: vi.fn(async () => catalogId),
}));

describe("products API", () => {
  let productsRoute: ProductsRouteModule;
  let productRoute: ProductRouteModule;

  beforeAll(async () => {
    vi.resetModules();
    productsRoute = (await import("@/app/api/v1/admin/products/route")) as ProductsRouteModule;
    productRoute = (await import("@/app/api/v1/admin/products/[id]/route")) as ProductRouteModule;
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
});
