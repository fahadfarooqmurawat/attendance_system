# Firmware

ESP32 firmware scaffold for the fingerprint attendance device.

## Local Setup

Copy config

```bash
cp include/config.example.h include/config.h
```

Build, Upload and Monitor locally

```bash
pio run
pio run -t upload
pio device monitor
```

Build, Upload and Monitor from root directory

```bash
pnpm firmware:build
pnpm firmware:upload
pnpm firmware:monitor
```

In VS Code, install the recommended PlatformIO and C/C++ extensions. If `Arduino.h` shows
as missing, run `pnpm firmware:build` from the repo root once or use `PlatformIO: Rebuild IntelliSense
Index` from the command palette. The ESP32 Arduino headers are downloaded by PlatformIO,
not committed to this repo.

`include/config.h` is ignored by Git because it can contain Wi-Fi and device secrets. If it
does not exist, the firmware falls back to `include/config.example.h` so editor indexing and
CI builds can still work.

The fingerprint templates remain inside the scanner. The firmware only sends matched
template IDs to `device-gateway`.

Device requests must be signed with the HMAC protocol documented in
`../../docs/architecture/device-protocol.md`.
