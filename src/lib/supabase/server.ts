import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseKey, supabaseUrl } from "./env";

/** Per-request client that acts as the signed-in user (RLS applies). */
export async function createClient() {
  // Auth checks token expiry with Date.now(); make sure that only ever runs at
  // request time, never while a static shell is being prerendered.
  await connection();
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component; the proxy refreshes the session instead.
        }
      },
    },
  });
}
