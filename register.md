# Flujo de registro de una nueva cuenta

## Checklist
- [x] Ubicar la entrada de `/register`
- [x] Seguir el submit del formulario
- [x] Seguir el cliente auth hasta el endpoint
- [x] Seguir la configuración de Better Auth y sus hooks
- [x] Seguir qué pasa después del registro: sesión, middleware y onboarding
- [x] Documentar la ruta completa del código sin hacer cambios

Te muestro la ruta completa del código que se ejecuta cuando se registra una cuenta nueva usando el flujo actual de `/register`.

---

# 1) Ruta de entrada: página `/register`

## Archivo
`app/register/page.tsx`

## Qué hace
Esta página no tiene lógica propia. Solo renderiza el formulario de registro:

- importa `RegisterForm`
- devuelve `<RegisterForm />`

## Código clave
- `app/register/page.tsx:1`
- `app/register/page.tsx:4`

### Flujo
`/register`  
→ renderiza `RegisterForm`

---

# 2) Formulario cliente que dispara el registro

## Archivo
`components/auth/register-form.tsx`

## Qué hace
Aquí está el flujo real del submit de registro por email/password.

## Función clave
`handleSubmit`

## Paso a paso

### a) Captura el submit
En:

- `components/auth/register-form.tsx:39`

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
```

### b) Activa loading y limpia error
- `components/auth/register-form.tsx:41-42`

### c) Llama al cliente Better Auth
En:

- `components/auth/register-form.tsx:44-48`

```ts
const { error: signUpError } = await authClient.signUp.email({
  name: formData.name,
  email: formData.email,
  password: formData.password,
});
```

### d) Si falla, muestra error en UI
- `components/auth/register-form.tsx:50-57`

### e) Si sale bien, navega a onboarding
- `components/auth/register-form.tsx:60`

```ts
router.push("/dashboard/onboarding");
```

---

# 3) Cliente de auth usado por el formulario

## Archivo
`lib/auth-client.ts`

## Qué hace
Crea el cliente de Better Auth para React.

## Código clave
- `lib/auth-client.ts:3-5`

```ts
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});
```

Y exporta:

- `signUp`
- `signIn`
- `signOut`
- `useSession`
- etc.

## Flujo
`authClient.signUp.email(...)`  
→ llama al backend Better Auth en base a `baseURL`  
→ endpoint bajo `/api/auth/...`

---

# 4) Endpoint real que recibe el registro

## Archivo
`app/api/auth/[...all]/route.ts`

## Qué hace
Este archivo es el puente entre Next.js y Better Auth.

## Código
- `app/api/auth/[...all]/route.ts:1-4`

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

## Flujo
Cualquier request a:

- `/api/auth/sign-up/email`
- `/api/auth/sign-up`
- etc.

entra por este handler y termina usando la instancia `auth` definida en:

- `lib/auth.ts`

---

# 5) Configuración central de Better Auth

## Archivo
`lib/auth.ts`

Este es el archivo más importante del flujo.

---

## 5.1) Inicialización de Better Auth

### Código clave
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

## Qué implica
Cuando haces registro por `/register`:

- Better Auth usa Prisma
- usa la BD PostgreSQL
- y monta sus endpoints bajo `/api/auth`

---

## 5.2) Habilitación de email/password

### Código clave
- `lib/auth.ts:31-67`

```ts
emailAndPassword: {
  enabled: true,
  minPasswordLength: 8,
  ...
}
```

## Qué implica
Tu `signUp.email(...)` del frontend entra por este provider.

---

# 6) Hook `before` que se ejecuta antes del sign-up

## Archivo
`lib/auth.ts`

## Sección
- `lib/auth.ts:69-84`

## Qué hace
Intercepta requests de:

- `/sign-up`
- `/sign-up/email`

y solo registra logs.

### Condición
- `lib/auth.ts:70-73`

```ts
if (context.path !== "/sign-up" && context.path !== "/sign-up/email") {
  return;
}
```

### Log
- `lib/auth.ts:75-79`

```ts
console.log("[better-auth hook] ✓✓✓ SIGN-UP TRIGGERED", {
  path: context.path,
  hasBody: !!context.body,
});
```

## Flujo
Request de registro  
→ entra a Better Auth  
→ se ejecuta `hooks.before`

---

# 7) Better Auth crea el usuario/session base

Esto no está implementado manualmente en tu repo; lo hace internamente Better Auth con:

- el adapter Prisma
- el endpoint `sign-up/email`

## Resultado esperado de esa parte
Cuando termina esa fase, Better Auth deja disponible:

- `context.context.newSession`
- `newSession.user`

Ese resultado luego lo consume tu hook `after`.

---

# 8) Hook `after` que corre después del sign-up

## Archivo
`lib/auth.ts`

## Sección
- `lib/auth.ts:85-261`

Este es el bloque que hace todo el bootstrap de negocio/tenant.

---

## 8.1) Filtra solo sign-up
- `lib/auth.ts:85-88`

```ts
if (context.path !== "/sign-up" && context.path !== "/sign-up/email") {
  return;
}
```

---

## 8.2) Obtiene el usuario recién creado por Better Auth
- `lib/auth.ts:90-98`

```ts
const newSession = context.context.newSession;
const authUser = newSession?.user;
```

Si no existe `authUser.id` o `authUser.email`, sale.

---

## 8.3) Prepara IDs y datos base
- `lib/auth.ts:101-115`

Genera:

- `tenantId`
- `ownerRoleId`
- `userProfileId`
- `authIdentityId`
- `userRoleId`

Y además calcula:

- `tenantName`
- `tenantSlug`

---

## 8.4) Busca el `User` ya creado por Better Auth en Prisma
- `lib/auth.ts:117-129`

```ts
const existingUser = await prisma.user.findUnique({
  where: { id: authUser.id },
  select: { id: true, tenant_id: true, email: true, name: true },
});
```

## Qué significa
Tu tabla `users` es compartida por Better Auth y tu dominio actual.

---

## 8.5) Si el usuario ya tenía tenant, no hace bootstrap
- `lib/auth.ts:131-137`

```ts
if (existingUser.tenant_id) {
  ...
  return;
}
```

---

# 9) Transacción que crea tenant + datos de dominio

## Archivo
`lib/auth.ts`

## Inicio de transacción
- `lib/auth.ts:139`

```ts
await prisma.$transaction(async (tx) => {
```

Dentro de esa transacción pasan varias cosas.

---

## 9.1) Resuelve permisos OWNER base
- `lib/auth.ts:140-168`

### Primero intenta clonar desde tenant `system`
Busca un rol:

- nombre: `"OWNER"`
- tenant con `slug = "system"`

```ts
const systemOwnerRole = await tx.role.findFirst({
  where: {
    name: "OWNER",
    tenant: { slug: "system" },
  },
```

### Si existe
toma sus `RolePermission.permission_id`

### Si no existe
hace fallback a `Permission` por keys definidas en:

- `OWNER_PERMISSION_KEYS`
- `lib/auth.ts:7-20`

### Si no encuentra ningún permiso
lanza error:
- `lib/auth.ts:166-167`

```ts
throw new Error("No OWNER permissions available. Seed permissions first.");
```

---

## 9.2) Crea el tenant
- `lib/auth.ts:170-182`

```ts
await tx.tenant.create({
  data: {
    id: tenantId,
    name: tenantName,
    slug: tenantSlug,
    status: "PENDING",
    country_code: "PE",
    timezone: "America/Lima",
    currency_code: "PEN",
    createdAt: now,
    updatedAt: now,
  },
});
```

## Qué crea
Un `Tenant` en estado:

- `PENDING`

---

## 9.3) Vincula el usuario al tenant
- `lib/auth.ts:184-191`

```ts
await tx.user.update({
  where: { id: existingUser.id },
  data: {
    tenant_id: tenantId,
    name: existingUser.name || tenantName,
    status: "ACTIVE",
  },
});
```

## Qué hace
El `User` recién creado queda asociado al negocio.

---

## 9.4) Crea `UserProfile`
- `lib/auth.ts:193-204`

---

## 9.5) Crea `AuthIdentity`
- `lib/auth.ts:206-216`

Con provider:

- `"PASSWORD"`

---

## 9.6) Crea el rol `OWNER` del tenant
- `lib/auth.ts:218-228`

---

## 9.7) Asigna el usuario a ese rol
- `lib/auth.ts:230-238`

en `user_roles`

---

## 9.8) Copia permisos al rol OWNER
- `lib/auth.ts:240-249`

```ts
await tx.rolePermission.createMany({
  data: ownerPermissionIds.map((permission_id) => ({
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    role_id: ownerRoleId,
    permission_id,
  })),
});
```

---

# 10) Fin del hook `after`

## Log final
- `lib/auth.ts:252-256`

```ts
console.log("[better-auth hook] ✅ Tenant bootstrap completed", {
  userId: existingUser.id,
  tenantId,
  tenantSlug,
});
```

Si algo falla:
- `lib/auth.ts:257-259`

```ts
console.error("[better-auth hook] ❌ AFTER SIGN-UP ERROR:", error);
throw error;
```

---

# 11) Qué pasa después en el frontend

Si todo lo anterior sale bien, vuelves a:

## Archivo
`components/auth/register-form.tsx`

## Línea
- `components/auth/register-form.tsx:60`

```ts
router.push("/dashboard/onboarding");
```

O sea:

registro exitoso  
→ redirect cliente a `/dashboard/onboarding`

---

# 12) Qué pasa al entrar a `/dashboard/onboarding`

Aquí empieza la fase post-registro.

## Archivo
`middleware.ts`

Este archivo protege `/dashboard`.

---

## 12.1) Revisa si hay sesión
- `middleware.ts:55-65`

```ts
const session = await auth.api.getSession({
  headers: request.headers,
});
```

Si no hay sesión:
- redirige a `/login`

---

## 12.2) Resuelve el usuario autenticado en dominio
- `middleware.ts:67-68`

```ts
const sessionUser = await resolveSessionUser(session);
const tenantId = sessionUser?.tenant_id ?? null;
```

Ese helper viene de:

## Archivo
`lib/server/auth/session.ts`

### Función
- `resolveSessionUser`
- `lib/server/auth/session.ts:4-25`

Busca en Prisma:

```ts
return prisma.user.findFirst({
  where: {
    id: userId,
    deleted_at: null,
  },
```

---

## 12.3) Si no hay tenant todavía
- `middleware.ts:75-80`

te manda a:

- `/dashboard/onboarding`

---

## 12.4) Si el tenant está en `PENDING`
- `middleware.ts:83-97`

también te manda a onboarding.

### Esto calza con el hook `after`
porque el tenant recién creado sale en:

- `status: "PENDING"`

---

# 13) Página de onboarding

## Archivo
`app/dashboard/onboarding/page.tsx`

No te lo adjunto completo otra vez, pero el flujo es:

- renderiza el formulario de negocio
- cuando envías, hace `fetch("/api/internal/onboarding", ...)`

---

# 14) Endpoint interno de onboarding

## Archivo
`app/api/internal/onboarding/route.ts`

## Qué hace
Completa la configuración del negocio.

### Paso a paso

#### a) Recupera sesión
- `app/api/internal/onboarding/route.ts:6-11`

#### b) Resuelve `sessionUser`
- `app/api/internal/onboarding/route.ts:13-16`

#### c) Intenta obtener tenant actual
- header `x-tenant-id`
- o `resolveSessionTenantId(session)`

- `app/api/internal/onboarding/route.ts:18-19`

#### d) Valida body
- `name`
- `slug`
- etc.

#### e) Si no existe tenant todavía, crea uno y vincula al usuario
- `app/api/internal/onboarding/route.ts:62-91`

#### f) Si sí existe tenant, lo actualiza
- `app/api/internal/onboarding/route.ts:94-106`

---

# 15) Endpoint interno de permisos que también se ejecuta en dashboard/onboarding

## Archivo
`app/api/internal/permissions/route.ts`

Este endpoint puede dispararse porque el sidebar y hooks cliente usan permisos.

## Qué hace
- valida sesión
- resuelve `sessionUser`
- resuelve `tenantId`
- si no hay tenant:
  - devuelve permisos vacíos o `allowed: false`
- si sí hay tenant:
  - llama a `getUserPermissions(...)`

---

# 16) Ruta completa resumida, en orden

## Registro por email/password

1. `app/register/page.tsx`
2. `components/auth/register-form.tsx`
3. `authClient.signUp.email(...)` en `lib/auth-client.ts`
4. request a `/api/auth/sign-up/email`
5. `app/api/auth/[...all]/route.ts`
6. instancia `auth` en `lib/auth.ts`
7. `hooks.before` en `lib/auth.ts`
8. Better Auth crea usuario/sesión base
9. `hooks.after` en `lib/auth.ts`
10. busca `User` en Prisma
11. crea `Tenant`
12. actualiza `User.tenant_id`
13. crea `UserProfile`
14. crea `AuthIdentity`
15. crea `Role OWNER`
16. crea `UserRole`
17. copia `RolePermission`
18. vuelve al frontend
19. `router.push("/dashboard/onboarding")`
20. entra `middleware.ts`
21. valida sesión y tenant
22. deja pasar a onboarding o redirige según estado
23. `app/dashboard/onboarding/page.tsx`
24. submit a `app/api/internal/onboarding/route.ts`
25. crea o actualiza tenant final
26. luego navega a `/dashboard`

---

# 17) Qué archivo NO es el flujo principal de `/register`

Hay un archivo paralelo:

- `lib/server/auth/service.ts`

Ese tiene funciones como:
- `registerWithPassword(...)`
- `loginWithPassword(...)`

Pero **no es el flujo que usa la página `/register` actual**.

Tu `/register` hoy usa:

- `authClient.signUp.email(...)`
- Better Auth
- `lib/auth.ts`

---

# 18) Punto más importante del flujo actual

El corazón del registro real está en:

- `components/auth/register-form.tsx`
- `app/api/auth/[...all]/route.ts`
- `lib/auth.ts`

Si quieres entender “qué se ejecuta cuando me registro”, el archivo más importante de todos es:

- `lib/auth.ts`

porque ahí ocurre:

- el hook `before`
- el hook `after`
- la creación del tenant
- la vinculación al usuario
- roles
- permisos

