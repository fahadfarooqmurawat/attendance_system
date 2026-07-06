import { describe, expect, it } from "vitest";

import { getHealthResponse } from "../src/health.js";

describe("device-gateway health", () => {
  it("returns a health response", () => {
    expect(getHealthResponse()).toEqual({ ok: true, service: "device-gateway" });
  });
});
