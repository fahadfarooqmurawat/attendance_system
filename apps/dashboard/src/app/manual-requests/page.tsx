import { getCurrentUser } from "../../lib/session";
import { hasPermission } from "../../lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createPrismaClient } from "@attendance/db";
import { logout } from "../login/actions";
import { ManualRequestsContainer } from "./manual-requests-container";
import { deleteManualRequest } from "./actions";

export const dynamic = "force-dynamic";

const db = createPrismaClient(process.env.DATABASE_URL as string);

function formatTimestamp(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(new Date(date));
}

export default async function ManualRequestsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user, "manual_reports")) {
    return (
      <main className="app-shell">
        <div className="banner" style={{ borderColor: "#ef4444" }}>
          <p>Unauthorized: You do not have permission to access Manual Requests.</p>
        </div>
        <Link href="/" className="back-link">← Back to Dashboard</Link>
      </main>
    );
  }

  // Strictly filter requests to ONLY show requests submitted by the authenticated user
  const requests = await db.manualAttendanceRequest.findMany({
    where: {
      OR: [
        { employeeId: user.employeeId },
        { createdByEmployeeId: user.employeeId }
      ]
    },
    include: {
      employee: {
        include: { role: true }
      },
      createdBy: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>My Manual Requests</h1>
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

      {/* Manual Request Form & Trigger */}
      <section>
        <ManualRequestsContainer />
      </section>

      {/* User Submitted Requests Table */}
      <section className="form-panel" style={{ gap: "16px" }}>
        <div>
          <h2>My Submitted Requests ({requests.length})</h2>
          <p className="muted">Track the status of manual punch adjustment requests you have submitted.</p>
        </div>

        <div className="attendance-table-container">
          <table className="directory-table">
            <thead>
              <tr>
                <th>Requested Punch Time</th>
                <th>Reason</th>
                <th>Submitted On</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((req) => {
                  let statusBadgeStyle = {
                    background: "rgba(148, 163, 184, 0.15)",
                    color: "#94a3b8",
                    border: "1px solid rgba(148, 163, 184, 0.3)"
                  };
                  let statusText = req.status.replace("_", " ");

                  if (req.status === "PENDING_MANAGER") {
                    statusText = "Stage 1: Awaiting Manager";
                    statusBadgeStyle = {
                      background: "rgba(251, 191, 36, 0.15)",
                      color: "#fbbf24",
                      border: "1px solid rgba(251, 191, 36, 0.3)"
                    };
                  } else if (req.status === "PENDING_HR") {
                    statusText = "Stage 2: Awaiting HR";
                    statusBadgeStyle = {
                      background: "rgba(192, 132, 252, 0.15)",
                      color: "#c084fc",
                      border: "1px solid rgba(192, 132, 252, 0.3)"
                    };
                  } else if (req.status === "APPROVED") {
                    statusText = "Approved";
                    statusBadgeStyle = {
                      background: "rgba(74, 222, 128, 0.15)",
                      color: "#4ade80",
                      border: "1px solid rgba(74, 222, 128, 0.3)"
                    };
                  } else if (req.status === "REJECTED") {
                    statusText = "Rejected";
                    statusBadgeStyle = {
                      background: "rgba(248, 113, 113, 0.15)",
                      color: "#f87171",
                      border: "1px solid rgba(248, 113, 113, 0.3)"
                    };
                  }

                  return (
                    <tr key={req.id}>
                      <td style={{ color: "#93c5fd", fontWeight: 600 }}>
                        {formatTimestamp(req.requestedTimestamp)}
                      </td>
                      <td>{req.reason}</td>
                      <td className="muted" style={{ fontSize: "0.85rem" }}>
                        {formatTimestamp(req.createdAt)}
                      </td>
                      <td>
                        <span
                          style={{
                            ...statusBadgeStyle,
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            display: "inline-block"
                          }}
                        >
                          {statusText}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <form action={deleteManualRequest} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={req.id} />
                          <button
                            type="submit"
                            style={{
                              background: "rgba(248, 113, 113, 0.15)",
                              color: "#f87171",
                              border: "1px solid rgba(248, 113, 113, 0.3)",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "0.8rem",
                              cursor: "pointer"
                            }}
                          >
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                    You have not submitted any manual requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
