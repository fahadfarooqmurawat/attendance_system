import { getCurrentUser } from "../../lib/session";
import { hasPermission } from "../../lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createPrismaClient } from "@attendance/db";
import { logout } from "../login/actions";
import { EmployeeDirectory, type EmployeeRecord } from "../enrollment/employee-directory";

export const dynamic = "force-dynamic";

const db = createPrismaClient(process.env.DATABASE_URL as string);

export default async function EmployeesListPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // HR or Owner permission check
  if (!hasPermission(user, "enrollment")) {
    return (
      <main className="app-shell">
        <div className="banner" style={{ borderColor: "#ef4444" }}>
          <p>Unauthorized: You do not have permission to view the employee list.</p>
        </div>
        <Link href="/" className="back-link">← Back to Dashboard</Link>
      </main>
    );
  }

  // Fetch all registered employees from database
  const enrolledEmployees = await db.employee.findMany({
    include: {
      role: true,
      manager: true
    },
    orderBy: { fullName: "asc" }
  });

  const employeeRecords: EmployeeRecord[] = enrolledEmployees.map((emp) => ({
    id: emp.id,
    fullName: emp.fullName,
    email: emp.email,
    employeeCode: emp.employeeCode,
    roleName: emp.role?.name || "employee",
    managerName: emp.manager?.fullName || "None",
    timezone: emp.timezone,
    status: emp.status,
    createdAtStr: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(emp.createdAt)
  }));

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Employee Directory & List</h1>
          <p className="muted">
            Viewing all {enrolledEmployees.length} registered employees saved in database
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/enrollment" className="back-link" style={{ borderColor: "rgba(139, 92, 246, 0.4)", color: "#c084fc" }}>
            + Enroll New Employee
          </Link>
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

      <section>
        <EmployeeDirectory employees={employeeRecords} />
      </section>
    </main>
  );
}
