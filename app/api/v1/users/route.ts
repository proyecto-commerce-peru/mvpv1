import { preflight, rejectOrigin } from "@/lib/server/cors";
import { jsonOk } from "@/lib/server/http";
import { withErrorHandling } from "@/lib/server/route";
import { parseJsonBody, expectObject, expectEmail, expectPassword, expectString, optionalString } from "@/lib/server/validation";
import { requireAuth } from "@/lib/server/auth/guards";
import { parseLimit } from "@/lib/server/pagination";
import { createUser, listUsers } from "@/lib/server/users/service";
import { toUserDto } from "@/lib/server/users/dto";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const corsReject = rejectOrigin(request, requestId);
    if (corsReject) {
      return corsReject;
    }

    const auth = requireAuth(request, requestId);
    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams);
    const cursor = url.searchParams.get("cursor") ?? undefined;

    const result = await listUsers({ tenantId: auth.tenantId, limit, cursor });
    return jsonOk(requestId, result.items.map(toUserDto), result.meta);
  });
}

export async function POST(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const corsReject = rejectOrigin(request, requestId);
    if (corsReject) {
      return corsReject;
    }

    const auth = requireAuth(request, requestId);
    const body = expectObject(await parseJsonBody(request));
    const email = expectEmail(body);
    const password = expectPassword(body);
    const fullName = expectString(body, "full_name", 2, 180);
    const status = optionalString(body, "status", 3, 24);

    const user = await createUser({
      tenantId: auth.tenantId,
      email,
      password,
      fullName,
      status,
    });

    return jsonOk(requestId, toUserDto(user), undefined, 201);
  });
}