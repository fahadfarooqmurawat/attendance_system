# Contributing

## Local Setup

Read `docs/development/getting-started.md` before starting. The recommended daily workflow
is PostgreSQL in Docker with the apps running locally:

```bash
pnpm install
cp .env.example .env
pnpm docker:db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Use `pnpm docker:up` only when you intentionally want the whole stack running in Docker.
Do not run `pnpm dev` at the same time as the full Docker stack unless you have changed
ports or stopped the app containers.

## Before Opening A Pull Request

Run the same checks CI runs:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For firmware changes, also run:

```bash
pnpm firmware:build
```

## Database Changes

- Change `packages/db/prisma/schema.prisma`.
- Keep datasource URLs in `packages/db/prisma.config.ts`, not in `schema.prisma`.
- Create and commit a migration under `packages/db/prisma/migrations`.
- Use `pnpm db:migrate` locally.
- Use `pnpm db:migrate:deploy` on production.
- Do not edit a migration after it has been applied to a shared environment.

## Environment And Secrets

- Use the root `.env` for shared infrastructure and tooling values.
- Keep app-owned values, such as ports and service-specific secrets, in that app's `.env`.
- Do not duplicate shared values such as `DATABASE_URL` in app env files.
- Do not create package-level `.env` files.
- Runtime packages receive configuration from their importing app. Prisma CLI configuration
  and the seed script are executable tooling and may load the root `.env`.
- Do not commit `.env`, `.env.production`, firmware `config.h`, database dumps, or real keys.
- The bundled seed is development-only and must not be run in production.

## Service Boundaries

- `apps/device-gateway` is only for device traffic.
- `apps/dashboard` owns human-facing workflows.
- `apps/worker` owns background work.
- Shared code belongs in `packages/*` only when at least two services need it.
