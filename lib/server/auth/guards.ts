import { ApiError } from "@/lib/server/errors";
import { verifyAccessToken } from "@/lib/server/auth/token";

export type AuthContext = {
  tenantId: string;
  userId: string;
  requestId: string;
};

export function parseTenantId(request: Request): string {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    throw new ApiError(400, "TENANT_REQUIRED", "x-tenant-id header is required");
  }
  return tenantId;
}

export function requireAuth(request: Request, requestId: string): AuthContext {
  const tenantId = parseTenantId(request);
  const auth = request.headers.get("authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "Bearer token is required");
  }

  const token = auth.replace("Bearer ", "").trim();
  const payload = verifyAccessToken(token);

  if (payload.tenant_id !== tenantId) {
    throw new ApiError(403, "TENANT_TOKEN_MISMATCH", "Token tenant does not match x-tenant-id");
  }

  return {
    tenantId,
    userId: payload.sub,
    requestId,
  };
}