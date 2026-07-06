# Device Protocol

## Headers

```text
x-device-id: device id issued by the dashboard
x-device-signature: HMAC signature placeholder
```

## Endpoints

```text
POST /device/heartbeat
POST /device/scans
GET  /device/commands
POST /device/commands/:commandId/ack
POST /device/enrollment-result
```

## Scan Payload

```json
{
  "deviceId": "esp32-dev-001",
  "scannerTemplateId": 42,
  "deviceScanSequence": 183,
  "firmwareVersion": "0.1.0",
  "matchConfidence": 0.98
}
```

The gateway resolves `deviceId + scannerTemplateId` to an employee. If no active
enrollment exists, the scan remains stored but unresolved.
