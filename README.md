# Attendance System

Monorepo scaffold for an ESP32 fingerprint attendance system.

## Projects

- `apps/firmware`: ESP32 C++ firmware using PlatformIO.
- `apps/device-gateway`: Express service used only by ESP32 devices.
- `apps/dashboard`: Next.js human-facing dashboard.
- `apps/worker`: background jobs, notifications, reports, and cleanup.
- `packages/db`: Prisma schema, database client, migrations, and seed data.
- `packages/shared`: shared schemas and types.
- `packages/attendance-core`: attendance derivation rules.
- `packages/config`: shared configuration placeholders.

## First Run For Local Development

See `docs/development/getting-started.md` for the full development guide.

```bash
pnpm install
cp .env.example .env
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/device-gateway/.env.example apps/device-gateway/.env
pnpm docker:db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

This starts only PostgreSQL in Docker and runs the TypeScript apps locally with watch mode.
The root `.env` contains shared infrastructure and tooling values. Each app-level `.env`
contains only settings owned by that app, such as its port.

## Run The Whole Stack In Docker

```bash
pnpm docker:up
pnpm db:migrate
pnpm db:seed
```

When using `pnpm docker:up`, do not also run `pnpm dev` unless you stop the app containers
or change ports. The Docker stack already starts `dashboard`, `device-gateway`, and
`worker`.

## Useful Commands

The full command reference is in `docs/development/getting-started.md`.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
pnpm db:studio
pnpm docker:db:up
pnpm docker:logs
pnpm docker:prod:config
pnpm firmware:build
pnpm firmware:test
pnpm firmware:upload
pnpm firmware:monitor
pnpm firmware:clean
```

`pnpm docker:up` starts all Docker services in detached mode. Use `pnpm docker:logs` to
watch container output, and `pnpm docker:down` to stop the local stack.

## Deployment

The production target is Docker Compose on an Ubuntu VPS behind nginx.

- Use `.env.production.example` as the template for `.env.production`.
- Validate production Compose with `pnpm docker:prod:config`.
- Apply database migrations with `pnpm db:migrate:deploy`.
- Use `infra/nginx/attendance.conf` as the nginx starting point.

See `docs/deployment/vps-nginx.md` for the full runbook.

## Development Docs

- `docs/development/getting-started.md`: local setup, workflows, Prisma, firmware, and troubleshooting.
- `docs/development/onboarding-checklist.md`: checklist for new engineers.
- `CONTRIBUTING.md`: pull request and contribution expectations.
- `SECURITY.md`: secrets, device request security, and production safety rules.

## Service Boundaries

`device-gateway` is hardware-facing. It accepts heartbeats, scan events, command polling,
command acknowledgements, and enrollment results.

`dashboard` is human-facing. It owns employee management, attendance views, manual
attendance requests, approvals, notification inboxes, and reports.

`worker` reacts to durable records and time-based rules. It handles reminders, anomaly
detection, report generation, email delivery, and maintenance tasks.
