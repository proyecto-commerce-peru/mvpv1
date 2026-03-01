import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalBoolean } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createPrice, listPrices } from "@/lib/server/catalog/service";
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
    const result = await listPrices(
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

    const created = await createPrice({
      tenantId: auth.tenantId,
      priceListId: expectString(body, "price_list_id", 36, 36),
      offeringId: typeof body.offering_id === "string" ? body.offering_id : undefined,
      variantId: typeof body.variant_id === "string" ? body.variant_id : undefined,
      listPrice: body.list_price,
      salePrice: body.sale_price,
      isActive: optionalBoolean(body, "is_active"),
    });

    await writeAuditLog({
      tenantId: auth.tenantId,
      actorUserId: auth.userId,
      action: "PRICE_CREATED",
      entityType: "Price",
      entityId: created.id,
      after: created,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}