import { describe, expect, it } from "vitest";

import { signSessionToken, verifySessionToken } from "./session-token.js";

describe("session tokens", () => {
  it("verifies signed, unexpired session payloads", () => {
    const token = signSessionToken(
      {
        email: "owner@example.com",
        employeeId: "employee-1",
        exp: 1_783_334_400,
        isHr: false,
        isOwner: true
      },
      "test-session-secret"
    );

    expect(
      verifySessionToken(token, "test-session-secret", new Date("2026-07-06T10:00:00Z"))
    ).toEqual({
      email: "owner@example.com",
      employeeId: "employee-1",
      isHr: false,
      isOwner: true
    });
  });

  it("rejects tampered tokens", () => {
    const token = signSessionToken(
      {
        email: "owner@example.com",
        employeeId: "employee-1",
        exp: 1_783_334_400,
        isHr: false,
        isOwner: true
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
        employeeId: "employee-1",
        exp: 1_783_334_400,
        isHr: false,
        isOwner: true
      },
      "test-session-secret"
    );

    expect(
      verifySessionToken(token, "test-session-secret", new Date("2026-07-07T00:00:01Z"))
    ).toBeNull();
  });

  it("rejects a token at its exact expiration time", () => {
    const token = signSessionToken(
      {
        email: "owner@example.com",
        employeeId: "employee-1",
        exp: 1_783_334_400,
        isHr: false,
        isOwner: true
      },
      "test-session-secret"
    );

    expect(verifySessionToken(token, "test-session-secret", new Date(1_783_334_400_000))).toBeNull();
  });

  it.each([
    "",
    "one-part",
    "one.two.three",
    "not-json.invalid-signature"
  ])("rejects malformed token %s", (token) => {
    expect(verifySessionToken(token, "test-session-secret")).toBeNull();
  });

  it("rejects a correctly signed payload with missing or invalid claims", () => {
    const invalidClaims = {
      email: "owner@example.com",
      employeeId: "employee-1",
      exp: "tomorrow",
      isHr: false,
      isOwner: true
    };
    const token = signSessionToken(
      invalidClaims as unknown as Parameters<typeof signSessionToken>[0],
      "test-session-secret"
    );

    expect(verifySessionToken(token, "test-session-secret")).toBeNull();
  });

  it("rejects a valid token when a different secret is used", () => {
    const token = signSessionToken(
      {
        email: "owner@example.com",
        employeeId: "employee-1",
        exp: 4_102_444_800,
        isHr: true,
        isOwner: false
      },
      "correct-secret"
    );

    expect(verifySessionToken(token, "wrong-secret")).toBeNull();
  });
});
