import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    redirect: vi.fn(),
    cookies: vi.fn(),
    compareSync: vi.fn(),
    createPrismaClient: vi.fn(),
    signSessionToken: vi.fn(),
    db: {
      employee: {
        findUnique: vi.fn()
      }
    }
  };
});

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("bcryptjs", () => ({ compareSync: mocks.compareSync }));
vi.mock("@attendance/db", () => ({
  createPrismaClient: mocks.createPrismaClient.mockReturnValue(mocks.db)
}));
vi.mock("../../lib/session-token", () => ({ signSessionToken: mocks.signSessionToken }));

import { login, logout } from "./actions";

describe("login actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("returns error if email or password missing", async () => {
      const formData = new FormData();
      formData.append("email", "test@test.com");
      
      const result = await login(null, formData);
      expect(result).toEqual({ error: "Email and password are required." });
    });

    it("returns error if employee not found", async () => {
      const formData = new FormData();
      formData.append("email", "notfound@test.com");
      formData.append("password", "pass123");
      
      mocks.db.employee.findUnique.mockResolvedValue(null);
      
      const result = await login(null, formData);
      expect(result).toEqual({ error: "Invalid email or password." });
    });

    it("returns error if password does not match", async () => {
      const formData = new FormData();
      formData.append("email", "found@test.com");
      formData.append("password", "wrongpass");
      
      mocks.db.employee.findUnique.mockResolvedValue({ passwordHash: "hash" });
      mocks.compareSync.mockReturnValue(false);
      
      const result = await login(null, formData);
      expect(result).toEqual({ error: "Invalid email or password." });
    });

    it("creates session and redirects on success", async () => {
      const formData = new FormData();
      formData.append("email", "owner@test.com");
      formData.append("password", "correctpass");
      
      mocks.db.employee.findUnique.mockResolvedValue({
        id: "emp-1",
        email: "owner@test.com",
        fullName: "Test Owner",
        passwordHash: "hash",
        role: {
          name: "owner",
          permissions: [{ permission: { name: "enrollment" } }]
        }
      });
      mocks.compareSync.mockReturnValue(true);
      mocks.signSessionToken.mockReturnValue("mock-jwt-token");
      
      const mockSet = vi.fn();
      mocks.cookies.mockResolvedValue({ set: mockSet });
      
      await login(null, formData);
      
      expect(mocks.signSessionToken).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith("attendance_session", "mock-jwt-token", expect.any(Object));
      expect(mocks.redirect).toHaveBeenCalledWith("/");
    });
  });

  describe("logout", () => {
    it("deletes session and redirects to login", async () => {
      const mockDelete = vi.fn();
      mocks.cookies.mockResolvedValue({ delete: mockDelete });
      
      await logout();
      
      expect(mockDelete).toHaveBeenCalledWith("attendance_session");
      expect(mocks.redirect).toHaveBeenCalledWith("/login");
    });
  });
});
