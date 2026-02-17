import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString, optionalBoolean } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createCustomer, listCustomers } from "@/lib/server/customers/service";
import { writeAuditLog } from "@/lib/server/audit";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const url = new URL(request.url);
    const result = await listCustomers(
      auth.tenantId,
      parseLimit(url.searchParams),
      url.searchParams.get("cursor") ?? undefined,
    );

    return jsonOk(requestId, result.rows, result.meta);
  });
}

export async function POST(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const body = expectObject(await parseJsonBody(request));

    const created = await createCustomer({
      tenantId: auth.tenantId,
      fullName: optionalString(body, "full_name", 0, 180),
      phoneE164: expectString(body, "phone_e164", 8, 32),
      email: optionalString(body, "email", 0, 255)?.toLowerCase(),
      marketingOptIn: optionalBoolean(body, "marketing_opt_in"),
    });

    await writeAuditLog({
      tenantId: auth.tenantId,
      actorUserId: auth.userId,
      action: "CUSTOMER_CREATED",
      entityType: "Customer",
      entityId: created.id,
      after: created,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}