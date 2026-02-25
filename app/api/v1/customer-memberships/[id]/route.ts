import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString, optionalBoolean } from "@/lib/server/validation";
import { updateCustomerMembership } from "@/lib/server/memberships/service";

type Params = {
  params: Promise<{ id: string }>;
};

function optionalDateOrNull(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

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

    const updated = await updateCustomerMembership(auth.tenantId, id, {
      status: optionalString(body, "status", 2, 24),
      currentPeriodStart: optionalDateOrNull(body.current_period_start),
      currentPeriodEnd: optionalDateOrNull(body.current_period_end),
      expiresAt: optionalDateOrNull(body.expires_at),
      creditsBalance: typeof body.credits_balance === "number" ? Math.trunc(body.credits_balance) : undefined,
      autoRenew: optionalBoolean(body, "auto_renew"),
      metadata: body.metadata,
    });

    return jsonOk(requestId, updated);
  });
}