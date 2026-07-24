"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import type { Route } from "next";

export type SimpleEmployee = {
  id: string;
  fullName: string;
  roleName: string;
};

export function CompanyRangeFilter({
  currentRange,
  currentEmployeeId,
  employees
}: {
  currentRange: string;
  currentEmployeeId: string;
  employees: SimpleEmployee[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}` as Route);
  };

  const selectStyle = {
    background: "rgba(255, 255, 255, 0.08)",
    color: "#f8fafc",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "0.88rem",
    fontWeight: 500,
    outline: "none",
    cursor: "pointer",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)"
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
      {/* Time Period Dropdown */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label htmlFor="range-select" className="muted" style={{ fontSize: "0.85rem", fontWeight: 500 }}>
          Period:
        </label>
        <select
          id="range-select"
          value={currentRange}
          onChange={(e) => handleFilterChange("range", e.target.value)}
          style={selectStyle}
        >
          <option value="today" style={{ background: "#1e1b4b", color: "#fff" }}>Last Day / Today</option>
          <option value="last_week" style={{ background: "#1e1b4b", color: "#fff" }}>Last Week (7 Days)</option>
          <option value="last_month" style={{ background: "#1e1b4b", color: "#fff" }}>Last Month (30 Days)</option>
          <option value="all_time" style={{ background: "#1e1b4b", color: "#fff" }}>All Time</option>
        </select>
      </div>

      {/* Employee Filter Dropdown */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label htmlFor="employee-select" className="muted" style={{ fontSize: "0.85rem", fontWeight: 500 }}>
          Employee:
        </label>
        <select
          id="employee-select"
          value={currentEmployeeId || "all"}
          onChange={(e) => handleFilterChange("employeeId", e.target.value)}
          style={selectStyle}
        >
          <option value="all" style={{ background: "#1e1b4b", color: "#fff" }}>All Employees</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id} style={{ background: "#1e1b4b", color: "#fff" }}>
              {emp.fullName} ({emp.roleName})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
