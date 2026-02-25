import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalBoolean } from "@/lib/server/validation";
import { deletePrice, getPriceById, updatePrice } from "@/lib/server/catalog/service";

type Params = {
  params: Promise<{ id: string }>;
};

function optionalDateOrNull(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
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
    const price = await getPriceById(auth.tenantId, id);
    return jsonOk(requestId, price);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const updated = await updatePrice(auth.tenantId, id, {
      listPrice: body.list_price === null ? null : body.list_price,
      salePrice: body.sale_price,
      startsAt: optionalDateOrNull(body.starts_at),
      endsAt: optionalDateOrNull(body.ends_at),
      isActive: optionalBoolean(body, "is_active"),
    });

    return jsonOk(requestId, updated);
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id } = await params;
    await deletePrice(auth.tenantId, id);
    return jsonOk(requestId, { id, deleted: true });
  });
}