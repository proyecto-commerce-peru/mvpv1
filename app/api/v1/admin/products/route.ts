import { NextResponse } from "next/server";

import {
  formatZodErrors,
  productCreateSchema,
} from "@/lib/schemas/products";
import { mapOfferingToProduct } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getDefaultCatalogId, getDefaultTenantId } from "@/lib/tenant";

const PRODUCT_TYPE = "PRODUCT";
function jsonError(
  status: number,
  error: string,
  message: string,
  details?: Record<string, unknown>
) {
  return NextResponse.json({ error, message, details }, { status });
}

async function assertHandleAvailable(
  tenantId: string,
  handle: string,
  excludeId?: string
) {
  const existing = await prisma.storeOffering.findFirst({
    select: { id: true },
    where: {
      tenant_id: tenantId,
      type: PRODUCT_TYPE,
      handle,
      deleted_at: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  if (existing) {
    throw new Error("HANDLE_TAKEN");
  }
}

export async function GET() {
  try {
    const tenantId = await getDefaultTenantId();
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

    return NextResponse.json({ items: products.map(mapOfferingToProduct) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("No tenant")) {
      return jsonError(409, "TenantMissing", message);
    }
    return jsonError(500, "ServerError", "Unable to fetch products.");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = productCreateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(422, "ValidationError", "Request validation failed.", {
        errors: formatZodErrors(parsed.error),
      });
    }

    const tenantId = await getDefaultTenantId();
    const catalogId = await getDefaultCatalogId(tenantId);

    if (parsed.data.handle) {
      await assertHandleAvailable(tenantId, parsed.data.handle);
    }

    const now = new Date();
    const created = await prisma.storeOffering.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        catalog_id: catalogId,
        type: PRODUCT_TYPE,
        title: parsed.data.title ?? "Untitled",
        description: parsed.data.description,
        status: parsed.data.status ?? "ACTIVE",
        handle: parsed.data.handle,
        cover_image_url: parsed.data.coverImageUrl,
        currency_code: parsed.data.currencyCode ?? "PEN",
        base_data: {
          price: parsed.data.price,
          sku: parsed.data.sku,
        },
        created_at: now,
        updated_at: now,
      },
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
    });

    return NextResponse.json(mapOfferingToProduct(created), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "HANDLE_TAKEN") {
      return jsonError(422, "ValidationError", "Handle already exists.", {
        errors: [{ field: "handle", message: "Handle already exists." }],
      });
    }
    if (message.includes("No tenant") || message.includes("No catalog")) {
      return jsonError(409, "TenantMissing", message);
    }
    if (message.includes("Unexpected end of JSON")) {
      return jsonError(400, "BadRequest", "Invalid JSON payload.");
    }
    return jsonError(500, "ServerError", "Unable to create product.");
  }
}
