import { preflight, rejectOrigin } from "@/lib/server/cors";
import { jsonOk } from "@/lib/server/http";
import { withErrorHandling } from "@/lib/server/route";
import { parseJsonBody, expectObject, expectString } from "@/lib/server/validation";
import { parseTenantId } from "@/lib/server/auth/guards";
import { verifyMagicLinkToken } from "@/lib/server/auth/service";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const corsReject = rejectOrigin(request, requestId);
    if (corsReject) {
      return corsReject;
    }

    const tenantId = parseTenantId(request);
    const body = expectObject(await parseJsonBody(request));
    const token = expectString(body, "token", 10, 255);

    const auth = await verifyMagicLinkToken({ tenantId, token });
    return jsonOk(requestId, auth);
  });
}