// Connection details for the LOCAL Supabase started by `npx supabase start`.
// Read at runtime so no key is ever committed.
import { execSync } from "node:child_process";

let status = {};
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_KEY) {
  const out = execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  status = JSON.parse(out.slice(out.indexOf("{")));
}

export const SUPABASE_URL = process.env.SUPABASE_URL ?? status.API_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? status.PUBLISHABLE_KEY ?? status.ANON_KEY;
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  throw new Error("Local Supabase isn't running. Start it with `npx supabase start`.");
}
