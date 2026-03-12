# Products Zod Validation — Design Spec

Date: 2026-03-12

## Summary
Introduce Zod validation for the products module and share schemas across backend and frontend. Replace manual validation with Zod parsing in API routes and validate form payloads on the client using the same schemas. Use shared schemas under `lib/schemas/products.ts` and keep error handling consistent with the current API envelope.

## Goals
- Centralize product validation logic with Zod.
- Enforce consistent rules across API and UI.
- Improve type safety via Zod inferred types.

## Non-goals
- Validate all other modules beyond products (this is a starting point).
- Change DB models or the product DTO mapping logic.

## Architecture
### Shared Schemas
Create `lib/schemas/products.ts` containing:
- `productStatusSchema`: enum for `ACTIVE | INACTIVE`.
- `productBaseSchema`: common fields (title, description, status, handle, coverImageUrl, currencyCode, price, sku).
- `productCreateSchema`: required fields for create.
- `productUpdateSchema`: partial schema for patch.
- `productDtoSchema`: response type validation (optional guard).

### Coercion Rules
- `price` uses Zod preprocessing/coercion to accept string inputs (e.g., "12.50").
- Enforce `price >= 0`.

## API Integration
- `POST /api/v1/admin/products` uses `productCreateSchema`.
- `PATCH /api/v1/admin/products/{id}` uses `productUpdateSchema`.
- Replace manual validation with Zod parsing.
- Map `ZodError` into the existing error envelope:

```json
{
  "error": "ValidationError",
  "message": "Request validation failed.",
  "details": {
    "errors": [
      { "field": "title", "message": "Title is required." }
    ]
  }
}
```

## Frontend Integration
- Validate client form state using the shared Zod schemas before submit.
- Use Zod inferred types in `products-client.tsx` for payloads and forms.
- Keep API error handling as fallback.

## Error Handling
- Validation failures return `422` in API.
- Client renders field errors inline (existing UI pattern).

## Testing / Acceptance Scenarios
1. Invalid payloads rejected in API with `422` and field errors.
2. Client-side validation blocks submit and shows inline messages.
3. Valid payloads pass without regression.

## Assumptions
- Zod will be added as a dependency.
- Products validation is the first module; others remain unchanged.

