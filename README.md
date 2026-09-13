# serverpulse

Migrated from Prisma Next (v8 RC - `@prisma/orm-postgres` / `prisma-next`) to **Prisma ORM v7** (classic).

## Stack
- Next.js 16, React 19, TypeScript
- Prisma ORM 7 with PostgreSQL (`prisma` + `@prisma/client` + `@prisma/adapter-pg`)
- better-auth with `prismaAdapter`

## Prisma Setup (v7)

- **Schema**: `prisma/schema.prisma` - contains `generator client` (`provider = "prisma-client"`, `output = "../generated/prisma"`) and `datasource db` (`provider = "postgresql"`). Database URL is configured in `prisma.config.ts`, not in the schema.
- **Config**: `prisma.config.ts` at project root - defines `schema`, `migrations.path`, and `datasource.url` via `env("DATABASE_URL")`.
- **Client**: `prisma/db.ts` - creates a `PrismaClient` with `PrismaPg` driver adapter (`@prisma/adapter-pg`). Exported as both `db` and `prisma` for compatibility. Uses `globalThis` singleton to avoid hot-reload duplication in Next.js dev.

```
import { db } from "@/prisma/db";

// Example queries (v7 classic API)
await db.server.findUnique({ where: { id } });
await db.server.update({ where: { id }, data: { status: "ACTIVE" } });
await db.user.findMany();
```

## Scripts

- `pnpm run dev` - start local dev server
- `pnpm run build` - production build (runs `prisma generate` via `postinstall` if configured)
- `pnpm run start` - run production server
- `pnpm run db:generate` - generate Prisma Client (`prisma generate`)
- `pnpm run db:migrate` - create & apply migrations (`prisma migrate dev`)
- `pnpm run db:studio` - open Prisma Studio

## Workflow

1. Edit `prisma/schema.prisma` to add/change models.
2. Run `pnpm run db:generate` to regenerate client to `generated/prisma`.
3. Run `pnpm run db:migrate` to create a migration (creates files under `prisma/migrations/`).
4. Query via `db` - IDE autocompletes models.

## Migration from Prisma Next

Removed:
- `prisma-next.config.ts` -> replaced by `prisma.config.ts`
- `prisma/contract.json` / `prisma/contract.d.ts` / `prisma-next.md`
- `migrations/snapshots/**` / `migrations/app/**` (Prisma Next snapshots) -> replaced by `prisma/migrations/`
- `@prisma/orm-postgres` / `prisma-next` / `@prisma/language-server` RC dependencies

Added:
- `prisma` (^7.10.0), `@prisma/client` (^7.10.0), `@prisma/adapter-pg` (^7.10.0), `pg`
- `prisma.config.ts` with `defineConfig` from `prisma/config`
- `generated/prisma` output (gitignored)

### API Changes

```ts
// Before (Prisma Next v8)
await db.orm.public.Server.where({ id }).first();
await db.orm.public.Server.where({ id }).update({ status: "ACTIVE" });

// After (Prisma v7)
await db.server.findUnique({ where: { id } });
await db.server.update({ where: { id }, data: { status: "ACTIVE" } });
```

`@UpdatedAt` -> `@updatedAt`, `@@map("server")` added for consistency.

## Requirements

- PostgreSQL 17+ (same as before)
- Node.js 20+ (Prisma 7 supports Node 20, 22, 24)
