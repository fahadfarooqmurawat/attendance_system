"use server";

import { getCurrentUser } from "../../lib/session";
import { hasPermission } from "../../lib/rbac";
import { createPrismaClient } from "@attendance/db";
import { hashSync } from "bcryptjs";
import { revalidatePath } from "next/cache";

const db = createPrismaClient(process.env.DATABASE_URL as string);

export type EnrollmentState = {
  error?: string;
  success?: string;
};

export async function createEmployee(prevState: EnrollmentState, formData: FormData): Promise<EnrollmentState> {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user, "enrollment")) {
    return { error: "Unauthorized: You do not have permission to enroll employees." };
  }

  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const employeeCode = (formData.get("employeeCode") as string)?.trim();
  const password = formData.get("password") as string;
  const roleId = formData.get("roleId") as string;
  const managerId = formData.get("managerId") as string;
  const timezone = (formData.get("timezone") as string)?.trim() || "Asia/Karachi";

  if (!fullName) {
    return { error: "Full Name is required." };
  }

  if (!email || !email.includes("@")) {
    return { error: "A valid email address is required." };
  }

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  if (!roleId) {
    return { error: "Role selection is required." };
  }

  // Check email uniqueness
  const existingEmail = await db.employee.findUnique({
    where: { email }
  });

  if (existingEmail) {
    return { error: `An employee with the email "${email}" already exists.` };
  }

  // Check employee code uniqueness if provided
  if (employeeCode) {
    const existingCode = await db.employee.findUnique({
      where: { employeeCode }
    });

    if (existingCode) {
      return { error: `Employee code "${employeeCode}" is already in use.` };
    }
  }

  // Hash password
  const passwordHash = hashSync(password, 10);

  // Save new employee into PostgreSQL database
  await db.employee.create({
    data: {
      fullName,
      email,
      employeeCode: employeeCode || null,
      passwordHash,
      roleId: roleId || null,
      managerId: managerId || null,
      timezone,
      status: "ACTIVE"
    }
  });

  revalidatePath("/enrollment");

  return {
    success: `New employee "${fullName}" (${email}) enrolled successfully!`
  };
}
