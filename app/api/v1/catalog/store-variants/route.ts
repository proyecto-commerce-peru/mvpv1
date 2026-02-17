import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, expectString, optionalString } from "@/lib/server/validation";
import { parseLimit } from "@/lib/server/pagination";
import { createVariant, listVariants } from "@/lib/server/catalog/service";
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

    const result = await listVariants(
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

    const created = await createVariant({
      tenantId: auth.tenantId,
      offeringId: expectString(body, "offering_id", 36, 36),
      sku: optionalString(body, "sku", 0, 80),
      barcode: optionalString(body, "barcode", 0, 80),
      priceFinal: body.price_final,
      taxRate: body.tax_rate,
    });

    await writeAuditLog({
      tenantId: auth.tenantId,
      actorUserId: auth.userId,
      action: "VARIANT_CREATED",
      entityType: "StoreVariant",
      entityId: created.id,
      after: created,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonOk(requestId, created, undefined, 201);
  });
}