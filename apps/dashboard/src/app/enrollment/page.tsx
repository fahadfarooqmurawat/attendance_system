import { getCurrentUser } from "../../lib/session";
import { hasPermission } from "../../lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createPrismaClient } from "@attendance/db";
import { logout } from "../login/actions";
import { EnrollmentForm } from "./enrollment-form";
import { EmployeeDirectory, type EmployeeRecord } from "./employee-directory";

export const dynamic = "force-dynamic";

const db = createPrismaClient(process.env.DATABASE_URL as string);

export default async function EnrollmentPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user, "enrollment")) {
    return (
      <main className="app-shell">
        <div className="banner" style={{ borderColor: "#ef4444" }}>
          <p>Unauthorized: Only HR staff and Owners have access to Employee Enrollment.</p>
        </div>
        <Link href="/" className="back-link">← Back to Dashboard</Link>
      </main>
    );
  }

  // Fetch roles and potential managers for the form dropdowns
  const roles = await db.role.findMany({
    orderBy: { name: "asc" }
  });

  const potentialManagers = await db.employee.findMany({
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: "asc" }
  });

  // Fetch all enrolled employees for the directory table
  const enrolledEmployees = await db.employee.findMany({
    include: {
      role: true,
      manager: true
    },
    orderBy: { createdAt: "desc" }
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
          <h1>HR Employee Enrollment & Directory</h1>
          <p className="muted">
            Logged in as <strong>{user.fullName}</strong> ({user.roleName})
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

      {/* Enrollment Form */}
      <section>
        <EnrollmentForm
          roles={roles.map((r) => ({ id: r.id, name: r.name }))}
          managers={potentialManagers}
        />
      </section>

      {/* Enrolled Employees Directory Table with Live Search */}
      <section>
        <EmployeeDirectory employees={employeeRecords} />
      </section>
    </main>
  );
}
