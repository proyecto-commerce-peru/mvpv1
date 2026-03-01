import { preflight, rejectOrigin } from "@/lib/server/cors";
import { jsonOk } from "@/lib/server/http";
import { withErrorHandling } from "@/lib/server/route";
import { parseJsonBody, expectObject, optionalString } from "@/lib/server/validation";
import { requireAuth } from "@/lib/server/auth/guards";
import { getUserById, softDeleteUser, updateUser } from "@/lib/server/users/service";
import { toUserDto } from "@/lib/server/users/dto";

type Params = {
  params: Promise<{ id: string }>;
};

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const corsReject = rejectOrigin(request, requestId);
    if (corsReject) {
      return corsReject;
    }

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const user = await getUserById(auth.tenantId, id);

    return jsonOk(requestId, toUserDto(user));
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const corsReject = rejectOrigin(request, requestId);
    if (corsReject) {
      return corsReject;
    }

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    const body = expectObject(await parseJsonBody(request));

    const user = await updateUser(auth.tenantId, id, {
      email: optionalString(body, "email", 5, 255)?.toLowerCase(),
      status: optionalString(body, "status", 3, 24),
      fullName: optionalString(body, "full_name", 2, 180),
      phone: body.phone === null ? null : optionalString(body, "phone", 0, 32),
    });

    return jsonOk(requestId, toUserDto(user));
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return withErrorHandling(request, async (requestId) => {
    const corsReject = rejectOrigin(request, requestId);
    if (corsReject) {
      return corsReject;
    }

    const auth = requireAuth(request, requestId);
    const { id } = await params;
    await softDeleteUser(auth.tenantId, id);

    return jsonOk(requestId, { id, deleted: true });
  });
}