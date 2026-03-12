import { NextResponse } from "next/server";

import { formatZodErrors, imageCreateSchema } from "@/lib/schemas/products";
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDefaultTenantId();
    const { id } = await context.params;
    const images = await prisma.storeOfferingImage.findMany({
      select: {
        id: true,
        url: true,
        alt_text: true,
        sort_order: true,
      },
      where: { tenant_id: tenantId, offering_id: id },
      orderBy: { sort_order: "asc" },
    });

    return NextResponse.json({
      items: images.map((image) => ({
        id: image.id,
        url: image.url,
        altText: image.alt_text,
        sortOrder: image.sort_order,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(500, "ServerError", message);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDefaultTenantId();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = imageCreateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(422, "ValidationError", "Request validation failed.", {
        errors: formatZodErrors(parsed.error),
      });
    }

    const now = new Date();
    const created = await prisma.storeOfferingImage.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        offering_id: id,
        url: parsed.data.url,
        alt_text: parsed.data.altText ?? null,
        sort_order: parsed.data.sortOrder ?? 0,
        created_at: now,
      },
      select: {
        id: true,
        url: true,
        alt_text: true,
        sort_order: true,
      },
    });

    return NextResponse.json({
      id: created.id,
      url: created.url,
      altText: created.alt_text,
      sortOrder: created.sort_order,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(500, "ServerError", message);
  }
}
