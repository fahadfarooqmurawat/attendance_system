import { createHmac, timingSafeEqual } from "node:crypto";

import type { SessionUser } from "./session.js";

export type SessionPayload = SessionUser & {
  exp: number;
  iat?: number;
};

const tokenSeparator = ".";

export function signSessionToken(payload: SessionPayload, secret: string) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(encodedPayload, secret);

  return `${encodedPayload}${tokenSeparator}${signature}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
  now = new Date()
): SessionUser | null {
  const [encodedPayload, signature, extra] = token.split(tokenSeparator);

  if (!encodedPayload || !signature || extra !== undefined) {
    return null;
  }

  if (!timingSafeTokenEqual(sign(encodedPayload, secret), signature)) {
    return null;
  }

  const payload = parsePayload(encodedPayload);

  if (!payload || payload.exp <= Math.floor(now.getTime() / 1000)) {
    return null;
  }

  return {
    email: payload.email,
    employeeId: payload.employeeId,
    isHr: payload.isHr,
    isOwner: payload.isOwner
  };
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload, "utf8").digest("base64url");
}

function parsePayload(encodedPayload: string): SessionPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.employeeId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.isHr !== "boolean" ||
      typeof payload.isOwner !== "boolean" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

function timingSafeTokenEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
