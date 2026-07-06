# Firmware

ESP32 firmware scaffold for the fingerprint attendance device.

## Local Setup

```bash
cp include/config.example.h include/config.h
pio run
pio device monitor
```

The fingerprint templates remain inside the scanner. The firmware only sends matched
template IDs to `device-gateway`.
