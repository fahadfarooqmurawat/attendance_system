"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { compareSync } from "bcryptjs";
import { createPrismaClient } from "@attendance/db";
import { signSessionToken } from "../../lib/session-token";
import { getSessionSecret } from "../../lib/session";

const db = createPrismaClient(process.env.DATABASE_URL as string);

export async function login(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const employee = await db.employee.findUnique({
    where: { email },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  if (!employee || employee.status !== "ACTIVE") {
    return { error: "Invalid email or password." };
  }

  const passwordMatch = compareSync(password, employee.passwordHash);

  if (!passwordMatch) {
    return { error: "Invalid email or password." };
  }

  // Create JWT payload
  const roleName = employee.role?.name || "employee";
  const permissions =
    employee.role?.permissions.map((rp: { permission: { name: string } }) => rp.permission.name) ||
    [];

  const tokenPayload = {
    employeeId: employee.id,
    email: employee.email,
    fullName: employee.fullName,
    roleName,
    permissions,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour expiry as requested
  };

  const token = signSessionToken(tokenPayload, getSessionSecret());

  // Set HTTP-only cookie
  (await cookies()).set("attendance_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 // 1 hour
  });

  redirect("/");
}

export async function logout() {
  (await cookies()).delete("attendance_session");
  redirect("/login");
}
