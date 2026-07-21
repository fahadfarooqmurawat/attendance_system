# Firmware

ESP32 firmware scaffold for the fingerprint attendance device.

## Local Setup

Copy config

```bash
cp include/config.example.h include/config.h
```

Build, test, upload, and monitor locally

```bash
pio run
pio test -e native
pio run -t upload
pio device monitor
```

Build, test, upload, and monitor from root directory

```bash
pnpm firmware:build
pnpm firmware:test
pnpm firmware:test:device
pnpm firmware:upload
pnpm firmware:monitor
```

`firmware:test` runs deterministic logic tests on the development machine and does not
require an ESP32. `firmware:test:device` runs the embedded smoke suite and requires a
connected board.

In VS Code, install the recommended PlatformIO and C/C++ extensions, then generate the
compilation database used by IntelliSense:

```bash
pnpm firmware:intellisense
```

Run this command again after changing the board, libraries, or build flags in
`platformio.ini`. If stale squiggles remain, run `C/C++: Reset IntelliSense Database`
from the command palette. The ESP32 Arduino headers are downloaded by PlatformIO, not
committed to this repo.

`include/config.h` is ignored by Git because it can contain Wi-Fi and device secrets. If it
does not exist, the firmware falls back to `include/config.example.h` so editor indexing and
CI builds can still work. The example contains non-working placeholders; it is not a second
source of runtime configuration.

Firmware configuration is provisioned per physical device rather than loaded from the Node
apps' root `.env`. Set `DEVICE_ID` and `DEVICE_SECRET` to the matching database credentials,
and use a `GATEWAY_BASE_URL` reachable from the ESP32. On a physical device, `localhost`
refers to the ESP32 itself.

The fingerprint templates remain inside the scanner. The firmware only sends matched
template IDs to `device-gateway`.

Device requests must be signed with the HMAC protocol documented in
`../../docs/architecture/device-protocol.md`.
