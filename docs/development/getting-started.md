# Development Guide

This guide is the first stop for engineers working on the attendance system.

The repo is a pnpm monorepo with:

- `apps/dashboard`: Next.js dashboard for employees, managers, HR, and owners.
- `apps/device-gateway`: Express API used by ESP32 devices only.
- `apps/worker`: background jobs.
- `apps/firmware`: ESP32 firmware using PlatformIO.
- `packages/db`: Prisma schema, migrations, seed, and database client.
- `packages/shared`: shared schemas and types.
- `packages/attendance-core`: attendance rules.

## Prerequisites

Install these before starting:

- Node.js 24 or newer.
- pnpm 11.10.0 through Corepack.
- Docker Desktop or Docker Engine with the Compose plugin.
- Git.
- VS Code is recommended.

For firmware work, also install:

- PlatformIO CLI or the VS Code PlatformIO extension.
- Microsoft C/C++ VS Code extension.

Recommended VS Code extensions are listed in `.vscode/extensions.json`.

## First-Time Setup

From the repo root:

```bash
pnpm install
cp .env.example .env
pnpm docker:db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

This is the recommended development workflow. It starts only PostgreSQL in Docker and runs
the TypeScript apps locally with watch mode.

Default local URLs:

- Dashboard: `http://localhost:3000`
- Device gateway health check: `http://localhost:4001/healthz`
- PostgreSQL: `localhost:5432`

## Development Workflows

### Recommended: Database In Docker, Apps Local

Use this for daily feature development:

```bash
pnpm docker:db:up
pnpm dev
```

Why this workflow:

- Next.js, Express, and worker processes restart faster.
- Logs stay in your terminal.
- TypeScript watch mode is easier to debug.
- Only Postgres runs in Docker.

### Full Stack In Docker

Use this when checking container behavior:

```bash
pnpm docker:up
pnpm db:migrate
pnpm db:seed
pnpm docker:logs
```

Do not run `pnpm dev` while the full Docker stack is up unless you stop the app containers
or change ports. The Docker stack already starts `dashboard`, `device-gateway`, and
`worker`.

Stop Docker services with:

```bash
pnpm docker:down
```

## Common Commands

| Command                   | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                | Run all TypeScript apps locally in watch mode.                |
| `pnpm dev:dashboard`      | Run only the dashboard.                                       |
| `pnpm dev:device-gateway` | Run only the device gateway.                                  |
| `pnpm dev:worker`         | Run only the worker.                                          |
| `pnpm docker:db:up`       | Start only PostgreSQL in Docker.                              |
| `pnpm docker:up`          | Start PostgreSQL and all app services in Docker.              |
| `pnpm docker:logs`        | Follow Docker logs.                                           |
| `pnpm docker:down`        | Stop the local Docker stack.                                  |
| `pnpm db:migrate`         | Create/apply local Prisma migrations.                         |
| `pnpm db:migrate:deploy`  | Apply committed migrations in production/shared environments. |
| `pnpm db:seed`            | Seed development-only data.                                   |
| `pnpm db:studio`          | Open Prisma Studio.                                           |
| `pnpm lint`               | Run ESLint through Turbo.                                     |
| `pnpm typecheck`          | Run TypeScript checks through Turbo.                          |
| `pnpm test`               | Run Vitest through Turbo.                                     |
| `pnpm build`              | Build all packages/apps.                                      |
| `pnpm format`             | Format the repo with Prettier.                                |
| `pnpm firmware:build`     | Build the ESP32 firmware.                                     |
| `pnpm firmware:test`      | Run firmware tests on a connected ESP32.                      |
| `pnpm firmware:upload`    | Build and upload firmware to a connected ESP32.               |
| `pnpm firmware:monitor`   | Monitor serial output from a connected ESP32.                 |
| `pnpm firmware:clean`     | Remove PlatformIO firmware build artifacts.                   |

Before opening a pull request, run:

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

## Environment Files

Use `.env.example` for local development:

```bash
cp .env.example .env
```

Rules:

- Commit only example env files.
- Never commit `.env`, `.env.production`, firmware `config.h`, database dumps, or real keys.
- `.env.production.example` is only a template for VPS deployment.
- The bundled seed is development-only and must not be run in production.

Important local env values:

- `DATABASE_URL`: used by Prisma and app services.
- `SESSION_SECRET`: signs dashboard sessions.
- `PASSWORD_PEPPER`: reserved for password hashing.
- `DEV_DEVICE_SECRET`: secret for the seeded development ESP32 device.
- `DEVICE_SIGNATURE_MAX_AGE_SECONDS`: maximum age for signed device requests.

## Database And Prisma

The Prisma schema lives at:

```text
packages/db/prisma/schema.prisma
```

Prisma configuration lives at:

```text
packages/db/prisma.config.ts
```

This repo uses Prisma 7 style configuration:

