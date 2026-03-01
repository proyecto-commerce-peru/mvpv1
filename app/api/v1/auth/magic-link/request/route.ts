import { preflight, rejectOrigin } from "@/lib/server/cors";
import { jsonOk } from "@/lib/server/http";
import { withErrorHandling } from "@/lib/server/route";
import { parseJsonBody, expectObject, expectEmail } from "@/lib/server/validation";
import { parseTenantId } from "@/lib/server/auth/guards";
import { issueMagicLinkToken } from "@/lib/server/auth/service";

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
    const email = expectEmail(body);

    const result = await issueMagicLinkToken({ tenantId, email });

    return jsonOk(requestId, {
      message: "If the account exists, a magic link was generated",
      ...(process.env.NODE_ENV !== "production" ? { dev_token: result.token } : {}),
    });
  });
}