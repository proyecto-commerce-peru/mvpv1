import { NextResponse } from "next/server";

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

export async function GET() {
  try {
    const tenantId = await getDefaultTenantId();
    const catalogId = await getDefaultCatalogId(tenantId);
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      where: { tenant_id: tenantId, catalog_id: catalogId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ items: categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(500, "ServerError", message);
  }
}
