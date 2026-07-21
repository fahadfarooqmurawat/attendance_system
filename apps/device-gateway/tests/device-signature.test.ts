import { describe, expect, it } from "vitest";

import {
  buildDeviceSignatureMessage,
  hashDeviceSecret,
  signDeviceRequest,
  verifyDeviceSignature
} from "../src/lib/device-signature.js";

describe("device request signatures", () => {
  const secretHash = hashDeviceSecret("dev-device-secret");
  const timestamp = "2026-07-06T10:00:00.000Z";
  const body = Buffer.from(JSON.stringify({ deviceId: "esp32-dev-001" }));

  it("builds a canonical message with an uppercase method", () => {
    expect(
      buildDeviceSignatureMessage({ body, method: "post", path: "/device/heartbeat", timestamp })
    ).toBe(`${timestamp}\nPOST\n/device/heartbeat\n${body.toString("utf8")}`);
  });

  it("hashes secrets deterministically without exposing the original secret", () => {
    expect(hashDeviceSecret("dev-device-secret")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashDeviceSecret("dev-device-secret")).toBe(secretHash);
    expect(secretHash).not.toContain("dev-device-secret");
  });

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

  it.each(["not-a-date", "9007199254740992"])("rejects invalid timestamp %s", (badTimestamp) => {
    expect(
      verifyDeviceSignature(
        {
          body,
          method: "POST",
          path: "/device/heartbeat",
          secretHash,
          signature: "0".repeat(64),
          timestamp: badTimestamp
        },
        { maxAgeSeconds: 300, now: new Date("2026-07-06T10:01:00.000Z") }
      )
    ).toEqual({ ok: false, reason: "invalid_timestamp" });
  });

  it("accepts Unix timestamps in seconds and a sha256 signature prefix", () => {
    const unixTimestamp = String(Date.parse(timestamp) / 1000);
    const signature = signDeviceRequest({
      body,
      method: "POST",
      path: "/device/heartbeat",
      secretHash,
      timestamp: unixTimestamp
    });

    expect(
      verifyDeviceSignature(
        {
          body,
          method: "POST",
          path: "/device/heartbeat",
          secretHash,
          signature: `sha256=${signature.toUpperCase()}`,
          timestamp: unixTimestamp
        },
        { maxAgeSeconds: 300, now: new Date("2026-07-06T10:01:00.000Z") }
      )
    ).toEqual({ ok: true });
  });

  it.each(["", "abc", "g".repeat(64), "a".repeat(63)])(
    "rejects malformed signature %s",
    (badSignature) => {
      expect(
        verifyDeviceSignature(
          {
            body,
            method: "POST",
            path: "/device/heartbeat",
            secretHash,
            signature: badSignature,
            timestamp
          },
          { maxAgeSeconds: 300, now: new Date("2026-07-06T10:01:00.000Z") }
        )
      ).toEqual({ ok: false, reason: "invalid_signature" });
    }
  );

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
