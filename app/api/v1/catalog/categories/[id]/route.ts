import { preflight, rejectOrigin } from "@/lib/server/cors";
import { requireAuth } from "@/lib/server/auth/guards";
import { withErrorHandling } from "@/lib/server/route";
import { jsonOk } from "@/lib/server/http";
import { parseJsonBody, expectObject, optionalString, optionalBoolean } from "@/lib/server/validation";
import { deleteCategory, getCategoryById, updateCategory } from "@/lib/server/catalog/service";

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
    const category = await getCategoryById(auth.tenantId, id);
    return jsonOk(requestId, category);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const reject = rejectOrigin(request, requestId);
    if (reject) return reject;
    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const sortOrderRaw = body.sort_order;
    const sortOrder = typeof sortOrderRaw === "number" ? Math.trunc(sortOrderRaw) : undefined;

    const updated = await updateCategory(auth.tenantId, id, {
      name: optionalString(body, "name", 2, 140),
      slug: optionalString(body, "slug", 2, 160),
      parentId: body.parent_id === null ? null : optionalString(body, "parent_id", 36, 36),
      sortOrder,
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
    await deleteCategory(auth.tenantId, id);
    return jsonOk(requestId, { id, deleted: true });
  });
}
