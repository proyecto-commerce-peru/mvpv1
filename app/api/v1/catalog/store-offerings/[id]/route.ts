import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString, optionalBoolean } from "@/lib/server/validation";
import { getOfferingById, softDeleteOffering, updateOffering } from "@/lib/server/catalog/service";

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
    const offering = await getOfferingById(auth.tenantId, id);
    return jsonOk(requestId, offering);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const updated = await updateOffering(auth.tenantId, id, {
      title: optionalString(body, "title", 2, 180),
      description: body.description === null ? null : optionalString(body, "description", 0, 5000),
      handle: body.handle === null ? null : optionalString(body, "handle", 0, 180),
      status: optionalString(body, "status", 2, 24),
      currencyCode: optionalString(body, "currency_code", 3, 3),
      isTaxIncluded: optionalBoolean(body, "is_tax_included"),
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
    await softDeleteOffering(auth.tenantId, id);
    return jsonOk(requestId, { id, deleted: true });
  });
}