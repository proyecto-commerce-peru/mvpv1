import { NextResponse } from "next/server";

import { mapOfferingToProduct } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";

const PRODUCT_TYPE = "PRODUCT";
const ALLOWED_STATUSES = new Set(["ACTIVE", "INACTIVE"]);

type ProductPatch = {
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

function normalizePatch(
  body: Record<string, unknown>
): { data: ProductPatch; errors: ValidationErrorDetail[] } {
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

  if (body.title !== undefined) {
    if (!title) {
      errors.push({ field: "title", message: "Title cannot be empty." });
    } else if (title.length > 180) {
      errors.push({ field: "title", message: "Title is too long." });
    }
  }

  if (body.handle !== undefined) {
    if (!handle) {
      errors.push({ field: "handle", message: "Handle cannot be empty." });
    } else if (handle.length > 180) {
      errors.push({ field: "handle", message: "Handle is too long." });
    }
  }

  if (body.status !== undefined && status && !ALLOWED_STATUSES.has(status)) {
    errors.push({ field: "status", message: "Invalid status value." });
  }

  if (body.price !== undefined) {
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
  excludeId: string
) {
  const existing = await prisma.storeOffering.findFirst({
    select: { id: true },
    where: {
      tenant_id: tenantId,
      type: PRODUCT_TYPE,
      handle,
      deleted_at: null,
      NOT: { id: excludeId },
    },
  });

  if (existing) {
    throw new Error("HANDLE_TAKEN");
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDefaultTenantId();
    const { id } = await context.params;
    const product = await prisma.storeOffering.findFirst({
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
        id,
        tenant_id: tenantId,
        type: PRODUCT_TYPE,
        deleted_at: null,
      },
    });

    if (!product) {
      return jsonError(404, "NotFound", "Product not found.");
    }

    return NextResponse.json(mapOfferingToProduct(product));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("No tenant")) {
      return jsonError(409, "TenantMissing", message);
    }
    return jsonError(500, "ServerError", "Unable to fetch product.");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDefaultTenantId();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const { data, errors } = normalizePatch(body);

    if (errors.length > 0) {
      return jsonError(422, "ValidationError", "Request validation failed.", {
        errors,
      });
    }

    const existing = await prisma.storeOffering.findFirst({
      select: {
        id: true,
        base_data: true,
      },
      where: {
        id,
        tenant_id: tenantId,
        type: PRODUCT_TYPE,
        deleted_at: null,
      },
    });

    if (!existing) {
      return jsonError(404, "NotFound", "Product not found.");
    }

    if (data.handle) {
      await assertHandleAvailable(tenantId, data.handle, id);
    }

    const baseData = (existing.base_data ?? {}) as Record<string, unknown>;
    const nextBaseData = {
      ...baseData,
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.sku !== undefined ? { sku: data.sku } : {}),
    };

    const updated = await prisma.storeOffering.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        handle: data.handle,
        cover_image_url: data.coverImageUrl,
        currency_code: data.currencyCode,
        base_data: nextBaseData,
        updated_at: new Date(),
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

    return NextResponse.json(mapOfferingToProduct(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "HANDLE_TAKEN") {
      return jsonError(422, "ValidationError", "Handle already exists.", {
        errors: [{ field: "handle", message: "Handle already exists." }],
      });
    }
    if (message.includes("No tenant")) {
      return jsonError(409, "TenantMissing", message);
    }
    if (message.includes("Unexpected end of JSON")) {
      return jsonError(400, "BadRequest", "Invalid JSON payload.");
    }
    return jsonError(500, "ServerError", "Unable to update product.");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDefaultTenantId();
    const { id } = await context.params;
    const existing = await prisma.storeOffering.findFirst({
      select: { id: true },
      where: {
        id,
        tenant_id: tenantId,
        type: PRODUCT_TYPE,
        deleted_at: null,
      },
    });

    if (!existing) {
      return jsonError(404, "NotFound", "Product not found.");
    }

    await prisma.storeOffering.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("No tenant")) {
      return jsonError(409, "TenantMissing", message);
    }
    return jsonError(500, "ServerError", "Unable to delete product.");
  }
}
