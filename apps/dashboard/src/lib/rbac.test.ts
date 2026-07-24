import { describe, expect, it } from "vitest";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "./rbac";
import type { SessionUser } from "./session";

const mockUser: SessionUser = {
  email: "test@example.com",
  fullName: "Test User",
  employeeId: "emp-1",
  roleName: "manager",
  permissions: ["team_attendance", "approvals"]
};

describe("rbac", () => {
  describe("hasPermission", () => {
    it("returns false if user is null", () => {
      expect(hasPermission(null, "team_attendance")).toBe(false);
    });

    it("returns true if user has the permission", () => {
      expect(hasPermission(mockUser, "team_attendance")).toBe(true);
    });

    it("returns false if user does not have the permission", () => {
      expect(hasPermission(mockUser, "reports")).toBe(false);
    });

    it("verifies owner and hr have company_attendance permission whereas manager and employee do not", () => {
      const ownerUser: SessionUser = { ...mockUser, roleName: "owner", permissions: ["my_attendance", "manual_reports", "enrollment", "reports", "company_attendance"] };
      const hrUser: SessionUser = { ...mockUser, roleName: "hr", permissions: ["my_attendance", "manual_reports", "enrollment", "reports", "company_attendance"] };
      const managerUser: SessionUser = { ...mockUser, roleName: "manager", permissions: ["my_attendance", "manual_reports", "team_attendance", "approvals"] };
      const employeeUser: SessionUser = { ...mockUser, roleName: "employee", permissions: ["my_attendance", "manual_reports"] };

      expect(hasPermission(ownerUser, "company_attendance")).toBe(true);
      expect(hasPermission(hrUser, "company_attendance")).toBe(true);
      expect(hasPermission(managerUser, "company_attendance")).toBe(false);
      expect(hasPermission(employeeUser, "company_attendance")).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns false if user is null", () => {
      expect(hasAnyPermission(null, ["team_attendance", "reports"])).toBe(false);
    });

    it("returns true if user has at least one of the permissions", () => {
      expect(hasAnyPermission(mockUser, ["team_attendance", "reports"])).toBe(true);
    });

    it("returns false if user has none of the permissions", () => {
      expect(hasAnyPermission(mockUser, ["reports", "enrollment"])).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns false if user is null", () => {
      expect(hasAllPermissions(null, ["team_attendance", "approvals"])).toBe(false);
    });

    it("returns true if user has all of the permissions", () => {
      expect(hasAllPermissions(mockUser, ["team_attendance", "approvals"])).toBe(true);
    });

    it("returns false if user is missing one of the permissions", () => {
      expect(hasAllPermissions(mockUser, ["team_attendance", "reports"])).toBe(false);
    });
  });
});
