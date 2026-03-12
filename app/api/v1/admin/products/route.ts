import { NextResponse } from "next/server";

import { mapOfferingToProduct } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getDefaultCatalogId, getDefaultTenantId } from "@/lib/tenant";

const PRODUCT_TYPE = "PRODUCT";
const ALLOWED_STATUSES = new Set(["ACTIVE", "INACTIVE"]);

type ProductPayload = {
  title?: string;
  description?: string | null;
  status?: string;
  handle?: string;
  coverImageUrl?: string | null;
  currencyCode?: string;
  price?: number;
  sku?: string | null;
};

type ValidationErrorDetail = {
  field: string;
  message: string;
};

function jsonError(
  status: number,
  error: string,
  message: string,
  details?: Record<string, unknown>
) {
  return NextResponse.json({ error, message, details }, { status });
}

function parsePrice(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const numberValue =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  if (Number.isNaN(numberValue)) {
    return undefined;
  }
  return numberValue;
}

function normalizePayload(
  body: Record<string, unknown>,
  requireAll: boolean
): { data: ProductPayload; errors: ValidationErrorDetail[] } {
  const errors: ValidationErrorDetail[] = [];
  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const handle = typeof body.handle === "string" ? body.handle.trim() : undefined;
  const status =
    typeof body.status === "string" ? body.status.trim().toUpperCase() : undefined;
  const description =
    typeof body.description === "string" ? body.description.trim() : null;
  const coverImageUrl =
    typeof body.coverImageUrl === "string" ? body.coverImageUrl.trim() : null;
  const currencyCode =
    typeof body.currencyCode === "string"
      ? body.currencyCode.trim().toUpperCase()
      : undefined;
  const price = parsePrice(body.price);
  const sku = typeof body.sku === "string" ? body.sku.trim() : null;

  if (requireAll || body.title !== undefined) {
    if (!title) {
      errors.push({ field: "title", message: "Title is required." });
    } else if (title.length > 180) {
      errors.push({ field: "title", message: "Title is too long." });
    }
  }

  if (requireAll || body.handle !== undefined) {
    if (!handle) {
      errors.push({ field: "handle", message: "Handle is required." });
    } else if (handle.length > 180) {
      errors.push({ field: "handle", message: "Handle is too long." });
    }
  }

  if (requireAll || body.status !== undefined) {
    if (status && !ALLOWED_STATUSES.has(status)) {
      errors.push({ field: "status", message: "Invalid status value." });
    }
  }

  if (requireAll || body.price !== undefined) {
    if (price === undefined) {
      errors.push({ field: "price", message: "Price must be a number." });
    } else if (price < 0) {
      errors.push({ field: "price", message: "Price must be >= 0." });
    }
  }

  return {
    data: {
      title,
      description,
      status,
      handle,
      coverImageUrl,
      currencyCode,
      price,
      sku,
    },
    errors,
  };
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
    const { data, errors } = normalizePayload(body, true);

    if (errors.length > 0) {
      return jsonError(422, "ValidationError", "Request validation failed.", {
        errors,
      });
    }

    const tenantId = await getDefaultTenantId();
    const catalogId = await getDefaultCatalogId(tenantId);

    if (data.handle) {
      await assertHandleAvailable(tenantId, data.handle);
    }

    const now = new Date();
    const created = await prisma.storeOffering.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        catalog_id: catalogId,
        type: PRODUCT_TYPE,
        title: data.title ?? "Untitled",
        description: data.description,
        status: data.status ?? "ACTIVE",
        handle: data.handle,
        cover_image_url: data.coverImageUrl,
        currency_code: data.currencyCode ?? "PEN",
        base_data: {
          price: data.price ?? 0,
          sku: data.sku,
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
