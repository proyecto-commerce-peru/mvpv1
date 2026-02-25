import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString, optionalBoolean } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createPriceList, listPriceLists } from "@/lib/server/catalog/service";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const url = new URL(request.url);
    const result = await listPriceLists(
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
    const auth = requireAuth(request, requestId);
    const body = expectObject(await parseJsonBody(request));

    const created = await createPriceList({
      tenantId: auth.tenantId,
      catalogId: expectString(body, "catalog_id", 36, 36),
      name: expectString(body, "name", 2, 120),
      currencyCode: optionalString(body, "currency_code", 3, 3),
      isDefault: optionalBoolean(body, "is_default"),
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}