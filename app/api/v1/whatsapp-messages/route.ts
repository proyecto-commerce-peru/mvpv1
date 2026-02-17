import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { listMessages, sendMessage } from "@/lib/server/whatsapp/service";
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
    const conversationId = expectString(
      Object.fromEntries(url.searchParams.entries()),
      "conversation_id",
      36,
      36,
    );

    const result = await listMessages(
      auth.tenantId,
      conversationId,
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

    const created = await sendMessage({
      tenantId: auth.tenantId,
      conversationId: expectString(body, "conversation_id", 36, 36),
      textBody: expectString(body, "text", 1, 4096),
    });

    await writeAuditLog({
      tenantId: auth.tenantId,
      actorUserId: auth.userId,
      action: "WHATSAPP_MESSAGE_SENT",
      entityType: "WhatsappMessage",
      entityId: created.id,
      after: created,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}