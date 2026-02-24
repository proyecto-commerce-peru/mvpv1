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
