import { getCurrentUser } from "../lib/session";
import { hasPermission, type Permission } from "../lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "./login/actions";
import { createPrismaClient } from "@attendance/db";
import type { Route } from "next";

export const dynamic = "force-dynamic";

const db = createPrismaClient(process.env.DATABASE_URL as string);

const allModules: { name: string; permission: Permission; description: string; href?: string }[] = [
  { name: "My attendance", permission: "my_attendance", description: "View and manage your own daily attendance logs.", href: "/my-attendance" },
  { name: "List all employees", permission: "enrollment", description: "View the complete list of all registered employees and staff details.", href: "/employees" },
  { name: "Team attendance", permission: "team_attendance", description: "Monitor the attendance status of your entire team.", href: "/team-attendance" },
  { name: "Manual requests", permission: "manual_reports", description: "Submit manual requests for missing punches or time-off.", href: "/manual-requests" },
  { name: "Approvals", permission: "approvals", description: "Review and approve pending requests from employees.", href: "/approvals" },
  { name: "Enrollment", permission: "enrollment", description: "Enroll new employees and manage access credentials.", href: "/enrollment" },
  { name: "Reports", permission: "reports", description: "Generate detailed attendance reports for payroll and compliance." },
  { name: "Workdays & Holidays", permission: "reports", description: "Configure weekly off-days and manage official company holidays.", href: "/holidays" },
  { name: "Company Attendance", permission: "company_attendance", description: "Executive organization attendance metrics and real-time punch feeds.", href: "/company-attendance" }
];

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const roleName = user.roleName?.toLowerCase() || "";

  // Filter modules based on user role permissions & role fallback
  const allowedModules = allModules.filter(m => {
    if (m.permission === "approvals") {
      return hasPermission(user, "approvals") || ["manager", "hr", "owner", "admin"].includes(roleName);
    }
    return hasPermission(user, m.permission);
  });

  // Query live pending approvals count for users with approval privileges
  let pendingApprovalsCount = 0;
  const canApprove = hasPermission(user, "approvals") || ["manager", "hr", "owner", "admin"].includes(roleName);

  if (canApprove) {
    if (roleName === "manager") {
      pendingApprovalsCount = await db.manualAttendanceRequest.count({
        where: { status: "PENDING_MANAGER" }
      });
    } else if (roleName === "hr") {
      pendingApprovalsCount = await db.manualAttendanceRequest.count({
        where: { status: "PENDING_HR" }
      });
    } else {
      pendingApprovalsCount = await db.manualAttendanceRequest.count({
        where: { status: { in: ["PENDING_MANAGER", "PENDING_HR"] } }
      });
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Attendance System</h1>
          <p className="muted">
            Welcome back, <strong>{user.fullName}</strong> ({user.roleName})
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="logout-btn">Sign Out</button>
        </form>
      </header>

      <section className="panel-grid" aria-label="Dashboard modules">
        {allowedModules.length === 0 && (
          <p className="muted">You do not have permission to view any modules.</p>
        )}
        {allowedModules.map((module) => {
          const isApprovals = module.permission === "approvals";

          const content = (
            <article className="panel" key={module.name}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h2>{module.name}</h2>
                {isApprovals && pendingApprovalsCount > 0 && (
                  <span style={{
                    background: "rgba(251, 191, 36, 0.2)",
                    color: "#fbbf24",
                    border: "1px solid rgba(251, 191, 36, 0.4)",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    fontWeight: 600
                  }}>
                    {pendingApprovalsCount} Pending
                  </span>
                )}
              </div>
              <p className="muted">{module.description}</p>
            </article>
          );

          if (module.href) {
            return (
              <Link href={module.href as Route} key={module.name} style={{ display: "contents" }}>
                {content}
              </Link>
            );
          }

          return content;
        })}
      </section>
    </main>
  );
}
