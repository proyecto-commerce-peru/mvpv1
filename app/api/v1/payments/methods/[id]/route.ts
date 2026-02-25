import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString, optionalBoolean } from "@/lib/server/validation";
import { updatePaymentMethod } from "@/lib/server/payments/service";

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

    const updated = await updatePaymentMethod(auth.tenantId, id, {
      provider: optionalString(body, "provider", 2, 40),
      name: optionalString(body, "name", 2, 120),
      isActive: optionalBoolean(body, "is_active"),
      config: body.config,
    });

    return jsonOk(requestId, updated);
  });
}