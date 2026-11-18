import { describe, it, expect, vi } from "vitest";
import {
  requireAuth,
  requireRole,
  AuthError,
  getAuthenticatedUser,
  assignUserRole,
  type AuthUser,
} from "../lib/auth";
import { createAdminClient } from "../lib/supabase/admin";
import { isSectionActive, type RunbookSection } from "../lib/retrieval";
import fs from "node:fs";
import path from "node:path";

describe("Database Privileges & Application Access Control Regression Suite", () => {
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

  // 1. Anonymous users cannot access protected table data
  describe("1. Anonymous User Access Block", () => {
    it("strictly blocks anonymous users with 401 Unauthorized when session is missing", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "No active session" },
          }),
        },
        from: vi.fn(),
      } as any;

      await expect(requireAuth(mockSupabase)).rejects.toThrow(AuthError);
      try {
        await requireAuth(mockSupabase);
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect((err as AuthError).statusCode).toBe(401);
      }
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  // 2. Authenticated users can read only their own profile
  describe("2. Profile Access Isolation (Users can read own profile)", () => {
    it("queries profiles table exclusively matching auth.uid()", async () => {
      const eqMock = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: "viewer" },
          error: null,
        }),
      });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-current-123", email: "user@test.internal" } },
            error: null,
          }),
        },
        from: fromMock,
      } as any;

      const user = await getAuthenticatedUser(mockSupabase);

      expect(user).not.toBeNull();
      expect(fromMock).toHaveBeenCalledWith("profiles");
      expect(selectMock).toHaveBeenCalledWith("role");
      // Must query strictly user_id = auth.uid()
      expect(eqMock).toHaveBeenCalledWith("user_id", "user-current-123");
    });
  });

  // 3. Authenticated users can read permitted synthetic charging events
  describe("3. Permitted Synthetic Charging Events Read", () => {
    it("allows authenticated users with viewer or admin role to read charging events", () => {
      // Both viewer and admin satisfy the role condition for viewing charging events
      expect(() => requireRole(viewerUser, "viewer")).not.toThrow();
      expect(() => requireRole(adminUser, "viewer")).not.toThrow();
    });
  });

  // 4. Authenticated users can read only active/effective runbook sections
  describe("4. Runbook Section Status & Validity Filter", () => {
    const fixedNow = new Date("2026-11-18T12:00:00Z");

    it("accepts active runbook sections within validity window", () => {
      const activeSection: RunbookSection = {
        doc_id: "RB-SYN-001",
        version: "v1.2",
        section_id: "SEC-TIMEOUT",
        title: "Timeout Runbook",
        content: "Procedure...",
        error_codes: ["E_SYN_TIMEOUT"],
        status: "active",
        effective_from: "2026-01-01T00:00:00Z",
        effective_to: null,
        synthetic: true,
      };

      expect(isSectionActive(activeSection, fixedNow)).toBe(true);
    });

    it("rejects deprecated runbook sections", () => {
      const deprecatedSection: RunbookSection = {
        doc_id: "RB-SYN-004",
        version: "v0.9",
        section_id: "SEC-DEPRECATED",
        title: "Deprecated Runbook",
        content: "Outdated...",
        error_codes: ["E_SYN_OLD_LIMIT"],
        status: "deprecated",
        effective_from: "2025-01-01T00:00:00Z",
        effective_to: "2025-12-31T23:59:59Z",
        synthetic: true,
      };

      expect(isSectionActive(deprecatedSection, fixedNow)).toBe(false);
    });

    it("rejects expired runbook sections even if marked active", () => {
      const expiredSection: RunbookSection = {
        doc_id: "RB-SYN-005",
        version: "v1.0",
        section_id: "SEC-EXPIRED",
        title: "Expired Runbook",
        content: "Old...",
        error_codes: ["E_SYN_EXPIRED"],
        status: "active",
        effective_from: "2025-01-01T00:00:00Z",
        effective_to: "2026-01-01T00:00:00Z", // Past date
        synthetic: true,
      };

      expect(isSectionActive(expiredSection, fixedNow)).toBe(false);
    });
  });

  // 5. Non-admin users cannot access admin user-management APIs
  describe("5. Admin User Management Protection", () => {
    it("strictly rejects non-admin users attempting admin operations with 403", () => {
      expect(() => requireRole(viewerUser, "admin")).toThrow(AuthError);
      try {
        requireRole(viewerUser, "admin");
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect((err as AuthError).statusCode).toBe(403);
      }
    });
  });

  // 6. Admin users can still list and manage users through server-side Service Role operations
  describe("6. Admin Service Role Operations", () => {
    it("allows admin to perform role assignment via service role client", async () => {
      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      const fromMock = vi.fn().mockReturnValue({ upsert: upsertMock });

      const originalEnv = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key-mock";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";

      // Mock createClient from @supabase/supabase-js
      const adminModule = await import("../lib/supabase/admin");
      const spy = vi.spyOn(adminModule, "createAdminClient").mockReturnValue({
        from: fromMock,
      } as any);

      await expect(assignUserRole("target-user-456", "viewer")).resolves.not.toThrow();
      expect(fromMock).toHaveBeenCalledWith("profiles");
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "target-user-456",
          role: "viewer",
        })
      );

      spy.mockRestore();
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv;
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    });
  });

  // 7. Audit-event visibility remains restricted to admins
  describe("7. Audit-Event Admin-Only Visibility", () => {
    it("enforces admin-only authorization for audit events", () => {
      // Admin authorized
      expect(() => requireRole(adminUser, "admin")).not.toThrow();

      // Viewer strictly rejected
      expect(() => requireRole(viewerUser, "admin")).toThrow(AuthError);
    });
  });

  // 8. No client-side code imports or exposes the Service Role client
  describe("8. Service Role Secret Isolation & Client Boundary", () => {
    it("throws a Security Violation if createAdminClient is called in browser window context", () => {
      (globalThis as any).window = {};
      try {
        expect(() => createAdminClient()).toThrow("Security Violation: Service Role client cannot be instantiated in the browser.");
      } finally {
        delete (globalThis as any).window;
      }
    });

    it("verifies NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY does not exist in environment", () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    });

    it("verifies no client component imports or references createAdminClient", () => {
      const componentsDir = path.resolve(__dirname, "../components");
      const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));

      for (const file of files) {
        const content = fs.readFileSync(path.join(componentsDir, file), "utf-8");
        expect(content).not.toContain("createAdminClient");
        expect(content).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      }
    });
  });
});
