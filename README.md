## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Prisma setup

### Validate the database
```
pnpm prisma validate
pnpm prisma migrate dev --name init-primas
psql -U postgres -h localhost -p 5432 -d sellerbotv1
```

### Seed the database

```
pnpm prisma db execute --schema prisma/schema.prisma --file databases/seed_primas.sql
or
pnpm prisma:seed
```
