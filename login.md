# Flujo de login de una cuenta existente

## Checklist
- [x] Ubicar la entrada de `/login`
- [x] Seguir el submit del formulario
- [x] Seguir el cliente auth hasta el endpoint
- [x] Seguir la configuración de Better Auth
- [x] Seguir el middleware, la sesión, el tenant y permisos
- [x] Distinguir el flujo web de la API REST paralela
- [x] Documentar todo en un solo archivo

Este documento describe la ruta completa del código que se ejecuta cuando un usuario hace login desde la página web `/login`.

> **Importante:** este documento se enfoca en el flujo web actual con Better Auth.  
> Existe una API REST paralela en `app/api/v1/auth/login/route.ts`, pero **no es la que usa la página `/login` actual**.

---

# 1) Ruta de entrada: página `/login`

## Archivo
`app/login/page.tsx`

## Qué hace
Esta página contiene el formulario de login del sitio y maneja dos caminos:

- login por email/password
- login social con Google

## Variables clave
- `callbackUrl`
- `safeRedirect`

## Código clave
- `app/login/page.tsx:25-26`

```ts
const callbackUrl = searchParams.get("callbackUrl")
const safeRedirect = callbackUrl?.startsWith("/") ? callbackUrl : "/dashboard"
```

## Qué significa
Si el usuario fue redirigido al login desde una ruta protegida, el login intenta volver a esa ruta al autenticarse.

---

# 2) Login por email/password desde el formulario

## Archivo
`app/login/page.tsx`

## Función clave
`handleSubmit`

## Paso a paso

### a) Captura submit
- `app/login/page.tsx:28-31`

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError(null)
```

### b) Llama a Better Auth desde el cliente
- `app/login/page.tsx:33-36`

```ts
const { error: signInError } = await authClient.signIn.email({
  email,
  password,
})
```

### c) Si hay error, muestra mensaje de credenciales inválidas
- `app/login/page.tsx:38-42`

### d) Si sale bien, navega al redirect seguro
- `app/login/page.tsx:44`

```ts
router.replace(safeRedirect)
```

## Flujo
`/login`  
→ submit  
→ `authClient.signIn.email(...)`  
→ si ok: `router.replace(safeRedirect)`

---

# 3) Login social con Google

## Archivo
`app/login/page.tsx`

## Función clave
`handleGoogleLogin`

## Código clave
- `app/login/page.tsx:47-50`

```ts
await authClient.signIn.social({ provider: "google", callbackURL: safeRedirect })
```

## Qué hace
Inicia el flujo social de Better Auth con callback final hacia:

- `callbackUrl` si viene de una ruta protegida
- o `/dashboard` como fallback

---

# 4) Cliente auth usado por la página

## Archivo
`lib/auth-client.ts`

## Qué hace
Crea el cliente React de Better Auth.

## Código clave
- `lib/auth-client.ts:3-5`

```ts
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});
```

Y exporta:

- `signIn`
- `signUp`
- `signOut`
- `useSession`
- `getSession`

## Flujo
`authClient.signIn.email(...)`  
→ request al backend Better Auth bajo `/api/auth/...`

---

# 5) Endpoint real que recibe el login web

## Archivo
`app/api/auth/[...all]/route.ts`

## Qué hace
Es el puente entre Next.js y Better Auth.

## Código
- `app/api/auth/[...all]/route.ts:1-4`

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

## Qué implica
Requests como:

- `/api/auth/sign-in/email`
- `/api/auth/sign-in/social`
- `/api/auth/get-session`

terminan ejecutándose dentro de la instancia `auth` definida en `lib/auth.ts`.

---

# 6) Configuración central de auth

## Archivo
`lib/auth.ts`

## Qué hace
Configura Better Auth y Prisma.

## Código clave
- `lib/auth.ts:22-29`

```ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  basePath: "/api/auth",
```

---

# 7) Qué parte de `lib/auth.ts` interviene realmente en login

## Archivo
`lib/auth.ts`

## Lo importante aquí
En el archivo visible del repo:

- **sí hay hooks para sign-up**
- **no se ve un hook específico para sign-in**

## Significado práctico
Cuando haces login web:

- Better Auth maneja internamente la autenticación
- valida email/password
- crea o recupera la sesión
- deja cookies/sesión activas

Pero el código visible personalizado del repo en `lib/auth.ts` está enfocado sobre todo en:

- `emailAndPassword.onPasswordChange`
- `hooks.before` para sign-up
- `hooks.after` para sign-up

### O sea
En el login, la parte personalizada visible **no crea tenant, ni roles, ni perfil**.
Eso ocurre en el registro, no en el login.

---

# 8) Después del login: navegación del frontend

Cuando `authClient.signIn.email(...)` responde sin error, el frontend hace:

- `router.replace(safeRedirect)`

## Archivo
`app/login/page.tsx`

## Línea clave
- `app/login/page.tsx:44`

Esto lleva al usuario normalmente a:

- `/dashboard`

O a otra ruta protegida si vino en `callbackUrl`.

---

# 9) Qué pasa al entrar a una ruta protegida del dashboard

## Archivo
`middleware.ts`

Este archivo define el acceso real al dashboard después del login.

---

## 9.1) Si la ruta no es pública y empieza con `/dashboard`
- `middleware.ts:50-53`

se ejecuta validación de auth.

---

## 9.2) Recupera la sesión con Better Auth
- `middleware.ts:55-58`

```ts
const session = await auth.api.getSession({
  headers: request.headers,
});
```

## Qué significa
Aquí el sistema verifica si el login realmente dejó una sesión/cookie visible para la request protegida.

---

## 9.3) Si no hay sesión válida
- `middleware.ts:60-65`

redirecciona a:

- `/login?callbackUrl=<ruta original>`

### Código clave
```ts
const loginUrl = new URL("/login", request.url);
loginUrl.searchParams.set("callbackUrl", pathname);
return NextResponse.redirect(loginUrl);
```

---

## 9.4) Resuelve el usuario autenticado en dominio

## Archivo
`lib/server/auth/session.ts`

### Función
`resolveSessionUser`

- `lib/server/auth/session.ts:4-25`

```ts
return prisma.user.findFirst({
  where: {
    id: userId,
    deleted_at: null,
  },
  select: {
    id: true,
    email: true,
    tenant_id: true,
    status: true,
  },
});
```

## Qué hace
Toma el `session.user.id` de Better Auth y busca el `User` real en tu tabla `users`.

---

## 9.5) Middleware usa ese usuario para derivar `tenantId`
- `middleware.ts:67-68`

```ts
const sessionUser = await resolveSessionUser(session);
const tenantId = sessionUser?.tenant_id ?? null;
```

---

# 10) Decisiones post-login del middleware

## Archivo
`middleware.ts`

Aquí están las bifurcaciones más importantes después del login.

---

## 10.1) Si la sesión existe pero no se encuentra `sessionUser`
- `middleware.ts:70-73`

```ts
if (!sessionUser) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

