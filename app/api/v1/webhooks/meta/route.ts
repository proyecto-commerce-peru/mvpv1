import { preflight, rejectOrigin } from "@/lib/server/cors";
import { parseTenantId } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString } from "@/lib/server/validation";
import { ingestMetaWebhook } from "@/lib/server/whatsapp/service";
import { verifyMetaWebhookChallenge } from "@/lib/server/whatsapp/webhook-verify";
import { parseMetaIncomingMessages } from "@/lib/server/whatsapp/webhook-parser";
import { NextResponse } from "next/server";
import { withSecurityHeaders } from "@/lib/server/http";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  return withErrorHandling(request, async () => {
    const url = new URL(request.url);
    const challenge = verifyMetaWebhookChallenge({
      mode: url.searchParams.get("hub.mode"),
      verifyToken: url.searchParams.get("hub.verify_token"),
      challenge: url.searchParams.get("hub.challenge"),
    });

    return withSecurityHeaders(new NextResponse(challenge, { status: 200 }));
  });
}

export async function POST(request: Request) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;

    const tenantId = parseTenantId(request);
    const body = expectObject(await parseJsonBody(request));
    const incoming = parseMetaIncomingMessages(body);

    const externalId =
      (typeof body.external_id === "string" ? body.external_id : undefined) ??
      incoming[0]?.external_id ??
      crypto.randomUUID();

    const eventType = (typeof body.event_type === "string" ? body.event_type : undefined) ?? "meta.webhook";

    const result = await ingestMetaWebhook({
      tenantId,
      eventType: expectString({ value: eventType }, "value", 2, 160),
      externalId: expectString({ value: externalId }, "value", 2, 160),
      payload: body,
    });

    return jsonOk(requestId, result, undefined, result.duplicated ? 200 : 201);
  });
}
