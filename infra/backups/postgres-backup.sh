#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:=./backups}"

mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/attendance-$timestamp.sql.gz"
