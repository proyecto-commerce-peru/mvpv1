import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString } from "@/lib/server/validation";
import { getStoreById, updateStore } from "@/lib/server/tenancy/service";

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
    const store = await getStoreById(auth.tenantId, id);
    return jsonOk(requestId, store);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const updated = await updateStore(auth.tenantId, id, {
      name: optionalString(body, "name", 2, 160),
      channel: optionalString(body, "channel", 2, 24),
      status: optionalString(body, "status", 3, 24),
      addressText: body.address_text === null ? null : optionalString(body, "address_text", 0, 300),
      metadata: body.metadata,
    });

    return jsonOk(requestId, updated);
  });
}
