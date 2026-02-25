import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString, optionalBoolean } from "@/lib/server/validation";
import { deletePriceList, updatePriceList } from "@/lib/server/catalog/service";

type Params = {
  params: Promise<{ id: string }>;
};

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

    const updated = await updatePriceList(auth.tenantId, id, {
      name: optionalString(body, "name", 2, 120),
      currencyCode: optionalString(body, "currency_code", 3, 3),
      isDefault: optionalBoolean(body, "is_default"),
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
    await deletePriceList(auth.tenantId, id);
    return jsonOk(requestId, { id, deleted: true });
  });
}