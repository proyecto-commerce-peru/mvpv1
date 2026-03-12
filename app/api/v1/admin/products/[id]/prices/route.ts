import { NextResponse } from "next/server";

import { priceUpsertSchema, formatZodErrors } from "@/lib/schemas/products";
import { prisma } from "@/lib/prisma";
import { getDefaultPriceListId, getDefaultTenantId } from "@/lib/tenant";

function jsonError(
  status: number,
  error: string,
  message: string,
  details?: Record<string, unknown>
) {
  return NextResponse.json({ error, message, details }, { status });
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDefaultTenantId();
    const { id } = await context.params;
    const offering = await prisma.storeOffering.findFirst({
      select: { id: true, catalog_id: true },
      where: { id, tenant_id: tenantId, deleted_at: null },
    });

    if (!offering) {
      return jsonError(404, "NotFound", "Product not found.");
    }

    const priceListId = await getDefaultPriceListId(tenantId, offering.catalog_id);
    const prices = await prisma.price.findMany({
      select: {
        id: true,
        list_price: true,
        sale_price: true,
        is_active: true,
      },
      where: {
        tenant_id: tenantId,
        price_list_id: priceListId,
        offering_id: id,
        variant_id: null,
      },
    });

    return NextResponse.json({
      items: prices.map((price) => ({
        id: price.id,
        listPrice: toNumber(price.list_price),
        salePrice: toNumber(price.sale_price),
        isActive: price.is_active,
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
    const parsed = priceUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(422, "ValidationError", "Request validation failed.", {
        errors: formatZodErrors(parsed.error),
      });
    }

    const offering = await prisma.storeOffering.findFirst({
      select: { id: true, catalog_id: true },
      where: { id, tenant_id: tenantId, deleted_at: null },
    });

    if (!offering) {
      return jsonError(404, "NotFound", "Product not found.");
    }

    const priceListId = await getDefaultPriceListId(tenantId, offering.catalog_id);
    const existing = await prisma.price.findFirst({
      select: { id: true },
      where: {
        tenant_id: tenantId,
        price_list_id: priceListId,
        offering_id: id,
        variant_id: null,
      },
    });

    const payload = {
      list_price: parsed.data.listPrice ?? null,
      sale_price: parsed.data.salePrice,
      is_active: parsed.data.isActive ?? true,
      updated_at: new Date(),
    };

    const saved = existing
      ? await prisma.price.update({
          where: { id: existing.id },
          data: payload,
          select: {
            id: true,
            list_price: true,
            sale_price: true,
            is_active: true,
          },
        })
      : await prisma.price.create({
          data: {
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            price_list_id: priceListId,
            offering_id: id,
            variant_id: null,
            list_price: payload.list_price,
            sale_price: payload.sale_price,
            is_active: payload.is_active,
            created_at: new Date(),
            updated_at: new Date(),
          },
          select: {
            id: true,
            list_price: true,
            sale_price: true,
            is_active: true,
          },
        });

    return NextResponse.json({
      id: saved.id,
      listPrice: toNumber(saved.list_price),
      salePrice: toNumber(saved.sale_price),
      isActive: saved.is_active,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(500, "ServerError", message);
  }
}
