import { NextResponse } from "next/server";

import { formatZodErrors, imageUpdateSchema } from "@/lib/schemas/products";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";

function jsonError(
  status: number,
  error: string,
  message: string,
  details?: Record<string, unknown>
) {
  return NextResponse.json({ error, message, details }, { status });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const tenantId = await getDefaultTenantId();
    const { imageId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = imageUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(422, "ValidationError", "Request validation failed.", {
        errors: formatZodErrors(parsed.error),
      });
    }

    const updated = await prisma.storeOfferingImage.update({
      where: { id: imageId },
      data: {
        alt_text: parsed.data.altText ?? undefined,
        sort_order: parsed.data.sortOrder ?? undefined,
      },
      select: {
        id: true,
        url: true,
        alt_text: true,
        sort_order: true,
        tenant_id: true,
      },
    });

    if (updated.tenant_id !== tenantId) {
      return jsonError(403, "Forbidden", "Image does not belong to tenant.");
    }

    return NextResponse.json({
      id: updated.id,
      url: updated.url,
      altText: updated.alt_text,
      sortOrder: updated.sort_order,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(500, "ServerError", message);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const tenantId = await getDefaultTenantId();
    const { imageId } = await context.params;
    const image = await prisma.storeOfferingImage.findFirst({
      select: { id: true },
      where: { id: imageId, tenant_id: tenantId },
    });

    if (!image) {
      return jsonError(404, "NotFound", "Image not found.");
    }

    await prisma.storeOfferingImage.delete({ where: { id: imageId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(500, "ServerError", message);
  }
}
