import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createFulfillment, listFulfillmentsByOrder } from "@/lib/server/commerce/service";

type Params = {
  params: Promise<{ id: string }>;
};

function optionalDate(value: unknown): Date | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
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
    const url = new URL(request.url);

    const result = await listFulfillmentsByOrder(
      auth.tenantId,
      id,
      parseLimit(url.searchParams),
      url.searchParams.get("cursor") ?? undefined,
    );

    return jsonOk(requestId, result.rows, result.meta);
  });
}

export async function POST(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const created = await createFulfillment({
      tenantId: auth.tenantId,
      orderId: id,
      status: optionalString(body, "status", 2, 24),
      carrier: optionalString(body, "carrier", 0, 80),
      trackingCode: optionalString(body, "tracking_code", 0, 120),
      shippedAt: optionalDate(body.shipped_at),
      deliveredAt: optionalDate(body.delivered_at),
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}