import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/admin";

export type UserRole = "admin" | "viewer";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Resolves the authenticated user and their trusted role from the database.
 * Never trusts client-supplied roles or browser metadata.
 */
export async function getAuthenticatedUser(supabase: SupabaseClient): Promise<AuthUser | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return null;
  }

  // Fetch trusted role from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    // If user has no profile record, default to viewer or deny access based on policy
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: profile.role as UserRole,
  };
}

/**
 * Enforces session authentication for protected server-side operations.
 * Throws AuthError(401) if session is missing or invalid.
 */
export async function requireAuth(supabase: SupabaseClient): Promise<AuthUser> {
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    throw new AuthError("احراز هویت انجام نشده است یا نشست نامعتبر است.", 401);
  }
  return user;
}

/**
 * Enforces role-based authorization for protected operations.
 * Role hierarchy: 'admin' has full access; 'viewer' only has viewer access.
 * Throws AuthError(403) if authorization check fails.
 */
export function requireRole(user: AuthUser, requiredRole: UserRole): void {
  if (user.role === "admin") {
    return; // Admins have full access to both admin and viewer operations
  }

  if (user.role === "viewer" && requiredRole === "viewer") {
    return; // Viewers can access viewer operations
  }

  throw new AuthError("دسترسی غیرمجاز: سطح دسترسی شما برای این عملیات کافی نیست.", 403);
}

/**
 * Assigns or updates a user role using the secure admin service client.
 * ONLY callable by authenticated admins through secure bootstrap/admin route.
 */
export async function assignUserRole(targetUserId: string, role: UserRole): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("profiles")
    .upsert({
      user_id: targetUserId,
      role,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to assign role: ${error.message}`);
  }
}
