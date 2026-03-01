import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createWhatsappAccount, listWhatsappAccounts } from "@/lib/server/whatsapp/service";
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
    const result = await listWhatsappAccounts(
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

    const created = await createWhatsappAccount({
      tenantId: auth.tenantId,
      storeId: typeof body.store_id === "string" ? body.store_id : undefined,
      provider: expectString(body, "provider", 2, 40),
      phoneNumberId: expectString(body, "phone_number_id", 2, 120),
      wabaId: optionalString(body, "waba_id", 0, 120),
      displayPhone: optionalString(body, "display_phone", 0, 32),
      config: body.config,
    });

    await writeAuditLog({
      tenantId: auth.tenantId,
      actorUserId: auth.userId,
      action: "WHATSAPP_ACCOUNT_CREATED",
      entityType: "WhatsappAccount",
      entityId: created.id,
      after: created,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}