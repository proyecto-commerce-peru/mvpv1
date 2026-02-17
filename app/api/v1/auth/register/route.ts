import { preflight, rejectOrigin } from "@/lib/server/cors";
import { jsonError, jsonOk } from "@/lib/server/http";
import { withErrorHandling } from "@/lib/server/route";
import { parseJsonBody, expectObject, expectEmail, expectPassword, expectString } from "@/lib/server/validation";
import { parseTenantId } from "@/lib/server/auth/guards";
import { checkThrottle, registerFailure, registerSuccess } from "@/lib/server/rate-limit";
import { registerWithPassword } from "@/lib/server/auth/service";

function actorKey(request: Request, email: string): string {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  return `${email}:${ip}`;
}

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
    const password = expectPassword(body);
    const fullName = expectString(body, "full_name", 2, 180);

    const throttle = checkThrottle(tenantId, "auth:register", actorKey(request, email));
    if (throttle > 0) {
      return jsonError(requestId, 429, "THROTTLED", `Too many failed attempts. Retry in ${Math.ceil(throttle / 1000)}s`);
    }

    try {
      const token = await registerWithPassword({ tenantId, email, password, fullName });
      registerSuccess(tenantId, "auth:register", actorKey(request, email));
      return jsonOk(requestId, token, undefined, 201);
    } catch (error) {
      registerFailure(tenantId, "auth:register", actorKey(request, email));
      throw error;
    }
  });
}