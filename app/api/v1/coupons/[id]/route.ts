import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString } from "@/lib/server/validation";
import { deleteCoupon, getCouponById, updateCoupon } from "@/lib/server/promotions/service";

type Params = {
  params: Promise<{ id: string }>;
};

function optionalDateOrNull(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const coupon = await getCouponById(auth.tenantId, id);
    return jsonOk(requestId, coupon);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const updated = await updateCoupon(auth.tenantId, id, {
      code: optionalString(body, "code", 2, 40),
      status: optionalString(body, "status", 2, 24),
      discountType: optionalString(body, "discount_type", 2, 16),
      discountValue: body.discount_value,
      minOrderTotal: body.min_order_total === null ? null : body.min_order_total,
      maxUses: body.max_uses === null ? null : typeof body.max_uses === "number" ? Math.trunc(body.max_uses) : undefined,
      startsAt: optionalDateOrNull(body.starts_at),
      endsAt: optionalDateOrNull(body.ends_at),
    });

    return jsonOk(requestId, updated);
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id } = await params;
    await deleteCoupon(auth.tenantId, id);
    return jsonOk(requestId, { id, deleted: true });
  });
}