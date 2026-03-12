import { NextResponse } from "next/server";

import { categoryCreateSchema, formatZodErrors } from "@/lib/schemas/products";
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
  slug: string
) {
  const existing = await prisma.category.findFirst({
    select: { id: true },
    where: { tenant_id: tenantId, catalog_id: catalogId, slug },
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

export async function GET() {
  try {
    const tenantId = await getDefaultTenantId();
    const catalogId = await getDefaultCatalogId(tenantId);
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        sort_order: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      where: { tenant_id: tenantId, catalog_id: catalogId },
      orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ items: categories.map(mapCategory) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(500, "ServerError", message);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = categoryCreateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(422, "ValidationError", "Request validation failed.", {
        errors: formatZodErrors(parsed.error),
      });
    }

    const tenantId = await getDefaultTenantId();
    const catalogId = await getDefaultCatalogId(tenantId);
    const slugSource = parsed.data.slug ?? parsed.data.name;
    const slug = slugify(slugSource);

    if (!slug) {
      return jsonError(422, "ValidationError", "Slug is required.", {
        errors: [{ field: "slug", message: "Slug is required." }],
      });
    }

    await assertSlugAvailable(tenantId, catalogId, slug);

    const now = new Date();
    const created = await prisma.category.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        catalog_id: catalogId,
        name: parsed.data.name,
        slug,
        sort_order: parsed.data.sortOrder ?? 0,
        is_active: parsed.data.isActive ?? true,
        created_at: now,
        updated_at: now,
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

    return NextResponse.json(mapCategory(created), { status: 201 });
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
    return jsonError(500, "ServerError", "Unable to create category.");
  }
}
