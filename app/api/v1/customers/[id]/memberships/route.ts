import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString, optionalBoolean } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createCustomerMembership, listCustomerMemberships } from "@/lib/server/memberships/service";
import { ApiError } from "@/lib/server/errors";

type Params = {
  params: Promise<{ id: string }>;
};

function expectDate(value: unknown, field: string): Date {
  if (typeof value !== "string") {
    throw new ApiError(422, "VALIDATION_ERROR", `${field} must be ISO date string`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(422, "VALIDATION_ERROR", `${field} must be valid date`);
  }
  return parsed;
}

function optionalDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || typeof value !== "string") {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const url = new URL(request.url);

    const result = await listCustomerMemberships(
      auth.tenantId,
      id,
      parseLimit(url.searchParams),
      url.searchParams.get("cursor") ?? undefined,
    );

    return jsonOk(requestId, result.rows, result.meta);
  });
}

export async function POST(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const created = await createCustomerMembership({
      tenantId: auth.tenantId,
      customerId: id,
      membershipPlanId: expectString(body, "membership_plan_id", 36, 36),
      orderId: optionalString(body, "order_id", 36, 36),
      status: optionalString(body, "status", 2, 24),
      startedAt: expectDate(body.started_at, "started_at"),
      currentPeriodStart: optionalDate(body.current_period_start),
      currentPeriodEnd: optionalDate(body.current_period_end),
      expiresAt: optionalDate(body.expires_at),
      creditsBalance: typeof body.credits_balance === "number" ? Math.trunc(body.credits_balance) : undefined,
      autoRenew: optionalBoolean(body, "auto_renew"),
      metadata: body.metadata,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}