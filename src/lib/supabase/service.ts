import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseUrl } from "./env";

const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Bypasses RLS. Used only to look up email addresses for notifications.
 * Returns null when the secret key isn't configured.
 */
export function createServiceClient() {
  if (!supabaseUrl || !secret) return null;
  return createClient<Database>(supabaseUrl, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
