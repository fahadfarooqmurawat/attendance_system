import { describe, expect, it } from "vitest";

import { approvalStatusSchema, manualAttendanceRequestTypeSchema } from "./attendance.js";

describe("attendance workflow schemas", () => {
  it.each(["ADD_SCAN", "REMOVE_SCAN"])("accepts request type %s", (requestType) => {
    expect(manualAttendanceRequestTypeSchema.parse(requestType)).toBe(requestType);
  });

  it.each(["PENDING", "APPROVED", "REJECTED", "SKIPPED"])(
    "accepts approval status %s",
    (status) => {
      expect(approvalStatusSchema.parse(status)).toBe(status);
    }
  );

  it("rejects unknown workflow values", () => {
    expect(manualAttendanceRequestTypeSchema.safeParse("EDIT_SCAN").success).toBe(false);
    expect(approvalStatusSchema.safeParse("CANCELLED").success).toBe(false);
  });
});
