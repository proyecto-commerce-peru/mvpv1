import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createStockMovement, listStockMovements } from "@/lib/server/inventory/service";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const url = new URL(request.url);
    const result = await listStockMovements(
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

    const created = await createStockMovement({
      tenantId: auth.tenantId,
      stockItemId: expectString(body, "stock_item_id", 36, 36),
      locationId: expectString(body, "location_id", 36, 36),
      movementType: expectString(body, "movement_type", 2, 24),
      qty: body.qty,
      reason: optionalString(body, "reason", 0, 200),
      referenceType: optionalString(body, "reference_type", 0, 40),
      referenceId: optionalString(body, "reference_id", 0, 36),
      createdByUserId: auth.userId,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}