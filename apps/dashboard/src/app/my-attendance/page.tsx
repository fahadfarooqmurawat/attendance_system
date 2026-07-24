import { getCurrentUser } from "../../lib/session";
import { hasPermission } from "../../lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createPrismaClient } from "@attendance/db";
import { classifyDailyScans } from "@attendance/attendance-core";
import { logout } from "../login/actions";
import { ManualRequestsContainer } from "../manual-requests/manual-requests-container";
import { WeeklyAttendanceView, type WeekdayData } from "./weekly-attendance-view";

export const dynamic = "force-dynamic";

const db = createPrismaClient(process.env.DATABASE_URL as string);

function getLastWeekRange(referenceDate = new Date()) {
  const date = new Date(referenceDate);
  const currentDayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const distanceToCurrentMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

  const lastWeekMonday = new Date(date);
  lastWeekMonday.setDate(date.getDate() - distanceToCurrentMonday - 7);
  lastWeekMonday.setHours(0, 0, 0, 0);

  const lastWeekSunday = new Date(lastWeekMonday);
  lastWeekSunday.setDate(lastWeekMonday.getDate() + 6);
  lastWeekSunday.setHours(23, 59, 59, 999);

  return { lastWeekMonday, lastWeekSunday };
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function formatDateHeader(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatDateRangeStr(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const startStr = new Intl.DateTimeFormat("en-US", options).format(start);
  const endStr = new Intl.DateTimeFormat("en-US", options).format(end);
  return `${startStr} – ${endStr}`;
}

export default async function MyAttendancePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user, "my_attendance")) {
    return (
      <main className="app-shell">
        <div className="banner" style={{ borderColor: "#ef4444" }}>
          <p>You do not have permission to view your attendance logs.</p>
        </div>
        <Link href="/" className="back-link">← Back to Dashboard</Link>
      </main>
    );
  }

  const { lastWeekMonday, lastWeekSunday } = getLastWeekRange();

  // 1. Fetch weekly off-days setting
  const offDaysSetting = await db.companySetting.findUnique({
    where: { key: "weekly_off_days" }
  });
  const offDaysArray: number[] = Array.isArray(offDaysSetting?.value) ? (offDaysSetting.value as number[]) : [0];

  // 2. Fetch holidays during the week
  const holidays = await db.holiday.findMany({
    where: {
      date: {
        gte: lastWeekMonday,
        lte: lastWeekSunday
      }
    }
  });

  // 3. Fetch scans for the authenticated employee during last week
  const scanEvents = await db.scanEvent.findMany({
    where: {
      employeeId: user.employeeId,
      serverReceivedAt: {
        gte: lastWeekMonday,
        lte: lastWeekSunday
      }
    },
    orderBy: {
      serverReceivedAt: "asc"
    }
  });

  // Construct 7 weekday columns (Monday through Sunday)
  const weekdays: WeekdayData[] = [
    { dayName: "Monday", dateStr: "", fullDate: new Date(), scans: [] },
    { dayName: "Tuesday", dateStr: "", fullDate: new Date(), scans: [] },
    { dayName: "Wednesday", dateStr: "", fullDate: new Date(), scans: [] },
    { dayName: "Thursday", dateStr: "", fullDate: new Date(), scans: [] },
    { dayName: "Friday", dateStr: "", fullDate: new Date(), scans: [] },
    { dayName: "Saturday", dateStr: "", fullDate: new Date(), scans: [] },
    { dayName: "Sunday", dateStr: "", fullDate: new Date(), scans: [] }
  ];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(lastWeekMonday);
    dayDate.setDate(lastWeekMonday.getDate() + i);
    dayDate.setHours(0, 0, 0, 0);

    weekdays[i]!.fullDate = dayDate;
    weekdays[i]!.dateStr = formatDateHeader(dayDate);

    // Filter scans matching this day
    const rawDayScans = scanEvents.filter((scan) => {
      const scanDate = new Date(scan.serverReceivedAt);
      return (
        scanDate.getFullYear() === dayDate.getFullYear() &&
        scanDate.getMonth() === dayDate.getMonth() &&
        scanDate.getDate() === dayDate.getDate()
      );
    });

    const formattedScans = rawDayScans.map((scan) => ({
      id: scan.id,
      timeStr: formatTime(new Date(scan.serverReceivedAt)),
      occurredAt: scan.serverReceivedAt
    }));

    weekdays[i]!.scans = classifyDailyScans(formattedScans, weekdays[i]!.dayName);

    // Determine status for days without scans
    if (weekdays[i]!.scans.length > 0) {
      weekdays[i]!.status = "PRESENT";
    } else {
      // Check Holiday exemption
      const foundHoliday = holidays.find(h => {
        const hDate = new Date(h.date);
        return (
          hDate.getFullYear() === dayDate.getFullYear() &&
          hDate.getMonth() === dayDate.getMonth() &&
          hDate.getDate() === dayDate.getDate()
        );
      });

      if (foundHoliday) {
        weekdays[i]!.status = "HOLIDAY";
        weekdays[i]!.holidayName = foundHoliday.name;
      } else if (offDaysArray.includes(dayDate.getDay())) {
        weekdays[i]!.status = "WEEKEND";
      } else {
        weekdays[i]!.status = "ABSENT";
      }
    }
  }

  const totalScans = scanEvents.length;
  const daysPresent = weekdays.filter((w) => w.scans.length > 0).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>My Attendance</h1>
          <p className="muted">
            Viewing last week attendance for <strong>{user.fullName}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/" className="back-link">
            ← Dashboard
          </Link>
          <form action={logout}>
            <button type="submit" className="logout-btn">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Manual Request Pop-up Trigger */}
      <section>
        <ManualRequestsContainer />
      </section>

      {/* Last Week Date Banner */}
      <section className="banner">
        <div className="banner-info">
          <span className="banner-title">📅 Last Week's Attendance Summary</span>
          <span className="banner-dates">
            {formatDateRangeStr(lastWeekMonday, lastWeekSunday)}
          </span>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Scans</span>
          <span className="stat-value">{totalScans}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Days Present</span>
          <span className="stat-value">{daysPresent} / 7</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Scans / Active Day</span>
          <span className="stat-value">
            {daysPresent > 0 ? (totalScans / daysPresent).toFixed(1) : "0"}
          </span>
        </div>
      </section>

      {/* Weekly Grid Table */}
      <WeeklyAttendanceView weekdays={weekdays} />
    </main>
  );
}
