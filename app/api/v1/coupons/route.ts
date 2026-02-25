import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createCoupon, listCoupons } from "@/lib/server/promotions/service";

function optionalDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || typeof value !== "string") {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const url = new URL(request.url);
    const result = await listCoupons(
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

    const created = await createCoupon({
      tenantId: auth.tenantId,
      code: expectString(body, "code", 2, 40),
      discountType: expectString(body, "discount_type", 2, 16),
      discountValue: body.discount_value,
      status: optionalString(body, "status", 2, 24),
      minOrderTotal: body.min_order_total,
      maxUses: typeof body.max_uses === "number" ? Math.trunc(body.max_uses) : undefined,
      startsAt: optionalDate(body.starts_at),
      endsAt: optionalDate(body.ends_at),
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}