"use client";

import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";

/**
 * Hook para verificar si el usuario actual tiene un permiso específico.
 * Llama al endpoint /api/internal/permissions para obtener los permisos del usuario.
 * Úsalo en componentes cliente para controlar visibilidad de botones y secciones.
 *
 * @example
 * const canDelete = usePermission("catalog:delete");
 * return canDelete ? <DeleteButton /> : null;
 */
export function usePermission(permission: string): boolean {
  const { data: session } = useSession();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setHasPermission(false);
      return;
    }

    fetch(`/api/internal/permissions?permission=${encodeURIComponent(permission)}`)
      .then((res) => res.json())
      .then((data: { allowed: boolean }) => {
        setHasPermission(data.allowed ?? false);
      })
      .catch(() => setHasPermission(false));
  }, [session?.user, permission]);

  return hasPermission;
}

/**
 * Hook para obtener todos los permisos del usuario actual.
 * Útil cuando necesitas verificar múltiples permisos a la vez.
 *
 * @example
 * const { permissions, isLoading } = usePermissions();
 * const canDelete = permissions.has("catalog:delete");
 */
export function usePermissions(): { permissions: Set<string>; isLoading: boolean } {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setPermissions(new Set());
      setIsLoading(false);
      return;
    }

    fetch("/api/internal/permissions")
      .then((res) => res.json())
      .then((data: { permissions: string[] }) => {
        setPermissions(new Set(data.permissions ?? []));
        setIsLoading(false);
      })
      .catch(() => {
        setPermissions(new Set());
        setIsLoading(false);
      });
  }, [session?.user]);

  return { permissions, isLoading };
}

