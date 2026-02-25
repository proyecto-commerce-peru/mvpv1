import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createTenant, listTenants } from "@/lib/server/tenancy/service";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const url = new URL(request.url);

    const result = await listTenants(
      auth.tenantId,
      parseLimit(url.searchParams),
      url.searchParams.get("cursor") ?? undefined,
    );

    return jsonOk(requestId, result.rows, result.meta);
  });
}

export async function POST(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    requireAuth(request, requestId);
    const body = expectObject(await parseJsonBody(request));

    const created = await createTenant({
      name: expectString(body, "name", 2, 160),
      slug: expectString(body, "slug", 2, 160).toLowerCase(),
      legalName: optionalString(body, "legal_name", 0, 200),
      taxId: optionalString(body, "tax_id", 0, 32),
      status: optionalString(body, "status", 3, 24),
      countryCode: optionalString(body, "country_code", 2, 2),
      timezone: optionalString(body, "timezone", 2, 64),
      currencyCode: optionalString(body, "currency_code", 3, 3),
      metadata: body.metadata,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}