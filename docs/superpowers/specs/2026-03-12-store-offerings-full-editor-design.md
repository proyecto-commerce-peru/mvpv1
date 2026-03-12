# Store Offerings Full Editor — Design Spec

Date: 2026-03-12

## Summary
Expand the products module to manage prices, images, and categories for store offerings on a single admin page. Add nested REST endpoints for prices, images, and categories; use Zod for validation; and implement a local file upload endpoint that stores files under `public/uploads` and saves URLs in `store_offering_images`.

## Goals
- One product editor page with sections for details, prices, images, and categories.
- Full CRUD for price rows, images, and category assignments.
- Local upload strategy for v1 with validation and stored URLs.

## Non-goals
- Variant pricing or complex price schedules in v1.
- S3 or external storage integration.
- Multi-page editing flows.

## Data Model Scope
Use existing schema entities:
- `store_offerings` (core product)
- `prices` (list_price + sale_price)
- `store_offering_images` (multiple images)
- `store_offering_categories` (many-to-many categories)

## API Routes (v1)
- `GET /api/v1/admin/products/{id}` (existing)
- `PATCH /api/v1/admin/products/{id}` (existing)
- `GET /api/v1/admin/products/{id}/prices`
- `POST /api/v1/admin/products/{id}/prices` (create/replace active price)
- `GET /api/v1/admin/products/{id}/images`
- `POST /api/v1/admin/products/{id}/images`
- `PATCH /api/v1/admin/products/{id}/images/{imageId}`
- `DELETE /api/v1/admin/products/{id}/images/{imageId}`
- `GET /api/v1/admin/categories`
- `PUT /api/v1/admin/products/{id}/categories` (replace assignments)
- `POST /api/v1/admin/uploads` (multipart upload, returns URL)

All endpoints should use the existing error envelope and Zod validation.

## UI Flow (Single Page)
`/admin/products/{id}` with stacked sections:
- **Details**: title, handle, status, description, cover image.
- **Pricing**: list_price + sale_price (default PriceList).
- **Images**: list with preview, sort order, add/remove. Add new via URL or upload.
- **Categories**: searchable multi-select list.

Actions per section:
- Save Details
- Save Prices
- Save Images
- Save Categories

## Image Upload Strategy (Local)
- `POST /api/v1/admin/uploads` accepts multipart form data.
- Store in `public/uploads/products/{offeringId}/...`.
- Return the public URL and create `store_offering_images` row.
- Validate file type and size; return `422` on invalid input.

## Validation
- Add Zod schemas for price payloads, image payloads, category assignments.
- Apply in API routes and UI client forms.

## Testing
Backend tests:
- Prices: create + invalid payloads.
- Images: add/update/remove + invalid payloads.
- Categories: replace + invalid payloads.

Frontend tests:
- Sections render and submit flows succeed.
- Image list add/remove.
- Category multi-select updates.

## Assumptions
- Single active price per offering.
- Categories are flat list in UI (no hierarchy).
- Local upload is acceptable for v1.

