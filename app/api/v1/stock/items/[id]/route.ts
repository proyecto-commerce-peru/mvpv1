import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalBoolean } from "@/lib/server/validation";
import { getStockItemById, updateStockItem } from "@/lib/server/inventory/service";

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
    const item = await getStockItemById(auth.tenantId, id);
    return jsonOk(requestId, item);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const updated = await updateStockItem(auth.tenantId, id, {
      trackStock: optionalBoolean(body, "track_stock"),
    });

    return jsonOk(requestId, updated);
  });
}