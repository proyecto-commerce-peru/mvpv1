import { NextResponse } from "next/server";

import {
  formatZodErrors,
  productUpdateSchema,
} from "@/lib/schemas/products";
import { mapOfferingToProduct } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";

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
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(422, "ValidationError", "Request validation failed.", {
        errors: formatZodErrors(parsed.error),
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

    if (parsed.data.handle) {
      await assertHandleAvailable(tenantId, parsed.data.handle, id);
    }

    const baseData = (existing.base_data ?? {}) as Record<string, unknown>;
    const nextBaseData = {
      ...baseData,
      ...(parsed.data.price !== undefined ? { price: parsed.data.price } : {}),
      ...(parsed.data.sku !== undefined ? { sku: parsed.data.sku } : {}),
    };

    const updated = await prisma.storeOffering.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        status: parsed.data.status,
        handle: parsed.data.handle,
        cover_image_url: parsed.data.coverImageUrl,
        currency_code: parsed.data.currencyCode,
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
