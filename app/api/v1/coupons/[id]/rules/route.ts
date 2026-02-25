import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString } from "@/lib/server/validation";
import { createCouponRule, listCouponRules } from "@/lib/server/promotions/service";

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

    const rows = await listCouponRules(auth.tenantId, id);
    return jsonOk(requestId, rows);
  });
}

export async function POST(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const created = await createCouponRule({
      tenantId: auth.tenantId,
      couponId: id,
      scope: expectString(body, "scope", 2, 24),
      ruleType: expectString(body, "rule_type", 2, 16),
      offeringId: optionalString(body, "offering_id", 36, 36),
      categoryId: optionalString(body, "category_id", 36, 36),
      rule: body.rule,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}