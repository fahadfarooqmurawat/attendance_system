import { describe, expect, it } from "vitest";

import { pairScans } from "../src/pair-scans.js";

describe("pairScans", () => {
  it("returns no pairs when there are no scans", () => {
    expect(pairScans([])).toEqual([]);
  });

  it("pairs an even number of scans in chronological order", () => {
    const pairs = pairScans([
      { id: "scan-4", occurredAt: new Date("2026-07-02T17:00:00.000Z") },
      { id: "scan-2", occurredAt: new Date("2026-07-02T12:00:00.000Z") },
      { id: "scan-1", occurredAt: new Date("2026-07-02T08:00:00.000Z") },
      { id: "scan-3", occurredAt: new Date("2026-07-02T13:00:00.000Z") }
    ]);

    expect(pairs).toEqual([
      {
        checkIn: expect.objectContaining({ id: "scan-1" }),
        checkOut: expect.objectContaining({ id: "scan-2" })
      },
      {
        checkIn: expect.objectContaining({ id: "scan-3" }),
        checkOut: expect.objectContaining({ id: "scan-4" })
      }
    ]);
  });

  it("pairs odd scan counts with an open checkout", () => {
    const pairs = pairScans([
      { id: "scan-2", occurredAt: new Date("2026-07-02T13:00:00.000Z") },
      { id: "scan-1", occurredAt: new Date("2026-07-02T09:00:00.000Z") },
      { id: "scan-3", occurredAt: new Date("2026-07-02T14:00:00.000Z") }
    ]);

    expect(pairs).toHaveLength(2);
    expect(pairs[0]?.checkIn.id).toBe("scan-1");
    expect(pairs[0]?.checkOut?.id).toBe("scan-2");
    expect(pairs[1]?.checkIn.id).toBe("scan-3");
    expect(pairs[1]?.checkOut).toBeNull();
  });

  it("does not mutate the caller's scan order", () => {
    const scans = [
      { id: "later", occurredAt: new Date("2026-07-02T17:00:00.000Z") },
      { id: "earlier", occurredAt: new Date("2026-07-02T08:00:00.000Z") }
    ];

    pairScans(scans);

    expect(scans.map((scan) => scan.id)).toEqual(["later", "earlier"]);
  });
});
