import { getCurrentUser } from "../../lib/session";
import { hasPermission } from "../../lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createPrismaClient } from "@attendance/db";
import { logout } from "../login/actions";
import { CompanyRangeFilter, type SimpleEmployee } from "./range-filter";

export const dynamic = "force-dynamic";

const db = createPrismaClient(process.env.DATABASE_URL as string);

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(date);
}

function formatDateHeader(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

type PageProps = {
  searchParams: Promise<{ range?: string; employeeId?: string }>;
};

export default async function CompanyAttendancePage(props: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Strict restriction: Owner and HR only (guarded by company_attendance permission)
  const isAuthorized = hasPermission(user, "company_attendance") || user.roleName === "owner" || user.roleName === "hr";

  if (!isAuthorized) {
    return (
      <main className="app-shell">
        <header className="topbar">
          <div>
            <Link href="/" className="back-link">← Back to Dashboard</Link>
            <h1 style={{ color: "#ef4444", background: "none" }}>403 Access Restricted</h1>
          </div>
          <form action={logout}>
            <button type="submit" className="logout-btn">Sign Out</button>
          </form>
        </header>

        <div className="panel" style={{ cursor: "default", borderLeft: "4px solid #ef4444", padding: "24px" }}>
          <h2>Owner & HR Privilege Required</h2>
          <p className="muted" style={{ marginTop: "8px" }}>
            Company Attendance Metrics contain executive organization-wide data and are restricted exclusively to <strong>Owner</strong> and <strong>HR</strong> roles. Your role is <strong>{user.roleName}</strong>.
          </p>
        </div>
      </main>
    );
  }

  const searchParams = await props.searchParams;
  const range = searchParams.range || "today";
  const selectedEmployeeId = searchParams.employeeId || "all";

  const now = new Date();
  let startRange: Date | null = null;
  let rangeTitle = "Today / Last Day";

  if (range === "today") {
    startRange = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    rangeTitle = "Today / Last Day";
  } else if (range === "last_week") {
    startRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    rangeTitle = "Last Week (7 Days)";
  } else if (range === "last_month") {
    startRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    rangeTitle = "Last Month (30 Days)";
  } else if (range === "all_time") {
    startRange = null;
    rangeTitle = "All Time History";
  }

  // 1. All Active Employees for Employee Dropdown
  const activeEmployees = await db.employee.findMany({
    where: { status: "ACTIVE" },
    include: { role: true },
    orderBy: { fullName: "asc" }
  });

  const simpleEmployees: SimpleEmployee[] = activeEmployees.map(e => ({
    id: e.id,
    fullName: e.fullName,
    roleName: e.role?.name || "employee"
  }));

  const selectedEmployee = activeEmployees.find(e => e.id === selectedEmployeeId);

  // 2. Active Devices Count
  const activeDevicesCount = await db.device.count({
    where: { status: "ACTIVE" }
  });

  // 3. Scans Query with Filters
  const scanWhereClause: Record<string, unknown> = {};
  if (startRange) {
    scanWhereClause.serverReceivedAt = { gte: startRange };
  }
  if (selectedEmployeeId && selectedEmployeeId !== "all") {
    scanWhereClause.employeeId = selectedEmployeeId;
  }

  const periodScans = await db.scanEvent.findMany({
    where: scanWhereClause,
    include: {
      employee: true,
      device: true
    },
    orderBy: { serverReceivedAt: "desc" }
  });

  // Calculate metrics
  const isSingleEmployee = Boolean(selectedEmployee);
  const targetEmployeeCount = isSingleEmployee ? 1 : activeEmployees.length;

  const presentEmployeeIds = new Set(periodScans.map(s => s.employeeId).filter(Boolean));
  const presentCount = isSingleEmployee
    ? (presentEmployeeIds.has(selectedEmployee!.id) ? 1 : 0)
    : presentEmployeeIds.size;

  const attendanceRatePercentage = targetEmployeeCount > 0 
    ? Math.round((presentCount / targetEmployeeCount) * 100) 
    : 0;

  // Calculate punctuality rate among present staff (check-in before 09:15 AM)
  const employeeFirstPunches = new Map<string, Date>();
  for (const scan of periodScans) {
    if (!scan.employeeId) continue;
    const existing = employeeFirstPunches.get(scan.employeeId);
    if (!existing || scan.serverReceivedAt < existing) {
      employeeFirstPunches.set(scan.employeeId, scan.serverReceivedAt);
    }
  }

  let onTimeCount = 0;
  for (const [, scanTime] of employeeFirstPunches) {
    const hour = scanTime.getHours();
    const minute = scanTime.getMinutes();
    if (hour < 9 || (hour === 9 && minute <= 15)) {
      onTimeCount++;
    }
  }

  const punctualityRatePercentage = presentCount > 0 
    ? Math.round((onTimeCount / presentCount) * 100) 
    : 100;

  // Breakdown by Role
  const roleBreakdown = activeEmployees.reduce((acc, emp) => {
    const rName = emp.role?.name || "employee";
    acc[rName] = (acc[rName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const subTitle = isSingleEmployee
    ? `Filter: ${selectedEmployee!.fullName} (${rangeTitle})`
    : `Filter: All Staff (${rangeTitle})`;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <Link href="/" className="back-link">← Dashboard</Link>
          </div>
          <h1>Company Attendance Metrics</h1>
          <p className="muted">
            {subTitle}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <CompanyRangeFilter
            currentRange={range}
            currentEmployeeId={selectedEmployeeId}
            employees={simpleEmployees}
          />
          <form action={logout}>
            <button type="submit" className="logout-btn">Sign Out</button>
          </form>
        </div>
      </header>

      {/* KPI Overview Grid */}
      <section className="panel-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <article className="panel" style={{ cursor: "default", padding: "24px" }}>
          <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isSingleEmployee ? "Attendance Status" : "Organization Attendance"}
          </p>
          <h2 style={{ fontSize: "2.5rem", margin: "8px 0 0 0", color: "#60a5fa" }}>{attendanceRatePercentage}%</h2>
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
            {isSingleEmployee
              ? (presentCount > 0 ? `${selectedEmployee!.fullName} Present` : `${selectedEmployee!.fullName} Absent`)
              : `${presentCount} of ${targetEmployeeCount} active staff present`}
          </p>
        </article>

        <article className="panel" style={{ cursor: "default", padding: "24px" }}>
          <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Punctuality Rate</p>
          <h2 style={{ fontSize: "2.5rem", margin: "8px 0 0 0", color: "#4ade80" }}>{punctualityRatePercentage}%</h2>
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
            {onTimeCount} checked in before 09:15 AM
          </p>
        </article>

        <article className="panel" style={{ cursor: "default", padding: "24px" }}>
          <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Period Terminal Scans</p>
          <h2 style={{ fontSize: "2.5rem", margin: "8px 0 0 0", color: "#c084fc" }}>{periodScans.length}</h2>
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
            {isSingleEmployee ? `Scans by ${selectedEmployee!.fullName}` : "Total scan events recorded in period"}
          </p>
        </article>

        <article className="panel" style={{ cursor: "default", padding: "24px" }}>
          <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Terminals</p>
          <h2 style={{ fontSize: "2.5rem", margin: "8px 0 0 0", color: "#facc15" }}>{activeDevicesCount}</h2>
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: "4px" }}>Connected hardware devices</p>
        </article>
      </section>

      {/* Role Breakdown & System Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        
        {/* Role Breakdown Panel */}
        <section className="panel" style={{ cursor: "default" }}>
          <h2>Staff Structure by Role</h2>
          <p className="muted" style={{ marginBottom: "20px" }}>Headcount breakdown across organization roles</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {Object.entries(roleBreakdown).map(([role, count]) => {
              const pct = Math.round((count / activeEmployees.length) * 100);
              return (
                <div key={role}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "0.95rem" }}>
                    <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{role}</span>
                    <span className="muted">{count} members ({pct}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #60a5fa, #c084fc)", borderRadius: "4px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Device Terminal Activity Stream */}
        <section className="panel" style={{ cursor: "default" }}>
          <h2>
            {isSingleEmployee ? `Punch Stream: ${selectedEmployee!.fullName}` : `Terminal Punch Stream (${rangeTitle})`}
          </h2>
          <p className="muted" style={{ marginBottom: "20px" }}>Latest scan events received in this period</p>
          {periodScans.length === 0 ? (
            <p className="muted">No scans recorded for selected filter.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {periodScans.slice(0, 10).map(scan => (
                <li key={scan.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <strong>{scan.employee?.fullName || `Template #${scan.scannerTemplateId}`}</strong>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      Device: {scan.device.name} ({scan.device.location || "Default"})
                    </div>
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "#a7f3d0", fontWeight: 500 }}>
                    {formatDateHeader(scan.serverReceivedAt)} {formatTime(scan.serverReceivedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </main>
  );
}
