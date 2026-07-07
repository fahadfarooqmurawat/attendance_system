# Firmware

ESP32 firmware scaffold for the fingerprint attendance device.

## Local Setup

```bash
cp include/config.example.h include/config.h
pio run
pio device monitor
```

When running from the root directory

```bash
pio run -d apps/firmware
```

In VS Code, install the recommended PlatformIO and C/C++ extensions. If `Arduino.h` shows
as missing, run `pio run -d apps/firmware` once or use `PlatformIO: Rebuild IntelliSense
Index` from the command palette. The ESP32 Arduino headers are downloaded by PlatformIO,
not committed to this repo.

`include/config.h` is ignored by Git because it can contain Wi-Fi and device secrets. If it
does not exist, the firmware falls back to `include/config.example.h` so editor indexing and
CI builds can still work.

The fingerprint templates remain inside the scanner. The firmware only sends matched
template IDs to `device-gateway`.

Device requests must be signed with the HMAC protocol documented in
`../../docs/architecture/device-protocol.md`.
