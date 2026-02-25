import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createPayment, listPayments } from "@/lib/server/payments/service";

function optionalDate(value: unknown): Date | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
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
    const result = await listPayments(
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

    const created = await createPayment({
      tenantId: auth.tenantId,
      orderId: expectString(body, "order_id", 36, 36),
      methodId: expectString(body, "method_id", 36, 36),
      amount: body.amount,
      currencyCode: optionalString(body, "currency_code", 3, 3),
      providerPaymentId: optionalString(body, "provider_payment_id", 0, 140),
      idempotencyKey: expectString(body, "idempotency_key", 4, 140),
      providerPayload: body.provider_payload,
      status: optionalString(body, "status", 2, 24),
      paidAt: optionalDate(body.paid_at),
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}