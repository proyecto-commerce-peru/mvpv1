# Products Management (Admin + API) — Design Spec

Date: 2026-03-12

## Summary
This spec defines a v1 Products Management system for the admin area, including a RESTful API and an admin UI. Products are implemented by reusing existing `StoreOffering` records with `type = "PRODUCT"`, storing `price` and `sku` in `base_data` for simplicity. The admin UI lives under `/admin` with a fixed shadcn-style sidebar, and products are managed via a table with create/update dialogs and a per-row delete action.

## Goals
- Provide CRUD for products through versioned REST endpoints.
- Deliver an admin UI with a sidebar layout and a products table page.
- Keep the first version simple: no pagination/search, no auth gate, single-tenant context.

## Non-goals (v1)
- Multi-tenant auth-based routing or permissions.
- Pagination/search/filtering.
- Advanced product features (variants, inventory, categories, multi-images).
- GraphQL API.

## Architecture and Routes
- Admin UI base: `/admin`.
- Products UI: `/admin/products`.
- API base: `/api/v1/admin/products`.

### REST Endpoints (v1)
- `GET /api/v1/admin/products` — list products.
- `POST /api/v1/admin/products` — create product.
- `GET /api/v1/admin/products/{id}` — get product by id.
- `PATCH /api/v1/admin/products/{id}` — update product by id.
- `DELETE /api/v1/admin/products/{id}` — soft delete product by id.

### Status Codes & Error Envelope
- `200` for reads and updates.
- `201` for create.
- `204` for delete.
- `400` for malformed input.
- `404` for missing resource.
- `422` for validation errors.
- `500` for server errors.

Error payload format:
```json
{
  "error": "ValidationError",
  "message": "Request validation failed",
  "details": { "field": "title", "reason": "required" }
}
```

## Data Model Mapping
**Products map to `StoreOffering` with `type = "PRODUCT"`.**

Core fields:
- `StoreOffering.title` ⇢ product `title`
- `StoreOffering.description` ⇢ product `description`
- `StoreOffering.status` ⇢ product `status` (e.g., ACTIVE/INACTIVE)
- `StoreOffering.handle` ⇢ product `handle` (slug)
- `StoreOffering.cover_image_url` ⇢ product `coverImageUrl`
- `StoreOffering.currency_code` ⇢ product `currencyCode`
- `StoreOffering.base_data.price` ⇢ product `price`
- `StoreOffering.base_data.sku` ⇢ product `sku`
- `StoreOffering.deleted_at` ⇢ soft delete marker

List endpoint must filter out rows where `deleted_at` is not null.

### Tenant Context
Single-tenant assumption for v1. Use a fixed `tenant_id` from env or fallback to the first tenant in DB.

## API Request/Response Fields
**Product DTO (response):**
- `id`
- `title`
- `description`
- `status`
- `handle`
- `coverImageUrl`
- `currencyCode`
- `price`
- `sku`
- `createdAt`
- `updatedAt`

**Create/Update payload (request):**
- Required: `title`, `status`, `price`, `handle`
- Optional: `description`, `sku`, `coverImageUrl`, `currencyCode`

Validation rules (v1):
- `title` required, 1..180 chars
- `status` must be allowed value (default ACTIVE if omitted)
- `handle` required, unique per tenant (string slug)
- `price` numeric, >= 0
- `currencyCode` default "PEN" if omitted

## UI/UX
### Admin Layout
- Fixed left sidebar (shadcn-style), top header, content area with padding.
- Sidebar includes link to Products.

### Products Page
- Table columns: Title, Status, Price, SKU, Updated, Actions.
- Primary actions: Create (button), Edit (row action), Delete (row action).
- Create/Update via modal dialog with inline validation errors.
- Delete via confirmation dialog.
- Success/error feedback via lightweight inline alert or toast.

## Accessibility & UX Checks
- Ensure focus states for interactive elements.
- Dialogs must trap focus and include accessible labels.
- Buttons include visible labels and clear intent.

## Testing / Acceptance Scenarios
1. Create product → appears in table with correct fields.
2. Update product → fields update without reload.
3. Delete product → removed from list; record is soft-deleted.
4. API errors return correct status + error envelope.

## Assumptions
- No auth gate for admin routes in v1.
- Single-tenant context is acceptable for now.
- `price` and `sku` are stored in `base_data` for v1 simplicity.
- UI review will target admin UI files only.

