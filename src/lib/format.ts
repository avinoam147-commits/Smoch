import type { CategoryId } from "./types";

export const categoryIds: CategoryId[] = ["courses", "signals", "mentoring", "algo"];

export const categories: Record<CategoryId, { label: string; blurb: string }> = {
  courses: { label: "קורסי מסחר", blurb: "קורסים מוקלטים ופרונטליים למסחר במניות, מט״ח וקריפטו" },
  signals: { label: "קבוצות איתותים", blurb: "קבוצות בתשלום ששולחות המלצות קנייה ומכירה" },
  mentoring: { label: "ליווי אישי", blurb: "מנטורים וליווי צמוד לסוחרים מתחילים" },
  algo: { label: "בוטים ואלגו-טריידינג", blurb: "תוכנות ובוטים למסחר אוטומטי" },
};

export function isCategory(v: unknown): v is CategoryId {
  return typeof v === "string" && (categoryIds as string[]).includes(v);
}

/**
 * Below this many ratings the score isn't shown: a handful of ratings can be
 * one unhappy customer or a few friends of the owner. Explained on the page.
 */
export const MIN_RATINGS_FOR_SCORE = 10;

/** Reviews need a few words: enough to say why, without being a chore. */
export const MIN_REVIEW_LENGTH = 10;

export function hasScore(stats: { reviewCount: number }) {
  return stats.reviewCount >= MIN_RATINGS_FOR_SCORE;
}

/** First words of a review, for lists and emails. */
export function excerpt(body: string | null | undefined, max = 60) {
  if (!body) return "";
  const t = body.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
}

export type Tone = "great" | "good" | "mixed" | "poor" | "bad";

export function scoreTone(score: number): { tone: Tone; label: string } {
  if (score >= 4.2) return { tone: "great", label: "מצוין" };
  if (score >= 3.6) return { tone: "good", label: "טוב" };
  if (score >= 2.8) return { tone: "mixed", label: "מעורב" };
  if (score >= 2.0) return { tone: "poor", label: "חלש" };
  return { tone: "bad", label: "גרוע" };
}

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jerusalem",
});

const dateTimeFmt = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "numeric",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jerusalem",
});

export function formatDate(iso: string) {
  return dateFmt.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return dateTimeFmt.format(new Date(iso));
}

export function formatShekel(n: number) {
  return `₪${n.toLocaleString("he-IL")}`;
}

/** "https://www.foo.co.il/path" -> "foo.co.il" */
export function displayHost(url: string) {
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function externalHref(url: string) {
  return url.includes("://") ? url : `https://${url}`;
}

export const reportReasons = {
  personal_info: "מידע אישי או פוגעני",
  fake: "ביקורת מזויפת או ממומנת",
  not_experience: "לא מתארת חוויה אישית",
  offensive: "שפה פוגענית",
  other: "אחר",
} as const;

export type ReportReason = keyof typeof reportReasons;
