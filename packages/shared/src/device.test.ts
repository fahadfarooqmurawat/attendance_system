import { describe, expect, it } from "vitest";

import {
  deviceEnrollmentResultSchema,
  deviceHeartbeatResponseSchema,
  deviceHeartbeatSchema
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
          sessionId: "session-1"
        },
        lastSeenAt: "2026-07-14T12:00:00.000Z"
      }).enrollment?.sessionId
    ).toBe("session-1");
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
});
