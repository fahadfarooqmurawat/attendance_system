import { getCurrentUser } from "../../lib/session";
import { hasPermission } from "../../lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createPrismaClient } from "@attendance/db";
import type { Prisma } from "@attendance/db";
import { logout } from "../login/actions";
import { ManualRequestsContainer } from "./manual-requests-container";
import { RequestActionsClient } from "./request-actions-client";

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

  const isOwner = user.roleName === "owner";
  const isHR = user.roleName === "hr";
  const isManager = user.roleName === "manager";
  const isReviewer = isOwner || isHR || isManager;

  // Role-based visibility filter for requests:
  // - Manager: sees employee requests + own requests (excludes HR & Owner requests)
  // - HR: sees employee requests, manager requests + own requests
  // - Owner: sees all requests (including HR requests awaiting Owner approval)
  // - Employee: sees only own requests
  let whereClause: Prisma.ManualAttendanceRequestWhereInput = { employeeId: user.employeeId };

  if (isOwner) {
    whereClause = {};
  } else if (isHR) {
    whereClause = {
      OR: [
        { employeeId: user.employeeId },
        { employee: { role: { name: { in: ["employee", "manager"] } } } }
      ]
    };
  } else if (isManager) {
    whereClause = {
      OR: [
        { employeeId: user.employeeId },
        { employee: { role: { name: "employee" } } }
      ]
    };
  }

  const requests = await db.manualAttendanceRequest.findMany({
    where: whereClause,
    include: {
      employee: {
        include: { role: true }
      },
      createdBy: true
    },
    orderBy: { createdAt: "desc" }
  });

  let subtitleText = "Track the status of your submitted missing punch requests.";
  if (isOwner) {
    subtitleText = "Review HR requests and monitor all attendance requests across the organization.";
  } else if (isHR) {
    subtitleText = "Review and complete final approval (Stage 2) for missing punch requests.";
  } else if (isManager) {
    subtitleText = "Review and complete initial 1st stage approval for missing punch requests.";
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Manual Attendance Requests</h1>
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

      {/* Manual Request Pop-up Trigger & Form Container */}
      <section>
        <ManualRequestsContainer />
      </section>

      {/* Requests Directory Table */}
      <section className="form-panel" style={{ gap: "16px" }}>
        <div>
          <h2>Submitted Attendance Requests ({requests.length})</h2>
          <p className="muted">{subtitleText}</p>
        </div>

        <div className="attendance-table-container">
          <table className="directory-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Requested Punch Time</th>
                <th>Reason</th>
                <th>Submitted On</th>
                <th>Status</th>
                {isReviewer && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((req) => {
                  const targetRoleName = req.employee.role?.name;
                  const isHRRequest = targetRoleName === "hr";
                  const isSelf = user.employeeId === req.employeeId || user.employeeId === req.createdByEmployeeId;

                  let canApproveThisRow = false;
                  let statusDisplay = req.status.replace("_", " ");
                  let awaitingText = "";

                  if (req.status === "PENDING_MANAGER") {
                    statusDisplay = "PENDING 1ST APPROVAL (MANAGER)";
                    awaitingText = "Awaiting Manager Approval";
                    if (!isSelf && (isManager || isHR || isOwner)) {
                      canApproveThisRow = true;
                    }
                  } else if (req.status === "PENDING_HR") {
                    if (isHRRequest) {
                      statusDisplay = "PENDING OWNER APPROVAL";
                      awaitingText = "Requires Owner Approval";
                      if (isOwner) {
                        canApproveThisRow = true;
                      }
                    } else {
                      statusDisplay = "PENDING 2ND APPROVAL (HR)";
                      awaitingText = "Awaiting HR Approval";
                      if (!isSelf && (isHR || isOwner)) {
                        canApproveThisRow = true;
                      }
                    }
                  }

                  return (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 600 }}>{req.employee.fullName}</td>
                      <td style={{ color: "#93c5fd", fontWeight: 500 }}>
                        {formatTimestamp(req.requestedTimestamp)}
                      </td>
                      <td>{req.reason}</td>
                      <td className="muted" style={{ fontSize: "0.85rem" }}>
                        {formatTimestamp(req.createdAt)}
                      </td>
                      <td>
                        <span className={`status-badge ${req.status.toLowerCase()}`}>
                          {statusDisplay}
                        </span>
                      </td>
                      {isReviewer && (
                        <td>
                          {canApproveThisRow ? (
                            <RequestActionsClient requestId={req.id} status={req.status} />
                          ) : req.status === "APPROVED" || req.status === "REJECTED" ? (
                            <span className="muted" style={{ fontSize: "0.85rem" }}>—</span>
                          ) : (
                            <span className="muted" style={{ fontSize: "0.85rem", fontStyle: "italic" }}>
                              {awaitingText}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isReviewer ? 6 : 5} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                    No manual attendance requests found.
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
