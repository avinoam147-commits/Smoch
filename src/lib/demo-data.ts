// Sample content shown while Supabase isn't configured ("demo mode").
// Every company, person and review here is fictional.
import raw from "./demo-data.json";
import type { CategoryId, Company, Review, ReviewWithCompany } from "./types";

type RawCompany = (typeof raw.companies)[number];

function stats(d: number[]) {
  const n = d.reduce((a, b) => a + b, 0);
  const sum = d.reduce((acc, count, i) => acc + count * (i + 1), 0);
  return {
    reviewCount: n,
    distribution: d as [number, number, number, number, number],
    rawAverage: n ? sum / n : 0,
    trustScore: (3 * 10 + sum) / (10 + n),
  };
}

function toCompany({ distribution, ...c }: RawCompany): Company {
  return { ...c, category: c.category as CategoryId, stats: stats(distribution) };
}

export const demoCompanies: Company[] = raw.companies.map(toCompany);

export const demoReviews: Review[] = raw.reviews.map((r) => ({ ...r, source: r.source as "user" | "staff" }));

export function demoReviewsWithCompany(): ReviewWithCompany[] {
  return demoReviews.map((r) => {
    const c = demoCompanies.find((x) => x.id === r.companyId)!;
    return { ...r, company: { slug: c.slug, name: c.name } };
  });
}
