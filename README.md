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

## First Run

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Useful Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
pnpm db:studio
pnpm docker:prod:config
```

## Deployment

The production target is Docker Compose on an Ubuntu VPS behind nginx.

- Use `.env.production.example` as the template for `.env.production`.
- Validate production Compose with `pnpm docker:prod:config`.
- Apply database migrations with `pnpm db:migrate:deploy`.
- Use `infra/nginx/attendance.conf` as the nginx starting point.

See `docs/deployment/vps-nginx.md` for the full runbook.

## Service Boundaries

`device-gateway` is hardware-facing. It accepts heartbeats, scan events, command polling,
command acknowledgements, and enrollment results.

`dashboard` is human-facing. It owns employee management, attendance views, manual
attendance requests, approvals, notification inboxes, and reports.

`worker` reacts to durable records and time-based rules. It handles reminders, anomaly
detection, report generation, email delivery, and maintenance tasks.
