# Engineer Onboarding Checklist

Use this checklist when a new engineer joins the project.

## Access

- [ ] Repository access confirmed.
- [ ] Docker installed and running.
- [ ] Node.js 24+ installed.
- [ ] Corepack enabled.
- [ ] pnpm available.
- [ ] VS Code recommended extensions installed.
- [ ] PlatformIO installed if working on firmware.

## First Local Run

- [ ] Read `README.md`.
- [ ] Read `docs/development/getting-started.md`.
- [ ] Create `.env` from `.env.example`.
- [ ] Run `pnpm install`.
- [ ] Run `pnpm docker:db:up`.
- [ ] Run `pnpm db:migrate`.
- [ ] Run `pnpm db:seed`.
- [ ] Run `pnpm dev`.
- [ ] Open dashboard at `http://localhost:3000`.
- [ ] Open gateway health check at `http://localhost:4001/healthz`.

## Verification

- [ ] Run `pnpm lint`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm firmware:build` if working on firmware.

## Project Context

- [ ] Read `docs/architecture/overview.md`.
- [ ] Read `docs/architecture/data-model.md`.
- [ ] Read `docs/architecture/device-protocol.md`.
- [ ] Read `CONTRIBUTING.md`.
- [ ] Read `SECURITY.md`.

## Before First Pull Request

- [ ] Confirm service boundary for the change.
- [ ] Add or update tests for changed behavior.
- [ ] Include Prisma migration if schema changed.
- [ ] Document any new environment variables.
- [ ] Confirm no real secrets are committed.
