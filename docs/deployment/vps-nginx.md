# VPS Deployment With Nginx

Target shape:

```text
internet
  -> nginx on Ubuntu host
    -> 127.0.0.1:3000 dashboard container
    -> 127.0.0.1:4001 device-gateway container
postgres stays inside Docker / localhost only
```

## 1. Prepare The Server

- Install Docker Engine and the Docker Compose plugin.
- Install nginx.
- Point DNS records to the VPS:
  - `attendance.example.com`
  - `devices.attendance.example.com`
- Allow only SSH, HTTP, and HTTPS through the VPS firewall.
- Do not expose Postgres to the public internet.

## 2. Create Production Environment

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and replace every `replace-with-*` value.

Use long random values for:

- `POSTGRES_PASSWORD`
- `SESSION_SECRET`
- `PASSWORD_PEPPER`
- SMTP credentials

Keep these binds unless you intentionally move nginx into Docker:

```dotenv
DASHBOARD_BIND=127.0.0.1:3000
DEVICE_GATEWAY_BIND=127.0.0.1:4001
POSTGRES_BIND=127.0.0.1:5432
```

## 3. Validate Compose Config

```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml config
```

## 4. Build And Start Services

```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## 5. Run Database Migrations

Run migrations after the database is healthy and before sending traffic to the app:

```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml exec dashboard pnpm db:migrate:deploy
```

Do not run `pnpm db:seed` in production. The bundled seed is development-only.

## 6. Configure Nginx

Copy the sample config:

```bash
sudo cp infra/nginx/attendance.conf /etc/nginx/sites-available/attendance.conf
sudo ln -s /etc/nginx/sites-available/attendance.conf /etc/nginx/sites-enabled/attendance.conf
```

Replace `attendance.example.com` and `devices.attendance.example.com` with real domains.
Update the `ssl_certificate` paths to match the certificates issued on the server.

Validate and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Device Provisioning

Every physical device must have:

- A unique `Device.id`.
- A unique random device secret.
- `Device.apiKeyHash` set to the SHA-256 hex digest of that secret.

The device signs requests as documented in `docs/architecture/device-protocol.md`.

## 8. Backups

The repo includes `infra/backups/postgres-backup.sh`. Run it from an environment that has
`pg_dump`, `gzip`, `DATABASE_URL`, and write access to `BACKUP_DIR`.

Example cron entry:

```cron
15 2 * * * cd /opt/attendance-system && DATABASE_URL='postgresql://...' BACKUP_DIR=/var/backups/attendance ./infra/backups/postgres-backup.sh
```

Test restore procedures before relying on backups.
