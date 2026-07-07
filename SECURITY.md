# Security Policy

## Secrets

Never commit real secrets. This includes:

- `.env` and `.env.production`
- Firmware `config.h`
- Device secrets
- Database backups
- SMTP credentials

Use `.env.example`, `.env.production.example`, and `apps/firmware/include/config.example.h`
for documented placeholders only.

## Device Requests

Device requests must include:

- `x-device-id`
- `x-device-timestamp`
- `x-device-signature`

The gateway rejects missing credentials, inactive devices, stale timestamps, and invalid
signatures. Signature details are documented in `docs/architecture/device-protocol.md`.

## Production Deployment

- Keep Postgres off the public internet.
- Bind app containers to localhost when nginx runs on the host.
- Use TLS for dashboard and device traffic.
- Run `pnpm db:migrate:deploy`; do not use development migrations or seeds in production.

## Reporting Issues

Open a private issue or contact the repository owner directly for suspected credential
leaks, authentication bypasses, or production data exposure.