## Significado
Hay sesión Better Auth, pero no se pudo resolver el usuario de dominio.

---

## 10.2) Si el usuario no tiene `tenant_id`
- `middleware.ts:75-80`

```ts
if (!tenantId) {
  if (pathname.startsWith("/dashboard/onboarding")) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/dashboard/onboarding", request.url));
}
```

## Significado
Login exitoso, pero el usuario todavía no tiene tenant asignado.

### Resultado
→ se va a onboarding

---

## 10.3) Si el tenant existe pero está `PENDING`
- `middleware.ts:83-97`

```ts
const tenant = await prisma.tenant.findUnique({
  where: { id: tenantId },
  select: { status: true },
});

if (tenant?.status === "PENDING") {
  return NextResponse.redirect(new URL("/dashboard/onboarding", request.url));
}
```

## Significado
El usuario ya tiene tenant, pero todavía no completó onboarding del negocio.

### Resultado
→ también se va a onboarding

---

## 10.4) Si la ruta requiere permisos
- `middleware.ts:99-112`

```ts
const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(([route]) =>
  pathname.startsWith(route)
)?.[1];
```

Y luego:

```ts
const permissions = await getUserPermissions(sessionUser.id, tenantId);
```

Si no tiene permiso:

```ts
const dashboardUrl = new URL("/dashboard", request.url);
dashboardUrl.searchParams.set("error", "forbidden");
return NextResponse.redirect(dashboardUrl);
```

---

# 11) Resolución de permisos

## Archivo
`lib/server/auth/permissions.ts`

## Función principal
`getUserPermissions(userId, tenantId)`

- `lib/server/auth/permissions.ts:12-50`

## Qué hace
Resuelve permisos así:

- busca `user_roles`
- carga `role`
- carga `role_permissions`
- carga `permission`
- construye un `Set<string>` con keys tipo:
  - `catalog:read`
  - `tenant:read`
  - etc.

