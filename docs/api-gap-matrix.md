# API Gap Matrix (MVP) — Prisma vs Endpoints

Fecha: 2026-02-25  
Base de análisis:
- Modelos: `prisma/schema.prisma`
- Endpoints actuales: `app/api/v1/**/route.ts` y `app/api/internal/jobs/outbox/route.ts`

## Leyenda
- ✅ Cubierto: existe endpoint público alineado al modelo
- 🟡 Parcial: existe endpoint pero faltan operaciones clave
- ❌ Faltante: no existe endpoint
- ⚙️ Interno: flujo interno/no expuesto públicamente

## Resumen rápido
- Total modelos: **62**
- ✅ Cubiertos: **13**
- 🟡 Parciales: **4**
- ❌ Faltantes: **41**
- ⚙️ Internos: **4**

## Cobertura actual (✅)
- User
- Customer
- Tag
- Category
- StoreOffering
- StoreVariant
- Price
- Cart
- Order
- WhatsappAccount
- WhatsappMessage
- AuditLog
- Report

## Cobertura parcial (🟡)

### CustomerAddress
- Actual: `POST /api/v1/customers/addresses`
- Falta: `GET /api/v1/customers/{id}/addresses`, `PATCH|DELETE /api/v1/customers/addresses/{id}`

### StockMovement
- Actual: `POST /api/v1/stock/reconcile-reservations`
- Falta: `GET|POST /api/v1/stock/movements`

### CartItem
- Actual: `POST /api/v1/carts/items`
- Falta: `GET /api/v1/carts/{id}/items`, `PATCH|DELETE /api/v1/carts/items/{id}`

### WhatsappConversation
- Actual: `GET /api/v1/whatsapp-conversations`
- Falta: `GET|PATCH /api/v1/whatsapp-conversations/{id}`

## Backlog propuesto (3 fases)

### Fase 1 — MVP estricto (operación diaria)

#### Tenancy
- [ ] Tenant → `GET|POST /api/v1/tenants`, `GET|PATCH /api/v1/tenants/{id}`
- [ ] TenantSetting → `GET|POST /api/v1/tenant-settings`, `PATCH|DELETE /api/v1/tenant-settings/{id}`
- [ ] TenantStore → `GET|POST /api/v1/stores`, `GET|PATCH /api/v1/stores/{id}`
- [ ] TenantDomain → `GET|POST /api/v1/tenant-domains`, `POST /api/v1/tenant-domains/{id}/verify`

#### Inventario
- [ ] InventoryLocation → `GET|POST /api/v1/stock/locations`, `PATCH /api/v1/stock/locations/{id}`
- [ ] StockItem → `GET|POST /api/v1/stock/items`, `GET|PATCH /api/v1/stock/items/{id}`
- [ ] StockBalance → `GET /api/v1/stock/balances`
- [ ] StockMovement (parcial) → `GET|POST /api/v1/stock/movements`

#### Orders/Fulfillment
- [ ] Fulfillment → `GET|POST /api/v1/orders/{id}/fulfillments`, `PATCH /api/v1/fulfillments/{id}`
- [ ] OrderItem → `GET /api/v1/orders/{id}/items`
- [ ] Order (ampliación) → `GET|PATCH /api/v1/orders/{id}`

#### Pagos
- [ ] PaymentMethod → `GET|POST /api/v1/payments/methods`, `PATCH /api/v1/payments/methods/{id}`
- [ ] Payment → `GET|POST /api/v1/payments`, `GET|PATCH /api/v1/payments/{id}`

#### Catálogo CRUD mínimo
- [ ] Category (ampliación) → `PATCH|DELETE /api/v1/catalog/categories/{id}`
- [ ] StoreOffering (ampliación) → `GET|PATCH|DELETE /api/v1/catalog/store-offerings/{id}`
- [ ] StoreVariant (ampliación) → `GET|PATCH|DELETE /api/v1/catalog/store-variants/{id}`
- [ ] Price (ampliación) → `PATCH|DELETE /api/v1/catalog/prices/{id}`
- [ ] Catalog → `GET|POST /api/v1/catalog/catalogs`, `PATCH /api/v1/catalog/catalogs/{id}`
- [ ] PriceList → `GET|POST /api/v1/catalog/price-lists`, `PATCH|DELETE /api/v1/catalog/price-lists/{id}`

### Fase 2 — MVP+ (comercial y retención)

