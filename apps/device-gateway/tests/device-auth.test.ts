import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  verifyDeviceSignature: vi.fn()
}));

vi.mock("../src/config.js", () => ({
  env: { DEVICE_SIGNATURE_MAX_AGE_SECONDS: 300 }
}));

vi.mock("../src/db.js", () => ({
  prisma: { device: { findUnique: mocks.findUnique } }
}));

vi.mock("../src/lib/device-signature.js", () => ({
  verifyDeviceSignature: mocks.verifyDeviceSignature
}));

import { requireDeviceAuth } from "../src/lib/device-auth.js";

type TestResponse = Response & {
  json: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
};

const activeDevice = {
  apiKeyHash: "a".repeat(64),
  firmwareVersion: "1.0.0",
  id: "device-1",
  lastSeenAt: null,
  name: "Front door",
  reportedMode: "SCAN",
  status: "ACTIVE"
};

function createRequest(headers: Record<string, string> = {}) {
  return {
    header: vi.fn((name: string) => headers[name]),
    method: "POST",
    originalUrl: "/device/heartbeat",
    rawBody: Buffer.from('{"deviceId":"device-1"}')
  } as unknown as Request;
}

function createResponse() {
  const response = {
    json: vi.fn(),
    locals: {},
    status: vi.fn()
  } as unknown as TestResponse;
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
}

const credentials = {
  "x-device-id": "device-1",
  "x-device-signature": "b".repeat(64),
  "x-device-timestamp": "1783332000"
};

describe("requireDeviceAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests with missing credentials before querying the database", async () => {
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    await requireDeviceAuth(createRequest(), response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "missing_device_credentials" });
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an unknown device", async () => {
    mocks.findUnique.mockResolvedValue(null);
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    await requireDeviceAuth(createRequest(credentials), response, next);

    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "device-1" } })
    );
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "invalid_device_credentials" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an inactive device without checking its signature", async () => {
    mocks.findUnique.mockResolvedValue({ ...activeDevice, status: "SUSPENDED" });
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    await requireDeviceAuth(createRequest(credentials), response, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ error: "device_not_active" });
    expect(mocks.verifyDeviceSignature).not.toHaveBeenCalled();
  });

  it("rejects a device whose secret has not been provisioned", async () => {
    mocks.findUnique.mockResolvedValue({ ...activeDevice, apiKeyHash: "not-a-sha256-hash" });
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    await requireDeviceAuth(createRequest(credentials), response, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ error: "device_secret_not_provisioned" });
    expect(mocks.verifyDeviceSignature).not.toHaveBeenCalled();
  });

  it("returns the signature verification reason", async () => {
    mocks.findUnique.mockResolvedValue(activeDevice);
    mocks.verifyDeviceSignature.mockReturnValue({ ok: false, reason: "expired_timestamp" });
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    await requireDeviceAuth(createRequest(credentials), response, next);

    expect(mocks.verifyDeviceSignature).toHaveBeenCalledWith(
      {
        body: Buffer.from('{"deviceId":"device-1"}'),
        method: "POST",
        path: "/device/heartbeat",
        secretHash: activeDevice.apiKeyHash,
        signature: credentials["x-device-signature"],
        timestamp: credentials["x-device-timestamp"]
      },
      { maxAgeSeconds: 300 }
    );
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "expired_timestamp" });
    expect(next).not.toHaveBeenCalled();
  });

  it("stores the authenticated device and continues for a valid signature", async () => {
    mocks.findUnique.mockResolvedValue(activeDevice);
    mocks.verifyDeviceSignature.mockReturnValue({ ok: true });
    const request = createRequest(credentials);
    delete (request as Request & { rawBody?: Buffer }).rawBody;
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    await requireDeviceAuth(request, response, next);

    expect(mocks.verifyDeviceSignature).toHaveBeenCalledWith(
      expect.objectContaining({ body: Buffer.alloc(0) }),
      { maxAgeSeconds: 300 }
    );
    expect(response.locals.device).toBe(activeDevice);
    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });

  it("forwards database errors to Express", async () => {
    const error = new Error("database unavailable");
    mocks.findUnique.mockRejectedValue(error);
    const response = createResponse();
    const next = vi.fn() as NextFunction;

    await requireDeviceAuth(createRequest(credentials), response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(response.status).not.toHaveBeenCalled();
  });
});
