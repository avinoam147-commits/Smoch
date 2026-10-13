import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createPublicClient } from "./supabase/public";
import { isSupabaseConfigured } from "./supabase/env";
import type { Database } from "./supabase/database.types";
import type { CategoryId, Company, CompanyStats, Review, ReviewWithCompany } from "./types";
import { demoCompanies, demoReviews, demoReviewsWithCompany } from "./demo-data";

// Public reads. They run on every request (no server-side page cache), so a
// new rating shows up immediately for everyone, on every server instance.
// React cache() dedupes repeated calls within one request (page + metadata).

type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];
type StatsRow = Database["public"]["Views"]["company_stats"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReplyRow = Database["public"]["Tables"]["review_replies"]["Row"];

const emptyStats: CompanyStats = {
  reviewCount: 0,
  distribution: [0, 0, 0, 0, 0],
  rawAverage: 0,
  trustScore: 3,
  textCount: 0,
};

export function toStats(s: StatsRow | undefined | null): CompanyStats {
  if (!s) return emptyStats;
  return {
    reviewCount: s.review_count ?? 0,
    distribution: [s.r1 ?? 0, s.r2 ?? 0, s.r3 ?? 0, s.r4 ?? 0, s.r5 ?? 0],
    rawAverage: s.raw_average ?? 0,
    trustScore: s.trust_score ?? 3,
    textCount: s.text_count ?? 0,
  };
}

export function toCompany(c: CompanyRow, s?: StatsRow | null): Company {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    category: c.category as CategoryId,
    tagline: c.tagline,
    about: c.about,
    website: c.website,
    socialUrl: c.social_url,
    logoUrl: c.logo_url,
    registryId: c.registry_id,
    registryVerified: c.registry_verified,
    city: c.city,
    founded: c.founded,
    priceRange: c.price_range,
    claimed: c.claimed,
    stats: toStats(s),
  };
}

export function toReview(r: ReviewRow & { review_replies?: ReplyRow | ReplyRow[] | null }): Review {
  const reply = Array.isArray(r.review_replies) ? r.review_replies[0] : r.review_replies;
  return {
    id: r.id,
    companyId: r.company_id,
    authorName: r.author_name,
    rating: r.rating,
    body: r.body,
    paid: r.paid,
    amountPaid: r.amount_paid,
    experienceDate: r.experience_date,
    verifiedPurchase: r.verified_purchase,
    source: r.source as Review["source"],
    helpfulCount: r.helpful_count,
    createdAt: r.created_at,
    editedAt: r.edited_at,
    reply: reply ? { body: reply.body, createdAt: reply.created_at, updatedAt: reply.updated_at } : null,
  };
}

async function withStats(rows: CompanyRow[]): Promise<Company[]> {
  if (rows.length === 0) return [];
  const supabase = createPublicClient();
  const { data: stats, error } = await supabase
    .from("company_stats")
    .select("*")
    .in(
      "company_id",
      rows.map((r) => r.id),
    );
  if (error) throw error;
  const byId = new Map((stats ?? []).map((s) => [s.company_id, s]));
  return rows.map((r) => toCompany(r, byId.get(r.id)));
}

export const getPublishedCompanies = cache(async (): Promise<Company[]> => {
  await connection();
  if (!isSupabaseConfigured) return demoCompanies;
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("companies").select("*").eq("status", "published").order("name");
  if (error) throw error;
  return withStats(data);
});

export const getCompanyBySlug = cache(async (slug: string): Promise<Company | null> => {
  await connection();
  if (!isSupabaseConfigured) return demoCompanies.find((c) => c.slug === slug) ?? null;
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [company] = await withStats([data]);
  return company;
});

export const getCompanyReviews = cache(async (companyId: string): Promise<Review[]> => {
  await connection();
  if (!isSupabaseConfigured) {
    return demoReviews
      .filter((r) => r.companyId === companyId && r.body)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, review_replies(*)")
    .eq("company_id", companyId)
    .eq("status", "published")
    .not("body", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data.map(toReview);
});

export const getRecentReviews = cache(async (limit: number = 4): Promise<ReviewWithCompany[]> => {
  await connection();
  if (!isSupabaseConfigured) {
    return demoReviewsWithCompany()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, review_replies(*), companies!inner(slug, name, status)")
    .eq("status", "published")
    .not("body", "is", null)
    .eq("companies.status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map((r) => ({ ...toReview(r), company: { slug: r.companies.slug, name: r.companies.name } }));
});
