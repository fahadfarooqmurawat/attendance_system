# Contributing

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

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
pio run -d apps/firmware
```

## Database Changes

- Change `packages/db/prisma/schema.prisma`.
- Create and commit a migration under `packages/db/prisma/migrations`.
- Use `pnpm db:migrate` locally.
- Use `pnpm db:migrate:deploy` on production.
- Do not edit a migration after it has been applied to a shared environment.

## Environment And Secrets

- Commit only `*.example` env files.
- Do not commit `.env`, `.env.production`, firmware `config.h`, database dumps, or real keys.
- The bundled seed is development-only and must not be run in production.

## Service Boundaries

- `apps/device-gateway` is only for device traffic.
- `apps/dashboard` owns human-facing workflows.
- `apps/worker` owns background work.
- Shared code belongs in `packages/*` only when at least two services need it.
