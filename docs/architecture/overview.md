# Architecture Overview

The system is split by audience and responsibility.

```text
ESP32 + scanner
  <-> apps/device-gateway
        <-> PostgreSQL

Employees, managers, HR
  <-> apps/dashboard
        <-> PostgreSQL

apps/worker
  <-> PostgreSQL
```

## Applications

- `firmware` runs on ESP32 and talks to the fingerprint scanner.
- `device-gateway` is the only service ESP32 devices call.
- `dashboard` is the human-facing full-stack Next.js application.
- `worker` handles time-based and background work.

## Principles

- Fingerprint templates stay inside the scanner.
- Raw scan events are immutable.
- The server timestamp is the source of truth because the ESP32 has no RTC.
- Attendance check-in and checkout state is derived from ordered scan events.
- Manual corrections are approved records layered on top of raw scans.
