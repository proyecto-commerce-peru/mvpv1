import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString } from "@/lib/server/validation";
import { getVariantById, softDeleteVariant, updateVariant } from "@/lib/server/catalog/service";

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
    const variant = await getVariantById(auth.tenantId, id);
    return jsonOk(requestId, variant);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const updated = await updateVariant(auth.tenantId, id, {
      sku: body.sku === null ? null : optionalString(body, "sku", 0, 80),
      barcode: body.barcode === null ? null : optionalString(body, "barcode", 0, 80),
      status: optionalString(body, "status", 2, 24),
      priceFinal: body.price_final,
      taxRate: body.tax_rate,
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
    await softDeleteVariant(auth.tenantId, id);
    return jsonOk(requestId, { id, deleted: true });
  });
}