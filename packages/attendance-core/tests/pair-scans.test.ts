import { describe, expect, it } from "vitest";

import { pairScans } from "../src/pair-scans.js";

describe("pairScans", () => {
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
});
