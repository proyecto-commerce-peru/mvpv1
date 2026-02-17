import { preflight, rejectOrigin } from "@/lib/server/cors";
import { jsonOk } from "@/lib/server/http";
import { withErrorHandling } from "@/lib/server/route";
import { parseJsonBody, expectObject, expectPassword, expectString } from "@/lib/server/validation";
import { parseTenantId } from "@/lib/server/auth/guards";
import { resetPassword } from "@/lib/server/auth/service";

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
    const password = expectPassword(body, "new_password");

    await resetPassword({ tenantId, token, password });
    return jsonOk(requestId, { message: "Password reset completed" });
  });
}