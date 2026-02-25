import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString, optionalBoolean } from "@/lib/server/validation";
import { getMembershipPlanByOffering, upsertMembershipPlan } from "@/lib/server/memberships/service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const plan = await getMembershipPlanByOffering(auth.tenantId, id);
    return jsonOk(requestId, plan);
  });
}

export async function PUT(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const plan = await upsertMembershipPlan({
      tenantId: auth.tenantId,
      offeringId: id,
      billingType: expectString(body, "billing_type", 2, 24),
      periodUnit: optionalString(body, "period_unit", 0, 16),
      periodCount: typeof body.period_count === "number" ? Math.trunc(body.period_count) : undefined,
      validityDays: typeof body.validity_days === "number" ? Math.trunc(body.validity_days) : undefined,
      creditsIncluded: typeof body.credits_included === "number" ? Math.trunc(body.credits_included) : undefined,
      rolloverCredits: optionalBoolean(body, "rollover_credits"),
      trialDays: typeof body.trial_days === "number" ? Math.trunc(body.trial_days) : undefined,
      entitlements: body.entitlements,
    });

    return jsonOk(requestId, plan);
  });
}