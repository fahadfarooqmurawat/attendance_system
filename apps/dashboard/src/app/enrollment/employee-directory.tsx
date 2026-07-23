"use client";

import { useState } from "react";

export interface EmployeeRecord {
  id: string;
  fullName: string;
  email: string;
  employeeCode: string | null;
  roleName: string;
  managerName: string;
  timezone: string;
  status: string;
  createdAtStr: string;
}

interface EmployeeDirectoryProps {
  employees: EmployeeRecord[];
}

export function EmployeeDirectory({ employees }: EmployeeDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === "all" || emp.roleName.toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const roleCounts = {
    total: employees.length,
    owner: employees.filter((e) => e.roleName.toLowerCase() === "owner").length,
    hr: employees.filter((e) => e.roleName.toLowerCase() === "hr").length,
    manager: employees.filter((e) => e.roleName.toLowerCase() === "manager").length,
    employee: employees.filter((e) => e.roleName.toLowerCase() === "employee").length
  };

  return (
    <div className="form-panel" style={{ gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2>All Enrolled Employees ({employees.length})</h2>
          <p className="muted">Complete directory of all registered staff saved in PostgreSQL database.</p>
        </div>

        {/* Quick Role Stats Badges */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span className="role-badge owner" title="Owners count">
            Owner: {roleCounts.owner}
          </span>
          <span className="role-badge hr" title="HR count">
            HR: {roleCounts.hr}
          </span>
          <span className="role-badge manager" title="Managers count">
            Managers: {roleCounts.manager}
          </span>
          <span className="role-badge employee" title="Employees count">
            Employees: {roleCounts.employee}
          </span>
        </div>
      </div>

      {/* Search & Role Filter Bar */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: "1", minWidth: "240px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search by name, email, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ width: "180px" }}>
          <select
            className="form-control"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="hr">HR</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>
      </div>

      {/* Employee Directory Table */}
      <div className="attendance-table-container">
        <table className="directory-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Employee Code</th>
              <th>Role</th>
              <th>Reports To</th>
              <th>Timezone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 600 }}>{emp.fullName}</td>
                  <td>{emp.email}</td>
                  <td className="muted">{emp.employeeCode || "-"}</td>
                  <td>
                    <span className={`role-badge ${emp.roleName.toLowerCase() || "employee"}`}>
                      {emp.roleName}
                    </span>
                  </td>
                  <td className="muted">{emp.managerName}</td>
                  <td className="muted" style={{ fontSize: "0.85rem" }}>
                    {emp.timezone}
                  </td>
                  <td>
                    <span
                      style={{
                        color: emp.status === "ACTIVE" ? "#34d399" : "#fca5a5",
                        fontSize: "0.85rem",
                        fontWeight: 600
                      }}
                    >
                      ● {emp.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                  No employees found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
