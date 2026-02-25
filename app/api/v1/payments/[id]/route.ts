import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString } from "@/lib/server/validation";
import { getPaymentById, updatePayment } from "@/lib/server/payments/service";

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
    const payment = await getPaymentById(auth.tenantId, id);
    return jsonOk(requestId, payment);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const updated = await updatePayment(auth.tenantId, id, {
      status: optionalString(body, "status", 2, 24),
      providerPaymentId: body.provider_payment_id === null ? null : optionalString(body, "provider_payment_id", 0, 140),
      providerPayload: body.provider_payload,
      paidAt: optionalDateOrNull(body.paid_at),
    });

    return jsonOk(requestId, updated);
  });
}