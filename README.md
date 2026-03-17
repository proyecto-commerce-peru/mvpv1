## Getting Started

First, download libraries:

```bash
npm install
```

Then, run the development server:

```bash
pnpm dev || npm run dev
```

## Environment

Create `.env` from `.env.example` and set:

- `DATABASE_URL`
- `AUTH_TOKEN_SECRET`
- `SUPPORT_EMAIL`
- `CORS_ALLOWED_ORIGINS` (only used in production)

## Prisma setup

### Validate the database

npm
```bash
npm run prisma:validate - Valida tu schema de Prisma
npm run prisma:migrate - Corre las migraciones
npm run prisma:seed - Siembra la base de datos
npx prisma db seed
npx prisma migrate reset --force -> PARA RESET DE DDBB
```
pnpn
```bash
pnpm prisma validate
pnpm prisma migrate dev --name init-primas
```

### Seed the database

```bash
pnpm prisma:seed
```


### Seed the database permissions

```bash
npm run prisma:seed:permissions
```



## API v1

Implemented endpoints (JSON / REST):

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/magic-link/request`
- `POST /api/v1/auth/magic-link/verify`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/users/{id}`
- `PATCH /api/v1/users/{id}`
- `DELETE /api/v1/users/{id}`
- `GET /api/v1/catalog/categories`
- `POST /api/v1/catalog/categories`
- `GET /api/v1/catalog/store-offerings`
- `POST /api/v1/catalog/store-offerings`
- `GET /api/v1/catalog/store-variants`
- `POST /api/v1/catalog/store-variants`
- `GET /api/v1/catalog/prices`
- `POST /api/v1/catalog/prices`
- `GET /api/v1/customers`
- `POST /api/v1/customers`
- `POST /api/v1/customers/addresses`
- `GET /api/v1/tags`
- `POST /api/v1/tags`
- `GET /api/v1/whatsapp-accounts`
- `POST /api/v1/whatsapp-accounts`
- `GET /api/v1/whatsapp-conversations`
- `GET /api/v1/whatsapp-messages`
- `POST /api/v1/whatsapp-messages`
- `POST /api/v1/webhooks/meta`
- `GET /api/v1/webhooks/meta` (Meta verification challenge)
- `GET /api/v1/carts`
- `POST /api/v1/carts`
- `POST /api/v1/carts/items`
- `GET /api/v1/orders`
- `POST /api/v1/orders`
- `POST /api/v1/stock/reconcile-reservations`
- `GET /api/v1/reports`
- `GET /api/v1/audit-logs`

Internal jobs:

- `POST /api/internal/jobs/outbox` (header `x-job-secret`)

Swagger/OpenAPI:

- `GET /api/openapi.json`
- `GET /api/docs`

## Security implemented

- CORS open in dev, restricted by allowlist in prod
- Security headers (helmet-style)
- Throttling progressive per tenant for auth flows
- DTO-based responses to avoid sensitive data leaks

## Testing

```bash
pnpm test
```

Unit tests include:

- progressive rate-limit behavior
- access token issue/verification
- validation rules
- user DTO mapping
- meta webhook parser + verification
- outbox/provider env guard tests

## Phase 4 runtime

- Real Meta Cloud API send integration via `OutboxEvent`
- Webhook verification handshake (`hub.challenge`)
- Outbox worker with retries/backoff for:
  - `whatsapp.message.send`
  - `whatsapp.webhook.process`


## Archivos creados y proposito 10-03-2026
- lib/auth.ts
  - Instancia de better-auth con hooks onSignUp y onPasswordChange
- lib/auth-client.ts
  - Cliente de better-auth para componentes React
- app/api/auth/[...all]/route.ts
  - Handler de endpoints de sesión web
- middleware.ts
  - Único guardián: verifica sesión, inyecta x-tenant-id, redirige a onboarding si tenant es PENDING
- lib/server/auth/permissions.ts
  - getUserPermissions() — único lugar donde se resuelven permisos
- lib/hooks/use-permission.ts
  - usePermission() y usePermissions() para componentes cliente
- app/api/internal/permissions/route.ts
  - Endpoint interno para consultar permisos desde el cliente
- app/api/internal/onboarding/route.ts
  - Endpoint para completar datos del negocio
- app/dashboard/onboarding/page.tsx
  - Página post-registro para completar datos del tenant
- prisma/seed-permissions.ts
  - Seed idempotente de los 26 permisos y 3 roles del sistema



# 1. Instalar better-auth
npm install better-auth@latest

# 2. Migrar la DB (crea las 4 tablas auth_*)
npm run prisma:migrate

# 3. Seed de permisos y roles del sistema
npm run prisma:seed:permissions
