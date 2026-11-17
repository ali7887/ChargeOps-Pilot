import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  requireRole,
  AuthError,
  getAuthenticatedUser,
  type AuthUser,
} from "../lib/auth";
import { createAdminClient } from "../lib/supabase/admin";

describe("Phase 3: Authentication, RBAC, and Security Boundaries", () => {
  const adminUser: AuthUser = {
    id: "user-admin-001",
    email: "admin@chargeops.internal",
    role: "admin",
  };

  const viewerUser: AuthUser = {
    id: "user-viewer-001",
    email: "viewer@chargeops.internal",
    role: "viewer",
  };

  describe("1. Role-Based Access Control (RBAC)", () => {
    it("allows admin user to access admin-level operations", () => {
      expect(() => requireRole(adminUser, "admin")).not.toThrow();
    });

    it("allows admin user to access viewer-level operations", () => {
      expect(() => requireRole(adminUser, "viewer")).not.toThrow();
    });

    it("allows viewer user to access viewer-level operations", () => {
      expect(() => requireRole(viewerUser, "viewer")).not.toThrow();
    });

    it("strictly blocks viewer user from performing admin operations with 403 Forbidden", () => {
      expect(() => requireRole(viewerUser, "admin")).toThrow(AuthError);
      try {
        requireRole(viewerUser, "admin");
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect((err as AuthError).statusCode).toBe(403);
      }
    });
  });

  describe("2. Server-side Role Resolution & Authentication", () => {
    it("returns null when user is unauthenticated or has invalid session", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Auth session missing" },
          }),
        },
        from: vi.fn(),
      } as any;

      const user = await getAuthenticatedUser(mockSupabase);
      expect(user).toBeNull();
    });

    it("resolves role strictly from profiles table, ignoring client claims", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-test-123",
                email: "test@chargeops.internal",
                user_metadata: { role: "admin" }, // Attacker trying to claim admin via metadata
              },
            },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "viewer" }, // Real database record says viewer
                error: null,
              }),
            }),
          }),
        }),
      } as any;

      const user = await getAuthenticatedUser(mockSupabase);
      expect(user).not.toBeNull();
      // Must resolve to 'viewer' from the DB, not 'admin' from metadata
      expect(user?.role).toBe("viewer");
    });
  });

  describe("3. Security Boundaries & Secret Protection", () => {
    it("blocks instantiation of admin service role client in browser context", () => {
      // Simulate browser window
      (globalThis as any).window = {};
      try {
        expect(() => createAdminClient()).toThrow("Security Violation");
      } finally {
        delete (globalThis as any).window;
      }
    });

    it("ensures SERVICE_ROLE_KEY is not prefixed with NEXT_PUBLIC_", () => {
      // Ensures the service role key cannot be leaked to the client bundle by Next.js
      expect(process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    });
  });
});
