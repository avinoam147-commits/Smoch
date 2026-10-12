import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * Anonymous client with no cookies. Safe inside 'use cache' because it
 * never depends on who is asking: RLS limits it to published content.
 */
export function createPublicClient() {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
