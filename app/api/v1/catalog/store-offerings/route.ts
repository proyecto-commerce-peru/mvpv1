import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString, optionalBoolean } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createOffering, listOfferings } from "@/lib/server/catalog/service";
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
    const result = await listOfferings(
      auth.tenantId,
      parseLimit(url.searchParams),
      url.searchParams.get("cursor") ?? undefined,
    );

    return jsonOk(requestId, result.rows, result.meta);
  });
}

export async function POST(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const body = expectObject(await parseJsonBody(request));

    const created = await createOffering({
      tenantId: auth.tenantId,
      catalogId: expectString(body, "catalog_id", 36, 36),
      type: expectString(body, "type", 3, 24),
      title: expectString(body, "title", 2, 180),
      description: optionalString(body, "description", 0, 5000),
      handle: optionalString(body, "handle", 0, 180),
      currencyCode: optionalString(body, "currency_code", 3, 3),
      isTaxIncluded: optionalBoolean(body, "is_tax_included"),
    });

    await writeAuditLog({
      tenantId: auth.tenantId,
      actorUserId: auth.userId,
      action: "OFFERING_CREATED",
      entityType: "StoreOffering",
      entityId: created.id,
      after: created,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}