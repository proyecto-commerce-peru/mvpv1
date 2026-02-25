import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString } from "@/lib/server/validation";
import { getOrderById, updateOrder } from "@/lib/server/commerce/service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const order = await getOrderById(auth.tenantId, id);
    return jsonOk(requestId, order);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const updated = await updateOrder(auth.tenantId, id, {
      status: optionalString(body, "status", 2, 32),
      notes: body.notes === null ? null : optionalString(body, "notes", 0, 5000),
    });

    return jsonOk(requestId, updated);
  });
}