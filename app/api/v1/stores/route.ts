import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString, optionalBoolean } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createStore, listStores } from "@/lib/server/tenancy/service";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const url = new URL(request.url);
    const result = await listStores(
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

    const created = await createStore({
      tenantId: auth.tenantId,
      name: expectString(body, "name", 2, 160),
      channel: optionalString(body, "channel", 2, 24),
      status: optionalString(body, "status", 3, 24),
      addressText: optionalString(body, "address_text", 0, 300),
      metadata: body.metadata,
    });

    if (optionalBoolean(body, "is_default") === true) {
      // reserved field in request for future compatibility
    }

    return jsonOk(requestId, created, undefined, 201);
  });
}