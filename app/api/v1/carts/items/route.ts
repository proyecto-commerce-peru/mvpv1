import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString } from "@/lib/server/validation";
import { addCartItem } from "@/lib/server/commerce/service";
import { writeAuditLog } from "@/lib/server/audit";
import { ApiError } from "@/lib/server/errors";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const body = expectObject(await parseJsonBody(request));

    const quantityRaw = body.quantity;
    const quantity = typeof quantityRaw === "number" ? Math.trunc(quantityRaw) : Number.NaN;
    if (!Number.isFinite(quantity)) {
      throw new ApiError(422, "VALIDATION_ERROR", "quantity must be a number");
    }

    const created = await addCartItem({
      tenantId: auth.tenantId,
      cartId: expectString(body, "cart_id", 36, 36),
      offeringId: expectString(body, "offering_id", 36, 36),
      variantId: typeof body.variant_id === "string" ? body.variant_id : undefined,
      quantity,
      unitPrice: body.unit_price,
      actorUserId: auth.userId,
    });

    await writeAuditLog({
      tenantId: auth.tenantId,
      actorUserId: auth.userId,
      action: "CART_ITEM_ADDED",
      entityType: "CartItem",
      entityId: created.id,
      after: created,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}
