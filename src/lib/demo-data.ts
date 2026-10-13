// Sample content shown while Supabase isn't configured ("demo mode").
// Every company, person and review here is fictional.
import raw from "./demo-data.json";
import type { Category, Company, Review, ReviewWithCompany } from "./types";

type RawCompany = (typeof raw.companies)[number];

// Same list the categories migration inserts.
export const demoCategories: Category[] = [
  ["courses", "קורסי מסחר"],
  ["signals", "קבוצות איתותים"],
  ["mentoring", "ליווי אישי למסחר"],
  ["algo", "בוטים ואלגו-טריידינג"],
  ["brokers", "ברוקרים ופלטפורמות מסחר"],
  ["investments", "ייעוץ והשקעות"],
  ["real-estate", "נדל״ן והשקעות נדל״ן"],
  ["education", "קורסים והכשרות מקצועיות"],
  ["business-coaching", "ייעוץ עסקי ואימון"],
  ["digital-marketing", "שיווק דיגיטלי"],
  ["online-shops", "חנויות אונליין"],
  ["tech-services", "בניית אתרים ותוכנה"],
  ["home-services", "שירותי בית ושיפוצים"],
  ["other", "אחר"],
].map(([id, label], i) => ({ id, label, description: "", sortOrder: id === "other" ? 1000 : (i + 1) * 10 }));

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
  const label = demoCategories.find((x) => x.id === c.category)?.label ?? c.category;
  return { ...c, categoryLabel: label, stats: stats(distribution) };
}

export const demoCompanies: Company[] = raw.companies.map(toCompany);

export const demoReviews: Review[] = raw.reviews.map((r) => ({ ...r, source: r.source as "user" | "staff" }));

export function demoReviewsWithCompany(): ReviewWithCompany[] {
  return demoReviews.map((r) => {
    const c = demoCompanies.find((x) => x.id === r.companyId)!;
    return { ...r, company: { slug: c.slug, name: c.name } };
  });
}
