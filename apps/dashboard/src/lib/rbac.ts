import type { SessionUser } from "./session";

export type Permission = 
  | "my_attendance"
  | "manual_reports"
  | "team_attendance"
  | "approvals"
  | "enrollment"
  | "reports"
  | "company_attendance";

export function hasPermission(user: SessionUser | null, permission: Permission): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: SessionUser | null, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.some((p) => user.permissions.includes(p));
}

export function hasAllPermissions(user: SessionUser | null, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.every((p) => user.permissions.includes(p));
}
