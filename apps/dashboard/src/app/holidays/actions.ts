"use server";

import { getCurrentUser } from "../../lib/session";
import { hasPermission } from "../../lib/rbac";
import { createPrismaClient } from "@attendance/db";
import { revalidatePath } from "next/cache";

const db = createPrismaClient(process.env.DATABASE_URL as string);

function isAuthorized(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return false;
  const role = user.roleName?.toLowerCase();
  return (
    hasPermission(user, "company_attendance") ||
    hasPermission(user, "reports") ||
    hasPermission(user, "enrollment") ||
    role === "owner" ||
    role === "hr" ||
    role === "admin"
  );
}

export async function updateWeeklyOffDays(formData: FormData) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    throw new Error("Unauthorized");
  }

  const offDaysType = formData.get("offDaysType") as string;
  let offDays: number[];

  if (offDaysType === "custom") {
    const rawDays = formData.getAll("customDays");
    offDays = rawDays.map((d) => parseInt(d as string, 10)).filter((n) => !isNaN(n) && n >= 0 && n <= 6);
  } else if (offDaysType === "sat_sun") {
    offDays = [0, 6];
  } else if (offDaysType === "fri_sat") {
    offDays = [5, 6];
  } else if (offDaysType === "fri_only") {
    offDays = [5];
  } else {
    offDays = [0];
  }

  await db.companySetting.upsert({
    create: {
      key: "weekly_off_days",
      value: offDays
    },
    update: {
      value: offDays
    },
    where: { key: "weekly_off_days" }
  });

  revalidatePath("/holidays");
  revalidatePath("/company-attendance");
  revalidatePath("/team-attendance");
}

export async function createHoliday(formData: FormData) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    throw new Error("Unauthorized");
  }

  const name = (formData.get("name") as string)?.trim();
  const dateStr = (formData.get("date") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!name || !dateStr) {
    throw new Error("Holiday name and date are required.");
  }

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  await db.holiday.upsert({
    create: {
      name,
      date,
      description
    },
    update: {
      name,
      description
    },
    where: { date }
  });

  revalidatePath("/holidays");
  revalidatePath("/company-attendance");
  revalidatePath("/team-attendance");
}

export async function deleteHoliday(formData: FormData) {
  const user = await getCurrentUser();
  if (!isAuthorized(user)) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  if (!id) return;

  await db.holiday.delete({
    where: { id }
  });

  revalidatePath("/holidays");
  revalidatePath("/company-attendance");
  revalidatePath("/team-attendance");
}
