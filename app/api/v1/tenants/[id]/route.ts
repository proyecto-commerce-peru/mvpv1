import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString } from "@/lib/server/validation";
import { getTenantById, updateTenant } from "@/lib/server/tenancy/service";

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
    const tenant = await getTenantById(auth.tenantId, id);

    return jsonOk(requestId, tenant);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const updated = await updateTenant(auth.tenantId, id, {
      name: optionalString(body, "name", 2, 160),
      legalName: body.legal_name === null ? null : optionalString(body, "legal_name", 0, 200),
      taxId: body.tax_id === null ? null : optionalString(body, "tax_id", 0, 32),
      status: optionalString(body, "status", 3, 24),
      countryCode: optionalString(body, "country_code", 2, 2),
      timezone: optionalString(body, "timezone", 2, 64),
      currencyCode: optionalString(body, "currency_code", 3, 3),
      metadata: body.metadata,
    });

    return jsonOk(requestId, updated);
  });
}