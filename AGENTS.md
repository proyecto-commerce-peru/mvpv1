# AGENTS GUIDE FOR SELLER-BOT-V1
Purpose: give agents quick, opinionated instructions to work safely in this repo.
Scope: Next.js 16 app directory with Tailwind v4, Prisma schema, shadcn/radix components.
Defaults: prefer pnpm (pnpm-lock.yaml present); Node 20+ (Next.js 16 needs >=18.18).
No Cursor or Copilot rule files detected as of this version; follow guidance here instead.
Repo root: /home/cristhianjhl/crissis16/code/seller-bot-v1.

## Commands (dev/build/lint/test)
- Install: `pnpm install` (respects pnpm-lock.yaml).
- Dev server: `pnpm dev` (Next app router, listens on 3000 by default).
- Build: `pnpm build` (Next production build).
- Start (after build): `pnpm start`.
- Lint all: `pnpm lint` (uses eslint-config-next core-web-vitals + typescript); CI expectation.
- Format: no formatter script; prefer `pnpm lint --fix` for style issues.
- Prisma Postgres migrate dev: `pnpm prisma migrate dev --name <name>` (schema.prisma; requires DATABASE_URL).
- Prisma SQLite migrate dev (alt schema): `pnpm prisma:sqlite:migrate` (uses prisma/schema.sqlite.prisma, DATABASE_URL=file:./primas.db).
- Prisma seed (Postgres): `pnpm prisma:seed` (runs prisma db execute with databases/seed_primas.sql).
- Validate Prisma: `pnpm prisma validate` (per README).
- Single test: no automated test suite/script defined; if you add tests prefer vitest/jest via `pnpm test -- <pattern>` and document the pattern used.
- Package scripts are minimal; avoid adding npm/yarn lockfiles; stay on pnpm.

## Environment & secrets
- .env.example shows `DATABASE_URL`; copy to `.env` locally; never commit real secrets (.gitignore already blocks env files).
- Default database is Postgres (schema.prisma); SQLite alternative exists for local tinkering (schema.sqlite.prisma).
- Keep DATABASE_URL aligned with the schema you run (Postgres vs SQLite); prisma commands should match the chosen schema.
- Fonts are fetched via next/font; no extra env needed for that.
- When adding new env vars, update `.env.example` and note required services here.

