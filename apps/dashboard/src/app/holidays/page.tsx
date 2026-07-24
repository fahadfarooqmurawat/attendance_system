import { getCurrentUser } from "../../lib/session";
import { hasPermission } from "../../lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createPrismaClient } from "@attendance/db";
import { logout } from "../login/actions";
import { createHoliday, deleteHoliday, updateWeeklyOffDays } from "./actions";

export const dynamic = "force-dynamic";

const db = createPrismaClient(process.env.DATABASE_URL as string);

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function HolidaysPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.roleName?.toLowerCase();
  const isAuthorized =
    hasPermission(user, "company_attendance") ||
    hasPermission(user, "reports") ||
    hasPermission(user, "enrollment") ||
    role === "owner" ||
    role === "hr" ||
    role === "admin";

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
            Holiday and Workday Policy management is restricted exclusively to <strong>Owner</strong> and <strong>HR</strong> managers.
          </p>
        </div>
      </main>
    );
  }

  // 1. Fetch current weekly off-days setting
  const offDaysSetting = await db.companySetting.findUnique({
    where: { key: "weekly_off_days" }
  });

  const offDaysArray: number[] = Array.isArray(offDaysSetting?.value) ? (offDaysSetting.value as number[]) : [0];

  let currentOffDaysType = "custom";
  if (offDaysArray.length === 1 && offDaysArray[0] === 0) {
    currentOffDaysType = "sun_only";
  } else if (offDaysArray.length === 2 && offDaysArray.includes(0) && offDaysArray.includes(6)) {
    currentOffDaysType = "sat_sun";
  } else if (offDaysArray.length === 2 && offDaysArray.includes(5) && offDaysArray.includes(6)) {
    currentOffDaysType = "fri_sat";
  } else if (offDaysArray.length === 1 && offDaysArray[0] === 5) {
    currentOffDaysType = "fri_only";
  }

  // Active off-days text summary
  const activeOffDaysNames = offDaysArray.map(d => weekdayNames[d]).join(", ");

  // 2. Fetch all registered holidays
  const holidays = await db.holiday.findMany({
    orderBy: { date: "asc" }
  });

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <Link href="/" className="back-link">← Dashboard</Link>
          </div>
          <h1>Workday Policy & Company Holidays</h1>
          <p className="muted">
            Configure weekly off-days, hybrid schedules, and official holiday exemptions
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="logout-btn">Sign Out</button>
        </form>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
        
        {/* Weekly Off-Days Policy Card */}
        <section className="panel" style={{ cursor: "default" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h2>Weekly Off-Days Policy</h2>
            <span style={{
              background: "rgba(96, 165, 250, 0.15)",
              color: "#60a5fa",
              border: "1px solid rgba(96, 165, 250, 0.3)",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 600
            }}>Active: {activeOffDaysNames || "None"}</span>
          </div>
          <p className="muted" style={{ marginBottom: "20px" }}>
            Define company weekly off-days (employees without scans on off-days are marked as <strong>WEEKEND</strong> instead of <strong>ABSENT</strong>).
          </p>

          <form action={updateWeeklyOffDays} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="offDaysType"
                  value="sun_only"
                  defaultChecked={currentOffDaysType === "sun_only"}
                />
                <div>
                  <strong>Sunday Only</strong>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>Mon–Sat workdays (6 days work / 1 day off)</div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="offDaysType"
                  value="sat_sun"
                  defaultChecked={currentOffDaysType === "sat_sun"}
                />
                <div>
                  <strong>Saturday & Sunday</strong>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>Mon–Fri workdays (5 days work / 2 days off)</div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="offDaysType"
                  value="fri_sat"
                  defaultChecked={currentOffDaysType === "fri_sat"}
                />
                <div>
                  <strong>Friday & Saturday</strong>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>Sun–Thu workdays (Middle East policy)</div>
                </div>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="offDaysType"
                  value="fri_only"
                  defaultChecked={currentOffDaysType === "fri_only"}
                />
                <div>
                  <strong>Friday Only</strong>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>Sat–Thu workdays</div>
                </div>
              </label>

              {/* Custom / Hybrid Option */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", marginTop: "4px" }}>
                <input
                  type="radio"
                  name="offDaysType"
                  value="custom"
                  defaultChecked={currentOffDaysType === "custom"}
                  style={{ marginTop: "4px" }}
                />
                <div style={{ flex: 1 }}>
                  <strong>Custom / Hybrid Schedule</strong>
                  <div className="muted" style={{ fontSize: "0.8rem", marginBottom: "8px" }}>Select specific off-days for hybrid work models:</div>

                  {/* Days Selection Grid */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                    gap: "8px",
                    background: "rgba(255,255,255,0.03)",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)"
                  }}>
                    {weekdayNames.map((dayName, idx) => (
                      <label key={dayName} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          name="customDays"
                          value={idx}
                          defaultChecked={offDaysArray.includes(idx)}
                        />
                        <span>{dayName.slice(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </label>
            </div>

            <button type="submit" style={{
              marginTop: "8px",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 18px",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer"
            }}>
              Save Workday Policy
            </button>
          </form>
        </section>

        {/* Add Official Holiday Card */}
        <section className="panel" style={{ cursor: "default" }}>
          <h2>Add Official Company Holiday</h2>
          <p className="muted" style={{ marginBottom: "20px" }}>
            Add specific holiday dates (employees without scans on holiday dates are marked as <strong>HOLIDAY</strong>).
          </p>

          <form action={createHoliday} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label htmlFor="name" className="muted" style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px" }}>Holiday Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Eid-ul-Fitr, New Year's Day"
                required
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  color: "#fff",
                  padding: "10px",
                  borderRadius: "8px"
                }}
              />
            </div>

            <div>
              <label htmlFor="date" className="muted" style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px" }}>Date</label>
              <input
                id="date"
                name="date"
                type="date"
                required
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  color: "#fff",
                  padding: "10px",
                  borderRadius: "8px"
                }}
              />
            </div>

            <div>
              <label htmlFor="description" className="muted" style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px" }}>Description (Optional)</label>
              <input
                id="description"
                name="description"
                type="text"
                placeholder="Short note or description"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  color: "#fff",
                  padding: "10px",
                  borderRadius: "8px"
                }}
              />
            </div>

            <button type="submit" style={{
              marginTop: "8px",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 18px",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer"
            }}>
              + Add Holiday Date
            </button>
          </form>
        </section>

      </div>

      {/* Official Holidays List Table */}
      <section className="panel" style={{ cursor: "default", marginTop: "24px", display: "block" }}>
        <h2>Official Company Holidays ({holidays.length})</h2>
        <p className="muted" style={{ marginBottom: "20px" }}>Registered holiday dates and exemptions</p>

        {holidays.length === 0 ? (
          <p className="muted">No holidays added yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>Holiday Name</th>
                  <th style={{ padding: "12px 16px" }}>Date</th>
                  <th style={{ padding: "12px 16px" }}>Description</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((h) => (
                  <tr key={h.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <strong>{h.name}</strong>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#60a5fa" }}>{formatDate(h.date)}</td>
                    <td style={{ padding: "14px 16px" }} className="muted">{h.description || "—"}</td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <form action={deleteHoliday} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={h.id} />
                        <button type="submit" style={{
                          background: "rgba(248, 113, 113, 0.15)",
                          color: "#f87171",
                          border: "1px solid rgba(248, 113, 113, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          cursor: "pointer"
                        }}>
                          Delete
                        </button>
                      </form>
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
