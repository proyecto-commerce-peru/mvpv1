import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalBoolean } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createCategory, listCategories } from "@/lib/server/catalog/service";
import { writeAuditLog } from "@/lib/server/audit";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams);
    const cursor = url.searchParams.get("cursor") ?? undefined;

    const result = await listCategories(auth.tenantId, limit, cursor);
    return jsonOk(requestId, result.rows, result.meta);
  });
}

export async function POST(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const body = expectObject(await parseJsonBody(request));

    const sortOrderRaw = body.sort_order;
    const sortOrder = typeof sortOrderRaw === "number" ? Math.trunc(sortOrderRaw) : undefined;

    const created = await createCategory({
      tenantId: auth.tenantId,
      catalogId: expectString(body, "catalog_id", 36, 36),
      name: expectString(body, "name", 2, 140),
      slug: expectString(body, "slug", 2, 160),
      parentId: typeof body.parent_id === "string" ? body.parent_id : undefined,
      sortOrder,
      isActive: optionalBoolean(body, "is_active"),
    });

    await writeAuditLog({
      tenantId: auth.tenantId,
      actorUserId: auth.userId,
      action: "CATEGORY_CREATED",
      entityType: "Category",
      entityId: created.id,
      after: created,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}