export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/server/auth/permissions";
import { resolveSessionUser } from "@/lib/server/auth/session";

// Rutas que no requieren autenticación
const PUBLIC_PATHS = [
  "/login",
  "/registro",
  "/register",
  "/api/auth",
  "/api/v1",
  "/_next",
  "/favicon.ico",
  "/file.svg",
  "/globe.svg",
  "/next.svg",
  "/vercel.svg",
  "/window.svg",
];

// Mapa de rutas del dashboard a permisos requeridos
const ROUTE_PERMISSIONS: Record<string, string> = {
  "/dashboard/whatsapp": "whatsapp:read",
  "/dashboard/agente": "agent:read",
  "/dashboard/pagos": "payments:read",
  "/dashboard/envios": "shipping:read",
  "/dashboard/precios": "prices:read",
  "/dashboard/promociones": "promotions:read",
  "/dashboard/imagenes": "images:read",
  "/dashboard/catalogo": "catalog:read",
  "/dashboard/perfil": "tenant:read",
  "/dashboard/ajustes": "tenant:write",
};

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dejar pasar rutas públicas sin verificación
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Solo proteger rutas del dashboard
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Verificar sesión con better-auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Sin sesión → redirigir a login
  if (!session?.user || !session?.session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const sessionUser = await resolveSessionUser(session);
  const tenantId = sessionUser?.tenant_id ?? null;

  // Sesión válida pero sin tenant asignado → continuar onboarding
  if (!sessionUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!tenantId) {
    if (pathname.startsWith("/dashboard/onboarding")) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/dashboard/onboarding", request.url));
  }

  // Tenant PENDING → redirigir a onboarding (excepto si ya está ahí)
  if (
    pathname !== "/dashboard/onboarding" &&
    !pathname.startsWith("/dashboard/onboarding")
  ) {
    const { prisma } = await import("@/lib/server/db");
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { status: true },
    });

    if (tenant?.status === "PENDING") {
      return NextResponse.redirect(new URL("/dashboard/onboarding", request.url));
    }
  }

  // Verificar permiso específico de la ruta
  const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(([route]) =>
    pathname.startsWith(route)
  )?.[1];

  if (requiredPermission) {
    const permissions = await getUserPermissions(sessionUser.id, tenantId);

    if (!permissions.has(requiredPermission)) {
      // Sin permiso → redirigir al dashboard principal con error
      const dashboardUrl = new URL("/dashboard", request.url);
      dashboardUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Inyectar x-tenant-id en los headers del request
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", tenantId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Aplicar middleware a todas las rutas excepto:
     * - archivos estáticos (_next/static, _next/image, etc.)
     * - favicon
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