También usa un cache simple en memoria.

---

# 12) Qué endpoint interno de permisos se puede disparar después del login

## Archivo
`app/api/internal/permissions/route.ts`

Este endpoint suele usarse por hooks cliente dentro del dashboard, por ejemplo para pintar menú/sidebar o botones.

## Qué hace
- valida sesión
- resuelve `sessionUser`
- intenta obtener `tenantId` por header o por usuario
- si no hay tenant:
  - devuelve permisos vacíos o `allowed: false`
- si sí hay tenant:
  - devuelve permisos del usuario autenticado

---

# 13) Si el login termina en onboarding

## Archivo
`app/dashboard/onboarding/page.tsx`

## Qué hace
Renderiza el formulario de negocio y, al enviar, llama a:

- `POST /api/internal/onboarding`

## Código clave
- `app/dashboard/onboarding/page.tsx:45-49`

```ts
const res = await fetch("/api/internal/onboarding", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData),
});
```

Si sale bien:
- `app/dashboard/onboarding/page.tsx:59`

```ts
router.push("/dashboard");
```

---

# 14) Endpoint interno de onboarding

## Archivo
`app/api/internal/onboarding/route.ts`

## Qué hace
Completa la configuración del negocio después del login/registro.

### Paso a paso
1. valida sesión
2. resuelve `sessionUser`
3. intenta obtener `tenantId`
4. valida `name`, `slug`, etc.
5. si no hay tenant todavía:
   - crea un tenant nuevo
   - actualiza `user.tenant_id`
6. si sí hay tenant:
   - actualiza el tenant existente
7. responde `{ ok: true }`

---

# 15) Flujo completo resumido del login web

## Login por email/password

1. `app/login/page.tsx`
2. usuario llena email/password
3. `handleSubmit`
4. `authClient.signIn.email(...)` en `lib/auth-client.ts`
5. request a `/api/auth/sign-in/email`
6. `app/api/auth/[...all]/route.ts`
7. Better Auth autenticación interna con `auth` de `lib/auth.ts`
8. Better Auth crea/recupera sesión
9. vuelve al cliente
10. `router.replace(safeRedirect)`
11. entra `middleware.ts` al cargar `/dashboard` o ruta protegida
12. `auth.api.getSession(...)`
13. `resolveSessionUser(session)`
14. deriva `tenantId`
15. decide:
    - sin sesión → `/login`
    - sin tenant → `/dashboard/onboarding`
    - tenant `PENDING` → `/dashboard/onboarding`
    - sin permiso → `/dashboard?error=forbidden`
    - todo correcto → acceso al dashboard
16. dentro del dashboard, hooks cliente pueden llamar `/api/internal/permissions`
17. si cae en onboarding, el submit va a `/api/internal/onboarding`
18. onboarding crea/actualiza tenant
19. luego navega a `/dashboard`

---

# 16) Qué archivo NO es el flujo principal de `/login`

Existe una API REST paralela:

- `app/api/v1/auth/login/route.ts`

## Qué hace esa ruta
- espera `x-tenant-id` header
- parsea email/password
- aplica rate limit
- llama `loginWithPassword(...)`
- devuelve token API

## Importante
Ese flujo **no es el que usa la página web `/login` actual**.

La página `/login` usa:

- `authClient.signIn.email(...)`
- Better Auth
- `app/api/auth/[...all]/route.ts`

No usa:

- `POST /api/v1/auth/login`

---

# 17) Archivos más importantes del flujo de login

Si quieres entender rápido “qué se ejecuta cuando hago login”, los archivos más importantes son:

1. `app/login/page.tsx`
2. `lib/auth-client.ts`
3. `app/api/auth/[...all]/route.ts`
4. `lib/auth.ts`
5. `middleware.ts`
6. `lib/server/auth/session.ts`
7. `lib/server/auth/permissions.ts`
8. `app/dashboard/onboarding/page.tsx`
9. `app/api/internal/onboarding/route.ts`

---

# 18) Regla mental del flujo post-login

## Login web exitoso no significa automáticamente “entra al dashboard”

Después del login, todavía falta que el middleware valide:

- que exista sesión
- que exista `User` de dominio
- que tenga `tenant_id`
- que el tenant no esté en `PENDING`
- que tenga permisos para ciertas rutas

### Por eso el resultado final puede ser:
- `/dashboard`
- `/dashboard/onboarding`
- `/dashboard?error=forbidden`
- o de vuelta a `/login`

