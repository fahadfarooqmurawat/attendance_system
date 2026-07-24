import { getCurrentUser } from "../../lib/session";
import { hasPermission } from "../../lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createPrismaClient } from "@attendance/db";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

const db = createPrismaClient(process.env.DATABASE_URL as string);

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function formatDateHeader(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

export default async function TeamAttendancePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user, "team_attendance")) {
    return (
      <main className="app-shell">
        <div className="banner" style={{ borderColor: "#ef4444" }}>
          <p>Unauthorized: You do not have permission to access Team Attendance.</p>
        </div>
        <Link href="/" className="back-link">← Back to Dashboard</Link>
      </main>
    );
  }

  // Determine team scope
  const isSuperUser = hasPermission(user, "company_attendance") || user.roleName === "owner" || user.roleName === "hr";

  let teamEmployees = await db.employee.findMany({
    where: isSuperUser ? {} : { managerId: user.employeeId },
    include: {
      role: true,
      manager: true
    },
    orderBy: { fullName: "asc" }
  });

  if (teamEmployees.length === 0 && !isSuperUser) {
    teamEmployees = await db.employee.findMany({
      include: {
        role: true,
        manager: true
      },
      orderBy: { fullName: "asc" }
    });
  }

  const teamIds = teamEmployees.map(e => e.id);

  // Define today's time range
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // 1. Fetch weekly off-days setting
  const offDaysSetting = await db.companySetting.findUnique({
    where: { key: "weekly_off_days" }
  });
  const offDaysArray: number[] = Array.isArray(offDaysSetting?.value) ? (offDaysSetting.value as number[]) : [0];
  const isTodayWeekend = offDaysArray.includes(now.getDay());

  // 2. Fetch today's official holiday
  const todayHoliday = await db.holiday.findUnique({
    where: { date: startOfToday }
  });

  // 3. Fetch scans for today
  const todayScans = await db.scanEvent.findMany({
    where: {
      employeeId: { in: teamIds },
      serverReceivedAt: {
        gte: startOfToday,
        lte: endOfToday
      }
    },
    orderBy: { serverReceivedAt: "asc" }
  });

  // Group scans by employeeId
  const scansByEmployee = new Map<string, typeof todayScans>();
  for (const scan of todayScans) {
    if (!scan.employeeId) continue;
    const existing = scansByEmployee.get(scan.employeeId) || [];
    existing.push(scan);
    scansByEmployee.set(scan.employeeId, existing);
  }

  // Calculate metrics and statuses
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let exemptCount = 0;

  const teamRows = teamEmployees.map(emp => {
    const empScans = scansByEmployee.get(emp.id) || [];
    const scanCount = empScans.length;

    let firstInStr = "—";
    let lastOutStr = "—";
    let status: "PRESENT" | "LATE" | "ABSENT" | "HOLIDAY" | "WEEKEND";

    if (scanCount > 0) {
      const firstScan = empScans[0]!;
      firstInStr = formatTime(firstScan.serverReceivedAt);
      
      if (scanCount > 1) {
        const lastScan = empScans[scanCount - 1]!;
        lastOutStr = formatTime(lastScan.serverReceivedAt);
      }

      // Check if late (e.g. first scan after 9:00 AM)
      const firstScanHour = firstScan.serverReceivedAt.getHours();
      const firstScanMinute = firstScan.serverReceivedAt.getMinutes();

      if (firstScanHour > 9 || (firstScanHour === 9 && firstScanMinute > 15)) {
        status = "LATE";
        lateCount++;
        presentCount++;
      } else {
        status = "PRESENT";
        presentCount++;
      }
    } else {
      // 0 Scans: Check Holiday or Weekend exemptions
      if (todayHoliday) {
        status = "HOLIDAY";
        exemptCount++;
      } else if (isTodayWeekend) {
        status = "WEEKEND";
        exemptCount++;
      } else {
        status = "ABSENT";
        absentCount++;
      }
    }

    return {
      id: emp.id,
      fullName: emp.fullName,
      email: emp.email,
      roleName: emp.role?.name || "employee",
      managerName: emp.manager?.fullName || "None",
      scanCount,
      firstInStr,
      lastOutStr,
      status
    };
  });

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <Link href="/" className="back-link">← Dashboard</Link>
          </div>
          <h1>Team Attendance Status</h1>
          <p className="muted">
            Live team monitor for <strong>{formatDateHeader(now)}</strong>
            {todayHoliday && <span style={{ color: "#c084fc", marginLeft: "8px" }}>• {todayHoliday.name}</span>}
            {!todayHoliday && isTodayWeekend && <span style={{ color: "#94a3b8", marginLeft: "8px" }}>• Weekly Off-Day</span>}
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="logout-btn">Sign Out</button>
        </form>
      </header>

      {/* Summary KPI Cards */}
      <section className="panel-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <article className="panel" style={{ cursor: "default", padding: "20px 24px" }}>
          <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Team</p>
          <h2 style={{ fontSize: "2.2rem", margin: "8px 0 0 0", color: "#60a5fa" }}>{teamEmployees.length}</h2>
        </article>
        <article className="panel" style={{ cursor: "default", padding: "20px 24px" }}>
          <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Present Today</p>
          <h2 style={{ fontSize: "2.2rem", margin: "8px 0 0 0", color: "#4ade80" }}>{presentCount}</h2>
        </article>
        <article className="panel" style={{ cursor: "default", padding: "20px 24px" }}>
          <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Late Arrivals</p>
          <h2 style={{ fontSize: "2.2rem", margin: "8px 0 0 0", color: "#fbbf24" }}>{lateCount}</h2>
        </article>
        <article className="panel" style={{ cursor: "default", padding: "20px 24px" }}>
          <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Absent / No Punch</p>
          <h2 style={{ fontSize: "2.2rem", margin: "8px 0 0 0", color: "#f87171" }}>{absentCount}</h2>
        </article>
        <article className="panel" style={{ cursor: "default", padding: "20px 24px" }}>
          <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Exempt / Off Day</p>
          <h2 style={{ fontSize: "2.2rem", margin: "8px 0 0 0", color: "#c084fc" }}>{exemptCount}</h2>
        </article>
      </section>

      {/* Team Member Status Table */}
      <section className="panel" style={{ cursor: "default", display: "block" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>Team Attendance Details</h2>
          <span className="muted" style={{ fontSize: "0.9rem" }}>Total: {teamRows.length} members</span>
        </div>

        {teamRows.length === 0 ? (
          <p className="muted">No team members found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>Employee</th>
                  <th style={{ padding: "12px 16px" }}>Role</th>
                  <th style={{ padding: "12px 16px" }}>First In</th>
                  <th style={{ padding: "12px 16px" }}>Last Out</th>
                  <th style={{ padding: "12px 16px" }}>Punches</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {teamRows.map(row => (
                  <tr key={row.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <strong>{row.fullName}</strong>
                      <div className="muted" style={{ fontSize: "0.85rem" }}>{row.email}</div>
                    </td>
                    <td style={{ padding: "14px 16px", textTransform: "capitalize" }}>
                      <span className="muted">{row.roleName}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>{row.firstInStr}</td>
                    <td style={{ padding: "14px 16px" }}>{row.lastOutStr}</td>
                    <td style={{ padding: "14px 16px" }}>{row.scanCount}</td>
                    <td style={{ padding: "14px 16px" }}>
                      {row.status === "PRESENT" && (
                        <span style={{
                          background: "rgba(74, 222, 128, 0.15)",
                          color: "#4ade80",
                          border: "1px solid rgba(74, 222, 128, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}>Present</span>
                      )}
                      {row.status === "LATE" && (
                        <span style={{
                          background: "rgba(251, 191, 36, 0.15)",
                          color: "#fbbf24",
                          border: "1px solid rgba(251, 191, 36, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}>Late</span>
                      )}
                      {row.status === "ABSENT" && (
                        <span style={{
                          background: "rgba(248, 113, 113, 0.15)",
                          color: "#f87171",
                          border: "1px solid rgba(248, 113, 113, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}>Absent</span>
                      )}
                      {row.status === "HOLIDAY" && (
                        <span style={{
                          background: "rgba(192, 132, 252, 0.15)",
                          color: "#c084fc",
                          border: "1px solid rgba(192, 132, 252, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}>Holiday</span>
                      )}
                      {row.status === "WEEKEND" && (
                        <span style={{
                          background: "rgba(148, 163, 184, 0.15)",
                          color: "#94a3b8",
                          border: "1px solid rgba(148, 163, 184, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}>Weekend Off</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
