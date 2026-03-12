# Products Tests — Design Spec

Date: 2026-03-12

## Summary
Add automated tests for the products module using Vitest + Testing Library. Backend tests will run against a SQLite test database using `schema.sqlite.prisma`. Frontend tests will validate `ProductsClient` behaviors with mocked network calls. Add `pnpm test` scripts for standard execution.

## Goals
- Validate API behavior and Zod validation for products.
- Validate UI flows for create/edit/delete and error states.
- Establish a repeatable test setup for future modules.

## Non-goals
- Full end-to-end tests with Playwright.
- Comprehensive coverage for all modules beyond products.

## Architecture
### Test Stack
- `vitest` for test runner.
- `@testing-library/react` + `@testing-library/user-event` for UI tests.
- SQLite test DB using `prisma/schema.sqlite.prisma`.

### Scripts
Add:
- `pnpm test` → runs vitest in run mode.
- `pnpm test:watch` → vitest watch.

## Backend Test Coverage
Target API routes:
- `POST /api/v1/admin/products`
  - Valid create → 201 + correct payload
  - Invalid payload → 422 + field errors
  - Duplicate handle → 422
- `PATCH /api/v1/admin/products/{id}`
  - Partial update → 200 + updated payload
  - Invalid payload → 422
  - Not found → 404
- `DELETE /api/v1/admin/products/{id}`
  - Soft delete → 204
  - Subsequent GET → 404

### Data Setup
- Use a test SQLite DB file with minimal fixtures:
  - Tenant + Catalog for the tenant
  - Clean DB between tests

## Frontend Test Coverage
Component tests for `ProductsClient`:
- Empty state renders when no products.
- Table rows render with seeded products.
- Create flow: open dialog → submit → row appears.
- Edit flow: open dialog → update field → row updates.
- Delete flow: confirm dialog → row removed.
- Client validation: Zod errors render inline.

Mock network calls using `fetch` stubs (or MSW if preferred later).

## Error Handling
- Assertions ensure validation errors map to the expected UI field errors.
- API errors are surfaced as the generic error banner.

## Acceptance Scenarios
1. All product API tests pass locally.
2. UI tests cover main flows without flaky async timing.
3. `pnpm test` runs cleanly in CI.

## Assumptions
- SQLite test DB is acceptable for backend tests.
- Vitest is the preferred test runner.

