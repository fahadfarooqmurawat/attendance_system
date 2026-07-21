import { describe, expect, it } from "vitest";

import {
  deviceEnrollmentResultSchema,
  deviceHeartbeatResponseSchema,
  deviceHeartbeatSchema,
  deviceScanSchema
} from "./device.js";

describe("device heartbeat protocol", () => {
  it("accepts reported mode and an active enrollment session", () => {
    expect(
      deviceHeartbeatSchema.parse({
        activeEnrollmentSessionId: "session-1",
        deviceId: "device-1",
        reportedMode: "ENROLL"
      })
    ).toMatchObject({ reportedMode: "ENROLL" });
  });

  it("accepts an enrollment directive in the response", () => {
    expect(
      deviceHeartbeatResponseSchema.parse({
        accepted: true,
        cancelEnrollmentSessionId: null,
        desiredMode: "ENROLL",
        deviceId: "device-1",
        enrollment: {
          expiresAt: "2026-07-14T12:05:00.000Z",
          sessionId: "session-1",
          templateId: 1
        },
        lastSeenAt: "2026-07-14T12:00:00.000Z"
      }).enrollment?.sessionId
    ).toBe("session-1");
  });

  it("rejects an unsupported reported mode", () => {
    expect(() =>
      deviceHeartbeatSchema.parse({ deviceId: "device-1", reportedMode: "MAINTENANCE" })
    ).toThrow();
  });

  it("rejects malformed response timestamps", () => {
    expect(() =>
      deviceHeartbeatResponseSchema.parse({
        accepted: true,
        cancelEnrollmentSessionId: null,
        desiredMode: "SCAN",
        deviceId: "device-1",
        enrollment: null,
        lastSeenAt: "yesterday"
      })
    ).toThrow();
  });
});

describe("device scan protocol", () => {
  it("accepts boundary confidence values", () => {
    expect(
      deviceScanSchema.parse({
        deviceId: "device-1",
        deviceScanSequence: 0,
        matchConfidence: 1,
        scannerTemplateId: 0
      })
    ).toMatchObject({ deviceScanSequence: 0, matchConfidence: 1, scannerTemplateId: 0 });
  });

  it.each([
    { matchConfidence: -0.01, scannerTemplateId: 1 },
    { matchConfidence: 1.01, scannerTemplateId: 1 },
    { matchConfidence: 0.5, scannerTemplateId: -1 },
    { matchConfidence: 0.5, scannerTemplateId: 1.5 }
  ])("rejects invalid scan values %#", (values) => {
    expect(() => deviceScanSchema.parse({ deviceId: "device-1", ...values })).toThrow();
  });
});

describe("device enrollment result protocol", () => {
  it("requires a scanner template for successful enrollment", () => {
    expect(() =>
      deviceEnrollmentResultSchema.parse({
        deviceId: "device-1",
        enrollmentSessionId: "session-1",
        status: "SUCCEEDED"
      })
    ).toThrow();
  });

  it("does not require a scanner template for a failed enrollment", () => {
    expect(
      deviceEnrollmentResultSchema.parse({
        deviceId: "device-1",
        enrollmentSessionId: "session-1",
        message: "Fingerprint capture timed out",
        status: "FAILED"
      }).status
    ).toBe("FAILED");
  });

  it("allows a cancellation without a message", () => {
    expect(
      deviceEnrollmentResultSchema.parse({
        deviceId: "device-1",
        enrollmentSessionId: "session-1",
        status: "CANCELLED"
      })
    ).toMatchObject({ status: "CANCELLED" });
  });

  it("requires a failure message", () => {
    expect(() =>
      deviceEnrollmentResultSchema.parse({
        deviceId: "device-1",
        enrollmentSessionId: "session-1",
        status: "FAILED"
      })
    ).toThrow();
  });
});
