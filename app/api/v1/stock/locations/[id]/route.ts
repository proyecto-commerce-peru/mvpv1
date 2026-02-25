import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString, optionalBoolean } from "@/lib/server/validation";
import { updateLocation } from "@/lib/server/inventory/service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const updated = await updateLocation(auth.tenantId, id, {
      name: optionalString(body, "name", 2, 120),
      code: body.code === null ? null : optionalString(body, "code", 0, 40),
      isDefault: optionalBoolean(body, "is_default"),
    });

    return jsonOk(requestId, updated);
  });
}