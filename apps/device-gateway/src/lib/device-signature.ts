import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type DeviceSignatureInput = {
  body: Buffer;
  method: string;
  path: string;
  secretHash: string;
  signature: string;
  timestamp: string;
};

export type DeviceSignatureResult =
  | { ok: true }
  | { ok: false; reason: "invalid_timestamp" | "expired_timestamp" | "invalid_signature" };

const HASH_HEX_LENGTH = 64;

export function hashDeviceSecret(secret: string) {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function buildDeviceSignatureMessage(input: {
  body: Buffer;
  method: string;
  path: string;
  timestamp: string;
}) {
  return [
    input.timestamp,
    input.method.toUpperCase(),
    input.path,
    input.body.toString("utf8")
  ].join("\n");
}

export function signDeviceRequest(input: {
  body: Buffer;
  method: string;
  path: string;
  secretHash: string;
  timestamp: string;
}) {
  return createHmac("sha256", Buffer.from(input.secretHash, "hex"))
    .update(buildDeviceSignatureMessage(input), "utf8")
    .digest("hex");
}

export function verifyDeviceSignature(
  input: DeviceSignatureInput,
  options: { maxAgeSeconds: number; now?: Date }
): DeviceSignatureResult {
  const timestampMs = parseDeviceTimestamp(input.timestamp);

  if (timestampMs === null) {
    return { ok: false, reason: "invalid_timestamp" };
  }

  const nowMs = options.now?.getTime() ?? Date.now();
  const maxAgeMs = options.maxAgeSeconds * 1000;

  if (Math.abs(nowMs - timestampMs) > maxAgeMs) {
    return { ok: false, reason: "expired_timestamp" };
  }

  const expected = signDeviceRequest(input);
  const actual = normalizeSignature(input.signature);

  if (!actual || !timingSafeHexEqual(expected, actual)) {
    return { ok: false, reason: "invalid_signature" };
  }

  return { ok: true };
}

function parseDeviceTimestamp(timestamp: string) {
  if (/^\d+$/.test(timestamp)) {
    const numericTimestamp = Number(timestamp);

    if (!Number.isSafeInteger(numericTimestamp)) {
      return null;
    }

    return numericTimestamp > 9_999_999_999 ? numericTimestamp : numericTimestamp * 1000;
  }

  const parsedTimestamp = Date.parse(timestamp);
  return Number.isNaN(parsedTimestamp) ? null : parsedTimestamp;
}

function normalizeSignature(signature: string) {
  const normalized = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;

  if (!/^[a-f0-9]+$/i.test(normalized) || normalized.length !== HASH_HEX_LENGTH) {
    return null;
  }

  return normalized.toLowerCase();
}

function timingSafeHexEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