#### Catálogo avanzado
- [ ] StoreOfferingCategory → `GET|POST|DELETE /api/v1/catalog/store-offerings/{id}/categories`
- [ ] StoreOfferingImage → `GET|POST|DELETE /api/v1/catalog/store-offerings/{id}/images`
- [ ] StoreOfferingAttribute → `GET|POST|DELETE /api/v1/catalog/store-offerings/{id}/attributes`
- [ ] OptionType → `GET|POST|PATCH|DELETE /api/v1/catalog/store-offerings/{id}/options`
- [ ] OptionValue → `GET|POST|PATCH|DELETE /api/v1/catalog/options/{id}/values`
- [ ] StoreVariantOption → `GET|POST|DELETE /api/v1/catalog/store-variants/{id}/options`
- [ ] ProductDetail → `GET|PUT /api/v1/catalog/store-offerings/{id}/product-detail`
- [ ] ServiceDetail → `GET|PUT /api/v1/catalog/store-offerings/{id}/service-detail`

#### Promociones y membresías
- [ ] Coupon → `GET|POST /api/v1/coupons`, `PATCH|DELETE /api/v1/coupons/{id}`
- [ ] CouponRule → `GET|POST|PATCH|DELETE /api/v1/coupons/{id}/rules`
- [ ] MembershipPlan → `GET|PUT /api/v1/catalog/store-offerings/{id}/membership-plan`
- [ ] CustomerMembership → `GET|POST /api/v1/customers/{id}/memberships`, `PATCH /api/v1/customer-memberships/{id}`

#### Customer extendido
- [ ] CustomerTag → `GET|POST|DELETE /api/v1/customers/{id}/tags`
- [ ] Customer (ampliación) → `GET|PATCH /api/v1/customers/{id}`
- [ ] CustomerAddress (parcial) → `GET /api/v1/customers/{id}/addresses`, `PATCH|DELETE /api/v1/customers/addresses/{id}`

#### WhatsApp extendido
- [ ] WhatsappTemplate → `GET|POST /api/v1/whatsapp-templates`, `PATCH /api/v1/whatsapp-templates/{id}`
- [ ] ConversationOrder → `GET|POST /api/v1/whatsapp-conversations/{id}/orders`
- [ ] WhatsappConversation (parcial) → `GET|PATCH /api/v1/whatsapp-conversations/{id}`
- [ ] WhatsappAccount (ampliación) → `PATCH|DELETE /api/v1/whatsapp-accounts/{id}`
- [ ] WhatsappMessage (ampliación) → `GET /api/v1/whatsapp-messages/{id}`

### Fase 3 — Admin/Backoffice

#### RBAC
- [ ] Role → `GET|POST /api/v1/rbac/roles`, `PATCH|DELETE /api/v1/rbac/roles/{id}`
- [ ] Permission → `GET /api/v1/rbac/permissions`
- [ ] RolePermission → `GET|POST|DELETE /api/v1/rbac/roles/{id}/permissions`
- [ ] UserRole → `GET|POST|DELETE /api/v1/rbac/users/{id}/roles`

#### Billing/SaaS
- [ ] SaasSubscription → `GET /api/v1/saas/subscriptions`
- [ ] MembershipCondition → `GET /api/v1/saas/subscriptions/{id}/conditions`
- [ ] TenantSaasSubscription → `GET|PATCH /api/v1/tenants/{id}/subscription`
- [ ] SaasInvoice → `GET /api/v1/billing/invoices`, `GET /api/v1/billing/invoices/{id}`

#### Operaciones complementarias
- [ ] TaxDocument → `GET|POST /api/v1/tax-documents`, `GET /api/v1/tax-documents/{id}`
- [ ] Refund → `GET|POST /api/v1/refunds`, `GET|PATCH /api/v1/refunds/{id}`
- [ ] ServiceBooking → `GET|POST /api/v1/service-bookings`, `PATCH /api/v1/service-bookings/{id}`
- [ ] Prospect → `GET|POST /api/v1/prospects`, `PATCH /api/v1/prospects/{id}`
- [ ] Report (ampliación) → `GET /api/v1/reports/{id}`
- [ ] AuditLog (ampliación) → `GET /api/v1/audit-logs/{id}`

## Modelos internos (⚙️)
- AuthIdentity → cubierto por flujos `auth/*` (no exponer CRUD público)
- PasswordResetToken → cubierto por `forgot-password` y `reset-password` (no exponer CRUD público)
- WebhookEvent → cubierto por `GET|POST /api/v1/webhooks/meta` (opcional endpoint admin de lectura)
- OutboxEvent → cubierto por `POST /api/internal/jobs/outbox` (opcional endpoint admin de lectura)

## Notas
- Esta matriz mide cobertura por existencia de endpoint, no profundidad de lógica de negocio.
- Las rutas sugeridas están pensadas para mantener naming consistente con lo ya implementado.
