import { NextResponse } from "next/server";

import { categoriesReplaceSchema, formatZodErrors } from "@/lib/schemas/products";
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

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getDefaultTenantId();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = categoriesReplaceSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(422, "ValidationError", "Request validation failed.", {
        errors: formatZodErrors(parsed.error),
      });
    }

    await prisma.storeOfferingCategory.deleteMany({
      where: { tenant_id: tenantId, offering_id: id },
    });

    if (parsed.data.categoryIds.length > 0) {
      await prisma.storeOfferingCategory.createMany({
        data: parsed.data.categoryIds.map((categoryId) => ({
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          offering_id: id,
          category_id: categoryId,
          created_at: new Date(),
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ categoryIds: parsed.data.categoryIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(500, "ServerError", message);
  }
}
