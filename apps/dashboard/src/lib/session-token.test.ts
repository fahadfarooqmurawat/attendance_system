import { describe, expect, it } from "vitest";

import { signSessionToken, verifySessionToken } from "./session-token.js";

describe("session tokens", () => {
  it("verifies signed, unexpired session payloads", () => {
    const token = signSessionToken(
      {
        email: "owner@example.com",
        fullName: "Test Owner",
        employeeId: "employee-1",
        exp: 1_783_334_400,
        roleName: "owner",
        permissions: ["enrollment", "reports"]
      },
      "test-session-secret"
    );

    expect(
      verifySessionToken(token, "test-session-secret", new Date("2026-07-06T10:00:00Z"))
    ).toEqual({
      email: "owner@example.com",
      fullName: "Test Owner",
      employeeId: "employee-1",
      roleName: "owner",
      permissions: ["enrollment", "reports"]
    });
  });

  it("rejects tampered tokens", () => {
    const token = signSessionToken(
      {
        email: "owner@example.com",
        fullName: "Test Owner",
        employeeId: "employee-1",
        exp: 1_783_334_400,
        roleName: "owner",
        permissions: ["enrollment", "reports"]
      },
      "test-session-secret"
    );

    expect(
      verifySessionToken(
        `${token.slice(0, -1)}x`,
        "test-session-secret",
        new Date("2026-07-06T10:00:00Z")
      )
    ).toBeNull();
  });

  it("rejects expired tokens", () => {
    const token = signSessionToken(
      {
        email: "owner@example.com",
        fullName: "Test Owner",
        employeeId: "employee-1",
        exp: 1_783_334_400,
        roleName: "owner",
        permissions: ["enrollment", "reports"]
      },
      "test-session-secret"
    );

    expect(
      verifySessionToken(token, "test-session-secret", new Date("2026-07-07T00:00:01Z"))
    ).toBeNull();
  });
});
