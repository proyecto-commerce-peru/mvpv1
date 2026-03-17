import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/server/auth/permissions";
import { resolveSessionUser } from "@/lib/server/auth/session";

/**
 * GET /api/internal/permissions
 * Retorna los permisos del usuario autenticado.
 *
 * Query params:
 * - permission?: string — si se pasa, retorna { allowed: boolean }
 *                         si no se pasa, retorna { permissions: string[] }
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user || !session?.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = await resolveSessionUser(session);
  const tenantId = request.headers.get("x-tenant-id") ?? sessionUser?.tenant_id ?? null;
  if (!sessionUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!tenantId) {
    const { searchParams } = new URL(request.url);
    const singlePermission = searchParams.get("permission");

    if (singlePermission) {
      return NextResponse.json({ allowed: false });
    }

    return NextResponse.json({ permissions: [] });
  }

  const permissions = await getUserPermissions(sessionUser.id, tenantId);

  const { searchParams } = new URL(request.url);
  const singlePermission = searchParams.get("permission");

  if (singlePermission) {
    return NextResponse.json({ allowed: permissions.has(singlePermission) });
  }

  return NextResponse.json({ permissions: Array.from(permissions) });
}
