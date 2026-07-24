import { getCurrentUser } from "../../lib/session";
import { hasPermission } from "../../lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createPrismaClient } from "@attendance/db";
import type { Prisma } from "@attendance/db";
import { logout } from "../login/actions";
import { ApprovalActionsClient } from "./approval-actions-client";

export const dynamic = "force-dynamic";

const db = createPrismaClient(process.env.DATABASE_URL as string);

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

export default async function ApprovalsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isAuthorized =
    hasPermission(user, "approvals") ||
    user.roleName === "manager" ||
    user.roleName === "hr" ||
    user.roleName === "owner";

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
          <h2>Approver Privilege Required</h2>
          <p className="muted" style={{ marginTop: "8px" }}>
            The Approvals portal is restricted to Managers, HR, and Company Owners.
          </p>
        </div>
      </main>
    );
  }

  // Filter requests specifically relevant to the logged-in approver:
  // - Manager: sees PENDING_MANAGER requests awaiting Stage 1 approval, plus team requests
  // - HR: sees PENDING_HR requests awaiting Stage 2 approval, plus approved/rejected history (excludes PENDING_MANAGER)
  // - Owner: sees all requests
  let whereClause: Prisma.ManualAttendanceRequestWhereInput = {};

  if (user.roleName === "manager") {
    whereClause = {
      OR: [
        { status: "PENDING_MANAGER" },
        {
          status: { in: ["PENDING_HR", "APPROVED", "REJECTED"] },
          employee: { managerId: user.employeeId }
        }
      ]
    };
  } else if (user.roleName === "hr") {
    whereClause = {
      status: { in: ["PENDING_HR", "APPROVED", "REJECTED"] }
    };
  } else if (user.roleName === "owner") {
    whereClause = {};
  }

  const requests = await db.manualAttendanceRequest.findMany({
    where: whereClause,
    include: {
      employee: {
        include: { role: true, manager: true }
      },
      createdBy: {
        include: { role: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const pendingManagerCount = requests.filter(r => r.status === "PENDING_MANAGER").length;
  const pendingHrCount = requests.filter(r => r.status === "PENDING_HR").length;
  const approvedCount = requests.filter(r => r.status === "APPROVED").length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <Link href="/" className="back-link">← Dashboard</Link>
          </div>
          <h1>Attendance Request Approvals</h1>
          <p className="muted">
            Reviewing requests assigned to <strong>{user.fullName}</strong> ({user.roleName})
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="logout-btn">Sign Out</button>
        </form>
      </header>

      {/* KPI Overview Grid */}
      <section className="panel-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <article className="panel" style={{ cursor: "default", padding: "20px 24px" }}>
          <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Relevant Requests</p>
          <h2 style={{ fontSize: "2.2rem", margin: "8px 0 0 0", color: "#60a5fa" }}>{requests.length}</h2>
        </article>
        {user.roleName !== "hr" && (
          <article className="panel" style={{ cursor: "default", padding: "20px 24px" }}>
            <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stage 1: Awaiting Manager</p>
            <h2 style={{ fontSize: "2.2rem", margin: "8px 0 0 0", color: "#fbbf24" }}>{pendingManagerCount}</h2>
          </article>
        )}
        {(user.roleName === "hr" || user.roleName === "owner") && (
          <article className="panel" style={{ cursor: "default", padding: "20px 24px" }}>
            <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stage 2: Awaiting HR</p>
            <h2 style={{ fontSize: "2.2rem", margin: "8px 0 0 0", color: "#c084fc" }}>{pendingHrCount}</h2>
          </article>
        )}
        <article className="panel" style={{ cursor: "default", padding: "20px 24px" }}>
          <p className="muted" style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Approved History</p>
          <h2 style={{ fontSize: "2.2rem", margin: "8px 0 0 0", color: "#4ade80" }}>{approvedCount}</h2>
        </article>
      </section>

      {/* Requests Table */}
      <section className="panel" style={{ cursor: "default", display: "block" }}>
        <h2>Assigned Approvals ({requests.length})</h2>
        <p className="muted" style={{ marginBottom: "20px" }}>
          {user.roleName === "hr"
            ? "Showing Stage 2 requests ready for HR approval & processed history"
            : user.roleName === "manager"
            ? "Showing Stage 1 requests awaiting Manager approval & team history"
            : "Showing all organization approval requests"}
        </p>

        {requests.length === 0 ? (
          <p className="muted">No pending or completed approvals found for your role.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>Employee</th>
                  <th style={{ padding: "12px 16px" }}>Punch Details</th>
                  <th style={{ padding: "12px 16px" }}>Reason</th>
                  <th style={{ padding: "12px 16px" }}>Approval Stage</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <strong>{req.employee.fullName}</strong>
                      <div className="muted" style={{ fontSize: "0.85rem" }}>
                        {req.employee.email} ({req.employee.role?.name || "employee"})
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontWeight: 600, color: "#60a5fa" }}>
                        {req.requestedTimestamp ? formatDate(new Date(req.requestedTimestamp)) : "N/A"}
                      </span>
                      <div className="muted" style={{ fontSize: "0.8rem" }}>Type: {req.type}</div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "0.9rem" }}>{req.reason}</span>
                      <div className="muted" style={{ fontSize: "0.8rem" }}>
                        Submitted: {formatDate(new Date(req.createdAt))}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      {req.status === "PENDING_MANAGER" && (
                        <span style={{
                          background: "rgba(251, 191, 36, 0.15)",
                          color: "#fbbf24",
                          border: "1px solid rgba(251, 191, 36, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}>
                          Stage 1: Awaiting Manager
                        </span>
                      )}
                      {req.status === "PENDING_HR" && (
                        <span style={{
                          background: "rgba(192, 132, 252, 0.15)",
                          color: "#c084fc",
                          border: "1px solid rgba(192, 132, 252, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}>
                          Stage 2: Awaiting HR
                        </span>
                      )}
                      {req.status === "APPROVED" && (
                        <span style={{
                          background: "rgba(74, 222, 128, 0.15)",
                          color: "#4ade80",
                          border: "1px solid rgba(74, 222, 128, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}>
                          Approved
                        </span>
                      )}
                      {req.status === "REJECTED" && (
                        <span style={{
                          background: "rgba(248, 113, 113, 0.15)",
                          color: "#f87171",
                          border: "1px solid rgba(248, 113, 113, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}>
                          Rejected
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <ApprovalActionsClient
                        requestId={req.id}
                        status={req.status}
                      />
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
