import { describe, expect, it } from "vitest";

import {
  hashDeviceSecret,
  signDeviceRequest,
  verifyDeviceSignature
} from "../src/lib/device-signature.js";

describe("device request signatures", () => {
  const secretHash = hashDeviceSecret("dev-device-secret");
  const timestamp = "2026-07-06T10:00:00.000Z";
  const body = Buffer.from(JSON.stringify({ deviceId: "esp32-dev-001" }));

  it("accepts matching HMAC signatures", () => {
    const signature = signDeviceRequest({
      body,
      method: "POST",
      path: "/device/heartbeat",
      secretHash,
      timestamp
    });

    expect(
      verifyDeviceSignature(
        {
          body,
          method: "POST",
          path: "/device/heartbeat",
          secretHash,
          signature,
          timestamp
        },
        { maxAgeSeconds: 300, now: new Date("2026-07-06T10:01:00.000Z") }
      )
    ).toEqual({ ok: true });
  });

  it("rejects stale timestamps", () => {
    const signature = signDeviceRequest({
      body,
      method: "POST",
      path: "/device/heartbeat",
      secretHash,
      timestamp
    });

    expect(
      verifyDeviceSignature(
        {
          body,
          method: "POST",
          path: "/device/heartbeat",
          secretHash,
          signature,
          timestamp
        },
        { maxAgeSeconds: 300, now: new Date("2026-07-06T10:10:01.000Z") }
      )
    ).toEqual({ ok: false, reason: "expired_timestamp" });
  });

  it("rejects signatures for changed bodies", () => {
    const signature = signDeviceRequest({
      body,
      method: "POST",
      path: "/device/heartbeat",
      secretHash,
      timestamp
    });

    expect(
      verifyDeviceSignature(
        {
          body: Buffer.from(JSON.stringify({ deviceId: "different-device" })),
          method: "POST",
          path: "/device/heartbeat",
          secretHash,
          signature,
          timestamp
        },
        { maxAgeSeconds: 300, now: new Date("2026-07-06T10:01:00.000Z") }
      )
    ).toEqual({ ok: false, reason: "invalid_signature" });
  });
});
