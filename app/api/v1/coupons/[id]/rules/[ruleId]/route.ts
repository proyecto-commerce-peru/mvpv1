import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString } from "@/lib/server/validation";
import { deleteCouponRule, updateCouponRule } from "@/lib/server/promotions/service";

type Params = {
  params: Promise<{ id: string; ruleId: string }>;
};

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id, ruleId } = await params;
    const body = expectObject(await parseJsonBody(request));

    const updated = await updateCouponRule({
      tenantId: auth.tenantId,
      couponId: id,
      ruleId,
      scope: optionalString(body, "scope", 2, 24),
      ruleType: optionalString(body, "rule_type", 2, 16),
      offeringId: body.offering_id === null ? null : optionalString(body, "offering_id", 36, 36),
      categoryId: body.category_id === null ? null : optionalString(body, "category_id", 36, 36),
      rule: body.rule,
    });

    return jsonOk(requestId, updated);
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id, ruleId } = await params;
    await deleteCouponRule(auth.tenantId, id, ruleId);
    return jsonOk(requestId, { id: ruleId, deleted: true });
  });
}