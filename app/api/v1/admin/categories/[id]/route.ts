import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { categoryUpdateSchema, formatZodErrors } from "@/lib/schemas/products";
import { prisma } from "@/lib/prisma";
import { getDefaultCatalogId, getDefaultTenantId } from "@/lib/tenant";

function jsonError(
  status: number,
  error: string,
  message: string,
  details?: Record<string, unknown>
) {
  return NextResponse.json({ error, message, details }, { status });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function assertSlugAvailable(
  tenantId: string,
  catalogId: string,
  slug: string,
  excludeId: string
) {
  const existing = await prisma.category.findFirst({
    select: { id: true },
    where: {
      tenant_id: tenantId,
      catalog_id: catalogId,
      slug,
      NOT: { id: excludeId },
    },
  });

  if (existing) {
    throw new Error("SLUG_TAKEN");
  }
}

function mapCategory(category: {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sort_order,
    isActive: category.is_active,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = categoryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(422, "ValidationError", "Request validation failed.", {
        errors: formatZodErrors(parsed.error),
      });
    }

    const tenantId = await getDefaultTenantId();
    const catalogId = await getDefaultCatalogId(tenantId);
    const category = await prisma.category.findFirst({
      select: { id: true, catalog_id: true },
      where: { id, tenant_id: tenantId, catalog_id: catalogId },
    });

    if (!category) {
      return jsonError(404, "NotFound", "Category not found.");
    }

    const slug =
      parsed.data.slug !== undefined
        ? slugify(parsed.data.slug)
        : undefined;

    if (slug !== undefined && !slug) {
      return jsonError(422, "ValidationError", "Slug is required.", {
        errors: [{ field: "slug", message: "Slug is required." }],
      });
    }

    if (slug) {
      await assertSlugAvailable(tenantId, catalogId, slug, category.id);
    }

    const updated = await prisma.category.update({
      where: { id: category.id },
      data: {
        name: parsed.data.name ?? undefined,
        slug: slug ?? undefined,
        sort_order: parsed.data.sortOrder ?? undefined,
        is_active: parsed.data.isActive ?? undefined,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sort_order: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(mapCategory(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "SLUG_TAKEN") {
      return jsonError(422, "ValidationError", "Slug already exists.", {
        errors: [{ field: "slug", message: "Slug already exists." }],
      });
    }
    if (message.includes("No tenant") || message.includes("No catalog")) {
      return jsonError(409, "TenantMissing", message);
    }
    if (message.includes("Unexpected end of JSON")) {
      return jsonError(400, "BadRequest", "Invalid JSON payload.");
    }
    return jsonError(500, "ServerError", "Unable to update category.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getDefaultTenantId();
    const catalogId = await getDefaultCatalogId(tenantId);
    const category = await prisma.category.findFirst({
      select: { id: true },
      where: { id, tenant_id: tenantId, catalog_id: catalogId },
    });

    if (!category) {
      return jsonError(404, "NotFound", "Category not found.");
    }

    await prisma.category.delete({ where: { id: category.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return jsonError(
          409,
          "Conflict",
          "Category is in use and cannot be deleted."
        );
      }
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("No tenant") || message.includes("No catalog")) {
      return jsonError(409, "TenantMissing", message);
    }
    return jsonError(500, "ServerError", "Unable to delete category.");
  }
}
