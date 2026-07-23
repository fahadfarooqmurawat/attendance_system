"use client";

import { useActionState, useRef, useEffect } from "react";
import { createEmployee, type EnrollmentState } from "./actions";

interface RoleOption {
  id: string;
  name: string;
}

interface ManagerOption {
  id: string;
  fullName: string;
  email: string;
}

interface EnrollmentFormProps {
  roles: RoleOption[];
  managers: ManagerOption[];
}

const initialState: EnrollmentState = {};

export function EnrollmentForm({ roles, managers }: EnrollmentFormProps) {
  const [state, formAction, isPending] = useActionState(createEmployee, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div className="form-panel">
      <div>
        <h2>New Employee Enrollment</h2>
        <p className="muted">Fill out the details below to add a new employee into the system database.</p>
      </div>

      {state.error && (
        <div className="alert-error" role="alert">
          ⚠️ {state.error}
        </div>
      )}

      {state.success && (
        <div className="alert-success" role="status">
          ✅ {state.success}
        </div>
      )}

      <form ref={formRef} action={formAction} className="form-panel" style={{ padding: 0, border: "none", boxShadow: "none" }}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="fullName">Full Name *</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className="form-control"
              placeholder="e.g. Jane Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              placeholder="e.g. jane@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="employeeCode">Employee Code</label>
            <input
              id="employeeCode"
              name="employeeCode"
              type="text"
              className="form-control"
              placeholder="e.g. EMP-105 (Optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Initial Password *</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roleId">Role *</label>
            <select id="roleId" name="roleId" className="form-control" defaultValue="" required>
              <option value="" disabled>Select Employee Role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="managerId">Reports To Manager</label>
            <select id="managerId" name="managerId" className="form-control" defaultValue="">
              <option value="">None / Top Level</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.fullName} ({manager.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="timezone">Timezone</label>
            <input
              id="timezone"
              name="timezone"
              type="text"
              className="form-control"
              defaultValue="Asia/Karachi"
              placeholder="e.g. Asia/Karachi"
            />
          </div>
        </div>

        <div style={{ marginTop: "12px" }}>
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "Enrolling..." : "New Enrollment"}
          </button>
        </div>
      </form>
    </div>
  );
}
