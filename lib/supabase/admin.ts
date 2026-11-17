import { createClient } from "@supabase/supabase-js";

/**
 * Creates an administrative Supabase client using the Service Role Key.
 * MUST ONLY be called server-side in secure route handlers or background jobs.
 * NEVER expose this client or its credentials to browser components or client bundles.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Security Violation: Service Role client cannot be instantiated in the browser.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase admin environment configuration (SERVICE_ROLE_KEY)");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
