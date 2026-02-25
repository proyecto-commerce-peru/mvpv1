import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString } from "@/lib/server/validation";
import { updateFulfillment } from "@/lib/server/commerce/service";

type Params = {
  params: Promise<{ id: string }>;
};

function optionalDateOrNull(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const updated = await updateFulfillment(auth.tenantId, id, {
      status: optionalString(body, "status", 2, 24),
      carrier: body.carrier === null ? null : optionalString(body, "carrier", 0, 80),
      trackingCode: body.tracking_code === null ? null : optionalString(body, "tracking_code", 0, 120),
      shippedAt: optionalDateOrNull(body.shipped_at),
      deliveredAt: optionalDateOrNull(body.delivered_at),
    });

    return jsonOk(requestId, updated);
  });
}