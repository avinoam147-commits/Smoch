import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { QueueCounts } from "../_components/admin-nav";

export async function getQueueCounts(): Promise<QueueCounts> {
  const supabase = await createClient();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const [companies, reviews, reports, receipts, claims] = await Promise.all([
    count(supabase.from("companies").select("*", { count: "exact", head: true }).eq("status", "pending")),
    count(supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending")),
    count(supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open")),
    count(supabase.from("receipts").select("*", { count: "exact", head: true }).eq("status", "pending")),
    count(supabase.from("company_claims").select("*", { count: "exact", head: true }).eq("status", "pending")),
  ]);
  return { companies, reviews, reports, receipts, claims };
}
