import { describe, expect, it } from "vitest";
import { classifyDailyScans } from "../src/pair-scans";



describe("classifyDailyScans", () => {
  it("returns empty array for empty scans", () => {
    expect(classifyDailyScans([], "Monday")).toEqual([]);
  });

  it("marks 1 scan as needs-review with custom message", () => {
    const scans = [
      { id: "scan-1", occurredAt: new Date("2026-07-06T09:00:00.000Z") }
    ];
    const result = classifyDailyScans(scans, "Monday");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "scan-1",
      type: "needs-review",
      label: "Needs Review"
    });
    expect(result[0]?.reviewMessage).toContain("Only 1 scan on Monday needs review");
  });

  it("classifies 2 scans as Check In and Check Out", () => {
    const scans = [
      { id: "scan-1", occurredAt: new Date("2026-07-06T09:00:00.000Z") },
      { id: "scan-2", occurredAt: new Date("2026-07-06T17:00:00.000Z") }
    ];
    const result = classifyDailyScans(scans, "Monday");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: "scan-1", type: "check-in", label: "Check In" });
    expect(result[1]).toMatchObject({ id: "scan-2", type: "check-out", label: "Check Out" });
  });

  it("classifies 3 scans: 1st is Check In, 2nd is Needs Review, 3rd is Check Out", () => {
    const scans = [
      { id: "scan-1", occurredAt: new Date("2026-07-06T09:00:00.000Z") },
      { id: "scan-2", occurredAt: new Date("2026-07-06T13:00:00.000Z") },
      { id: "scan-3", occurredAt: new Date("2026-07-06T17:00:00.000Z") }
    ];
    const result = classifyDailyScans(scans, "Monday");

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ id: "scan-1", type: "check-in", label: "Check In" });
    expect(result[1]).toMatchObject({ id: "scan-2", type: "needs-review", label: "Needs Review" });
    expect(result[1]?.reviewMessage).toContain("Scan on Monday at");
    expect(result[2]).toMatchObject({ id: "scan-3", type: "check-out", label: "Check Out" });
  });

  it("classifies 4 scans as alternating Check In / Check Out pairs", () => {
    const scans = [
      { id: "scan-1", occurredAt: new Date("2026-07-06T08:00:00.000Z") },
      { id: "scan-2", occurredAt: new Date("2026-07-06T12:00:00.000Z") },
      { id: "scan-3", occurredAt: new Date("2026-07-06T13:00:00.000Z") },
      { id: "scan-4", occurredAt: new Date("2026-07-06T17:00:00.000Z") }
    ];
    const result = classifyDailyScans(scans, "Monday");

    expect(result).toHaveLength(4);
    expect(result[0]?.type).toBe("check-in");
    expect(result[1]?.type).toBe("check-out");
    expect(result[2]?.type).toBe("check-in");
    expect(result[3]?.type).toBe("check-out");
  });

  it("classifies 5 scans: 3rd scan needs review (last 3rd scan)", () => {
    const scans = [
      { id: "scan-1", occurredAt: new Date("2026-07-06T08:00:00.000Z") },
      { id: "scan-2", occurredAt: new Date("2026-07-06T12:00:00.000Z") },
      { id: "scan-3", occurredAt: new Date("2026-07-06T14:00:00.000Z") },
      { id: "scan-4", occurredAt: new Date("2026-07-06T15:00:00.000Z") },
      { id: "scan-5", occurredAt: new Date("2026-07-06T18:00:00.000Z") }
    ];
    const result = classifyDailyScans(scans, "Monday");

    expect(result).toHaveLength(5);
    expect(result[0]?.type).toBe("check-in");
    expect(result[1]?.type).toBe("check-out");
    expect(result[2]?.type).toBe("needs-review");
    expect(result[3]?.type).toBe("check-in");
    expect(result[4]?.type).toBe("check-out");
  });
});
