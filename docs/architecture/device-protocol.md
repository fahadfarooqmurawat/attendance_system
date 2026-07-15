# Device Protocol

## Headers

```text
x-device-id: device id issued by the dashboard
x-device-timestamp: unix seconds, unix milliseconds, or ISO timestamp
x-device-signature: HMAC-SHA256 signature as hex or sha256=<hex>
```

The signature is calculated over the raw request body, not a re-serialized JSON object.
Devices sign this canonical string:

```text
<x-device-timestamp>
<HTTP method>
<path and query string>
<raw request body>
```

The HMAC key is the SHA-256 hex digest of the device secret. In development, the seeded
device id is `esp32-dev-001` and the default device secret is `dev-device-secret`.
Production devices must be provisioned with unique random secrets.

## Endpoints

```text
POST /device/heartbeat
POST /device/scans
POST /device/enrollment-result
```

## Heartbeat And Device Mode

The heartbeat is the device control-plane exchange. It reports the ESP32's observed state,
and the response tells the ESP32 whether it should scan normally or perform an enrollment.

Request:

```json
{
  "deviceId": "esp32-dev-001",
  "firmwareVersion": "0.1.0",
  "reportedMode": "SCAN",
  "activeEnrollmentSessionId": null
}
```

Response with no enrollment work:

```json
{
  "accepted": true,
  "deviceId": "esp32-dev-001",
  "lastSeenAt": "2026-07-14T12:00:00.000Z",
  "desiredMode": "SCAN",
  "enrollment": null,
  "cancelEnrollmentSessionId": null
}
```

Response with enrollment work:

```json
{
  "accepted": true,
  "deviceId": "esp32-dev-001",
  "lastSeenAt": "2026-07-14T12:00:00.000Z",
  "desiredMode": "ENROLL",
  "enrollment": {
    "sessionId": "enrollment-session-id",
    "expiresAt": "2026-07-14T12:05:00.000Z"
  },
  "cancelEnrollmentSessionId": null
}
```

The first heartbeat that receives a pending enrollment changes its status to `CLAIMED`.
Claimed sessions are returned again on later heartbeats until the ESP32 submits an enrollment
result. This makes a lost heartbeat response safe: the session ID is the idempotency key.

When an active enrollment has been cancelled or expired, `desiredMode` is `SCAN` and
`cancelEnrollmentSessionId` identifies the workflow the ESP32 must abort.

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

## Enrollment Result

Successful enrollment results include the scanner's assigned template ID:

```json
{
  "deviceId": "esp32-dev-001",
  "enrollmentSessionId": "enrollment-session-id",
  "scannerTemplateId": 42,
  "status": "SUCCEEDED"
}
```

Failed results use `status: "FAILED"` and require a human-readable `message`. Cancelled
results may include a message and do not include a scanner template ID.
