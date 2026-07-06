export type SessionUser = {
  employeeId: string;
  email: string;
  isHr: boolean;
  isOwner: boolean;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  // Placeholder: read and verify an HTTP-only session cookie.
  return null;
}