## Project layout
- `app/` uses Next.js App Router: `layout.tsx`, `page.tsx`, `globals.css`.
- `components/` includes ui primitives (currently Button) generated via shadcn with radix-nova style.
- `lib/` holds utilities (`utils.ts` with cn helper).
- `prisma/` contains Postgres schema plus migrations and SQLite variant schema.
- `databases/` holds SQL seeds (`seed_primas.sql`, etc.).
- `eslint.config.mjs`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` configure tooling.
- `components.json` drives shadcn generator (aliases for @/components, @/lib, @/hooks).
- Public assets live under `public/` (svgs, favicon).

## Imports & module resolution
- Use path alias `@/*` (tsconfig). Example: `import { cn } from "@/lib/utils"`.
- Group imports as: framework/libs (React/Next), third-party, absolute project aliases, then relative paths.
- Use named imports where possible; default imports for React components/helpers is acceptable when API dictates.
- Keep import side effects (`./globals.css`) at top of layout/pages only.
- Avoid circular deps; keep shared helpers in `lib/` and UI in `components/`.

## TypeScript & types
- TS strict mode is enabled; fix type errors instead of casting away.
- Prefer explicit return types for exported functions/components; allow inference for locals.
- Use `Readonly<>` / `as const` for literal configs; lean on discriminated unions over enums when possible.
- Prefer `type` aliases over `interface` unless extending 3rd-party shapes.
- Avoid `any`; use `unknown` + narrowing when necessary.
- React components should type props via inline object or dedicated `type Props` near the component.
- Use `React.ReactNode` for renderable children, not `any`.
- For variant props, follow existing CVA pattern with `VariantProps<typeof buttonVariants>`.

## Styling & Tailwind
- Tailwind v4 via `@import "tailwindcss"` in `app/globals.css`; tokens defined with `@theme inline` and CSS variables.
- Respect semantic tokens: `--background`, `--foreground`, etc.; dark theme supported via `.dark` class and `@custom-variant`.
- Use `cn` helper for conditional class merging to avoid duplicates; prefer Tailwind utilities over custom CSS where feasible.
- Radius variables exist (`--radius`, --radius-*); align new components to these scales.
- Animations available through `tw-animate-css`; prefer existing utility classes before custom keyframes.
- Keep global styles minimal; component-level styles via className.
- shadcn style preset is radix-nova; match padding/radius/typography patterns seen in Button.

## React/Next patterns
- App Router: pages live under `app/`; use server components by default; add `"use client"` only when stateful/hooks.
- Root layout already sets fonts and `antialiased`; avoid duplicating font imports in pages/components.
- Use `next/image` for images (as in `app/page.tsx`); provide `alt` and dimensions.
- Metadata goes through exported `metadata` object in layout/page when needed.
- Avoid client navigation APIs unless necessary; prefer `<Link>` over `<a>` for internal routes.
- Keep server actions typed and side-effect aware; validate inputs on server boundaries.

## Components & UI
- Existing Button uses CVA variants (`variant`, `size`, `asChild` via Radix Slot); extend via the same pattern.
- New UI primitives belong under `components/ui`; feature-specific composites can live under `components/` or app routes.
- Preserve accessibility: focus rings already defined; ensure `aria-*` props for interactive elements.
- Keep SVG icons size-4 default; prefer `lucide-react` icons consistent with current setup.
- When wrapping Radix components, expose `asChild` to allow composition with other elements/links.

## Naming conventions
- Files: kebab-case for routes (`app/some-page`), camelCase for helpers (`utils.ts`), PascalCase for components in `components/`.
- Variables/functions: camelCase; components PascalCase; constants UPPER_SNAKE only when truly constant.
- Enums discouraged; use union string literals or `as const` objects.
- Prisma models already snake_case mapped to db tables; keep schema names consistent and avoid renaming without migration plan.

## Error handling & logging
- Use early returns and guard clauses for invalid inputs; avoid silent failures.
- Prefer throwing `Error` with actionable messages on server logic; in UI, surface user-friendly text while logging details.
- For async operations, use `try/catch` at boundaries (API routes/server actions); avoid swallowing errors.
- When adding fetch logic, handle loading/error states explicitly in client components.
- Prisma operations should validate tenant context to prevent cross-tenant leaks (schema uses tenant_id extensively).

## Data & Prisma practices
- Keep Postgres schema as source of truth; SQLite schema is alternative for local dev—avoid diverging structures without reason.
- Run `pnpm prisma migrate dev --name <name>` after schema changes; commit migration files.
- Regenerate client via `pnpm prisma generate` if you add the script; currently implicit via migrate/dev.
- Seed data using `pnpm prisma:seed` or `pnpm prisma db execute --schema prisma/schema.prisma --file databases/seed_primas.sql`.
- For large schema edits, add descriptive migration names and update seeds accordingly.
- Respect UUID primary keys; do not switch to integers unless coordinated.

## Formatting & linting
- ESLint config: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`; lint ignores only build artifacts and next-env.d.ts.
- Use double quotes in TS/TSX to match current files; semicolons optional (mixed in repo) but keep consistency per file.
- Keep line length reasonable (<120 chars); break JSX props across lines as in `app/page.tsx`.
- Run `pnpm lint` before commits; fix warnings instead of disabling rules unless justified.
- Avoid introducing Prettier unless team agrees; follow existing ESLint formatting.

## Accessibility & UX
- Ensure interactive elements are reachable via keyboard; preserve focus outlines defined in Button styles.
- Provide `aria-label`/`aria-describedby` on inputs when labels are not visible.
- Maintain color contrast; dark mode tokens already defined—test both themes if you touch globals.
- Use semantic HTML structure; headings in order; avoid div soup.

## Performance guidance
- Prefer server components for data-heavy views; mark client components only when hooks/event handlers needed.
- Use `Image` for assets to get optimization; set `priority` only for above-the-fold imagery.
- Avoid unnecessary re-renders; memoize expensive derived data and pass stable callbacks/values when using client components.
- Defer non-critical scripts; leverage Next dynamic import for big client-only deps.

## Git & workflow
- Keep worktree clean; do not revert user changes you did not make.
- Commit only when explicitly asked; otherwise leave staged changes to the user.
- Avoid adding `.env` or secrets; respect `.gitignore`.
- Maintain pnpm-lock.yaml consistency; do not introduce yarn.lock/package-lock.

## Testing guidance (current state: none)
- No unit/e2e test setup present; if adding, prefer vitest or playwright with pnpm scripts.
- Suggested pattern: `pnpm test -- <pattern>` for single test; document in this file when added.
- For lint-only validation, `pnpm lint` is the gate today.

## Adding dependencies
- Use `pnpm add <pkg>` / `pnpm add -D <pkg>`; keep versions consistent with React 19/Next 16.
- For UI libs, ensure they play nicely with RSC/client boundaries; tree-shake where possible.
- Avoid heavy polyfills; Next includes fetch/URL by default.

## Deployment notes
- Next build targets default output; no custom server config in `next.config.ts` yet.
- Ensure DATABASE_URL points to production Postgres when building server-rendered routes.
- If enabling experimental features, document them here and in next.config.ts comments.

## Troubleshooting
- Lint errors about missing React import are handled by Next; do not add `import React` manually.
- Tailwind class conflicts: use `cn` to merge instead of string concatenation; check for duplicate `focus-visible` styles.
- Prisma migration failures: verify DATABASE_URL, drop/recreate local DB if needed, rerun migrate dev.

## How to extend this doc
- Keep length ~150 lines; append new sections with concise bullets.
- Add Cursor/Copilot instructions here if such files appear later.
- Update commands/types/style rules when tooling changes.
