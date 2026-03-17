import { prisma } from "@/lib/server/db";

// Cache simple en memoria por proceso (se invalida en cada deploy)
const permissionCache = new Map<string, { permissions: Set<string>; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Resuelve todos los permisos de un usuario en un tenant específico.
 * Recorre user_roles -> role_permissions -> permissions y retorna un Set<string>.
 * Es el único lugar en la app donde se resuelven permisos.
 */
export async function getUserPermissions(
  userId: string,
  tenantId: string
): Promise<Set<string>> {
  const cacheKey = `${userId}:${tenantId}`;
  const cached = permissionCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.permissions;
  }

  const userRoles = await prisma.userRole.findMany({
    where: { user_id: userId, tenant_id: tenantId },
    include: {
      role: {
        include: {
          RolePermission: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();

  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.RolePermission) {
      permissions.add(rolePermission.permission.key);
    }
  }

  permissionCache.set(cacheKey, {
    permissions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return permissions;
}

/**
 * Invalida el cache de permisos de un usuario en un tenant.
 * Llamar cuando se modifiquen los roles o permisos de un usuario.
 */
export function invalidatePermissionCache(userId: string, tenantId: string): void {
  permissionCache.delete(`${userId}:${tenantId}`);
}

/**
 * Verifica si un usuario tiene un permiso específico en un tenant.
 */
export async function hasPermission(
  userId: string,
  tenantId: string,
  permission: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId, tenantId);
  return permissions.has(permission);
}

/**
 * Obtiene el rol principal del usuario en un tenant.
 * Jerarquía: ADMIN > OWNER > STAFF
 */
export async function getUserRole(
  userId: string,
  tenantId: string
): Promise<"ADMIN" | "OWNER" | "STAFF" | null> {
  const userRoles = await prisma.userRole.findMany({
    where: { user_id: userId, tenant_id: tenantId },
    include: { role: { select: { name: true } } },
  });

  const roleNames = userRoles.map((ur) => ur.role.name);

  if (roleNames.includes("ADMIN")) return "ADMIN";
  if (roleNames.includes("OWNER")) return "OWNER";
  if (roleNames.includes("STAFF")) return "STAFF";

  return null;
}