- `schema.prisma` declares the provider.
- `prisma.config.ts` supplies the datasource URL for Prisma CLI commands.
- Runtime Prisma clients use the PostgreSQL driver adapter in `packages/db/src/client.ts`.

When changing the database:

1. Edit `packages/db/prisma/schema.prisma`.
2. Create a migration:

   ```bash
   pnpm db:migrate
   ```

3. Review and commit the generated migration under `packages/db/prisma/migrations`.
4. Regenerate the client if needed:

   ```bash
   pnpm db:generate
   ```

5. Run checks:

   ```bash
   pnpm typecheck
   pnpm test
   ```

Do not edit a migration after it has been applied to a shared environment. Create a new
migration instead.

## Device Gateway Development

Device endpoints live under:

```text
apps/device-gateway/src/routes/device-routes.ts
```

Device requests must include:

- `x-device-id`
- `x-device-timestamp`
- `x-device-signature`

The HMAC signing contract is documented in:

```text
docs/architecture/device-protocol.md
```

The development seed creates:

- Device id: `esp32-dev-001`
- Device secret: `dev-device-secret`

Only the SHA-256 hash of the secret is stored in the database.

## Dashboard Development

Dashboard code lives under:

```text
apps/dashboard/src
```

The current session-token helper is in:

```text
apps/dashboard/src/lib/session-token.ts
apps/dashboard/src/lib/session.ts
```

The next major dashboard work should build on this:

- login/logout
- password hashing
- protected routes
- employee management
- device provisioning
- attendance views
- manual correction and approval workflows

## Worker Development

Worker code lives under:

```text
apps/worker/src
```

Before adding real jobs, define:

- whether the job can run more than once at the same time
- retry behavior
- failure logging
- idempotency rules
- whether a database lock is required

Use `JobRun` for durable job audit records.

## Firmware Development

Firmware code lives under:

```text
apps/firmware
```

Create local firmware config:

```bash
cp apps/firmware/include/config.example.h apps/firmware/include/config.h
```

`config.h` is ignored by Git because it can contain Wi-Fi and device secrets.

Build firmware:

```bash
pnpm firmware:build
```

Run firmware tests on a connected ESP32:

```bash
pnpm firmware:test
```

Upload firmware to a connected ESP32:

```bash
pnpm firmware:upload
```

Monitor a connected device:

```bash
pnpm firmware:monitor
```

Remove PlatformIO build artifacts:

```bash
pnpm firmware:clean
```

If VS Code shows `cannot open source file "Arduino.h"`:

1. Install the recommended PlatformIO and C/C++ extensions.
2. Run:

   ```bash
   pnpm firmware:build
   ```

3. In VS Code, run `PlatformIO: Rebuild IntelliSense Index`.
4. Make sure `.vscode/settings.json` includes PlatformIO as the C/C++ configuration provider.

The ESP32 Arduino framework headers are downloaded by PlatformIO and are not committed to
this repo.

## Service Boundaries

Keep changes inside the right service:

- `device-gateway` is for hardware/device traffic only.
- `dashboard` owns human workflows.
- `worker` owns background jobs.
- `packages/shared` holds shared schemas and types.
- `packages/attendance-core` holds attendance rules.
- `packages/db` owns Prisma schema, migrations, seed data, and DB client setup.

Add code to a shared package only when at least two apps need it.

## Troubleshooting

### `docker:up` does not return

`pnpm docker:up` should run in detached mode. If a raw `docker compose up` command is used,
it will stay open and stream logs. Use another terminal or stop it with `Ctrl+C`.

### Port already in use

You may be running both workflows at once. Stop Docker services:

```bash
pnpm docker:down
```

Then choose either `pnpm docker:db:up` plus `pnpm dev`, or `pnpm docker:up`.

### Docker daemon is not running

Start Docker Desktop or the Docker service, then retry the command.

### Prisma says datasource `url` is not supported

The repo uses Prisma 7 style config. The datasource URL belongs in
`packages/db/prisma.config.ts`, not in `schema.prisma`. Reload VS Code if the Prisma
extension is showing stale errors.

### Prisma says `DATABASE_URL` is required

Create `.env` from the example file:

```bash
cp .env.example .env
```

Then rerun the command from the repo root.

### Device requests get `invalid_signature`

Check that the device signed the exact canonical string from
`docs/architecture/device-protocol.md`. The raw request body, path, method, timestamp, and
secret must all match.

### `Arduino.h` is missing

Run the firmware build once so PlatformIO downloads the ESP32 framework:

```bash
pnpm firmware:build
```

Then rebuild the PlatformIO IntelliSense index in VS Code.

## Useful Reading Order

New engineers should read these in order:

1. `README.md`
2. `docs/development/getting-started.md`
3. `docs/architecture/overview.md`
4. `docs/architecture/data-model.md`
5. `docs/architecture/device-protocol.md`
6. `CONTRIBUTING.md`
7. `SECURITY.md`
