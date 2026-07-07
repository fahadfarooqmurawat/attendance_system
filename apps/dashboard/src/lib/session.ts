import { cookies } from "next/headers";

import { verifySessionToken } from "./session-token.js";

export type SessionUser = {
  employeeId: string;
  email: string;
  isHr: boolean;
  isOwner: boolean;
};

const sessionCookieName = "attendance_session";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const sessionSecret = getSessionSecret();
  const sessionCookie = (await cookies()).get(sessionCookieName);

  if (!sessionCookie) {
    return null;
  }

  return verifySessionToken(sessionCookie.value, sessionSecret);
}

function getSessionSecret() {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret || sessionSecret === "change-me-in-production") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set to a strong value in production.");
    }

    return "dev-only-session-secret";
  }

  return sessionSecret;
}
