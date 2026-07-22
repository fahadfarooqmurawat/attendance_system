import { getCurrentUser } from "../lib/session";
import { hasPermission, type Permission } from "../lib/rbac";
import { redirect } from "next/navigation";
import { logout } from "./login/actions";

// Authentication depends on request cookies and must only run at request time.
export const dynamic = "force-dynamic";

const allModules: { name: string; permission: Permission; description: string }[] = [
  { name: "My attendance", permission: "my_attendance", description: "View and manage your own daily attendance logs." },
  { name: "Team attendance", permission: "team_attendance", description: "Monitor the attendance status of your entire team." },
  { name: "Manual requests", permission: "manual_reports", description: "Submit manual requests for missing punches or time-off." },
  { name: "Approvals", permission: "approvals", description: "Review and approve pending requests from employees." },
  { name: "Enrollment", permission: "enrollment", description: "Enroll new devices and manage employee access credentials." },
  { name: "Reports", permission: "reports", description: "Generate detailed attendance reports for payroll and compliance." },
  { name: "Company Attendance", permission: "company_attendance", description: "View high-level attendance metrics across the entire organization." }
];

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const allowedModules = allModules.filter(m => hasPermission(user, m.permission));

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
        {allowedModules.map((module) => (
          <article className="panel" key={module.name}>
            <h2>{module.name}</h2>
            <p className="muted">{module.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
