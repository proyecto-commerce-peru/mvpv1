import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString, optionalBoolean } from "@/lib/server/validation";
import { createAddress } from "@/lib/server/customers/service";
import { writeAuditLog } from "@/lib/server/audit";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const auth = requireAuth(request, requestId);
    const body = expectObject(await parseJsonBody(request));

    const created = await createAddress({
      tenantId: auth.tenantId,
      customerId: expectString(body, "customer_id", 36, 36),
      label: optionalString(body, "label", 0, 60),
      countryCode: optionalString(body, "country_code", 2, 2),
      city: optionalString(body, "city", 0, 80),
      district: optionalString(body, "district", 0, 80),
      addressLine1: expectString(body, "address_line1", 5, 160),
      addressLine2: optionalString(body, "address_line2", 0, 160),
      reference: optionalString(body, "reference", 0, 200),
      postalCode: optionalString(body, "postal_code", 0, 20),
      isDefault: optionalBoolean(body, "is_default"),
    });

    await writeAuditLog({
      tenantId: auth.tenantId,
      actorUserId: auth.userId,
      action: "CUSTOMER_ADDRESS_CREATED",
      entityType: "CustomerAddress",
      entityId: created.id,
      after: created,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}