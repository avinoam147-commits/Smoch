"use client";

import { useState } from "react";
import Link from "next/link";
import type { Review } from "@/lib/types";
import { ReviewCard } from "@/components/review-card";

type Filter = "all" | "verified" | 1 | 2 | 3 | 4 | 5;
type Sort = "recent" | "helpful";

const PAGE = 10;

export function ReviewsSection({ company, reviews }: { company: { slug: string; name: string }; reviews: Review[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [limit, setLimit] = useState(PAGE);

  const shown = reviews
    .filter((r) => (filter === "all" ? true : filter === "verified" ? r.verifiedPurchase : r.rating === filter))
    .sort((a, b) => (sort === "helpful" ? b.helpfulCount - a.helpfulCount : b.createdAt.localeCompare(a.createdAt)));

  const options: { value: Filter; label: string }[] = [
    { value: "all", label: "הכל" },
    { value: "verified", label: "רכישה מאומתת" },
    { value: 5, label: "5 ★" },
    { value: 4, label: "4 ★" },
    { value: 3, label: "3 ★" },
    { value: 2, label: "2 ★" },
    { value: 1, label: "1 ★" },
  ];

  return (
    <section aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-heading" className="text-2xl font-bold tracking-tight">
          ביקורות
        </h2>
        {reviews.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-muted">
            מיון
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-base text-ink sm:text-sm"
            >
              <option value="recent">החדשות ביותר</option>
              <option value="helpful">המועילות ביותר</option>
            </select>
          </label>
        )}
      </div>
      {reviews.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="סינון ביקורות">
          {options.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => {
                setFilter(o.value);
                setLimit(PAGE);
              }}
              aria-pressed={filter === o.value}
              className={`pressable rounded-full border px-3.5 py-1.5 text-sm ${
                filter === o.value ? "border-ink bg-ink text-bg" : "border-line bg-surface hover:border-ink/30"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div key={`${filter}-${sort}`} className="stagger mt-5 space-y-4">
        {shown.slice(0, limit).map((r) => (
          <ReviewCard key={r.id} review={r} company={company} />
        ))}
        {shown.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
            {reviews.length === 0 ? "עדיין אין ביקורות על החברה." : "אין ביקורות שמתאימות לסינון הזה."}{" "}
            <Link href={`/company/${company.slug}/review`} className="font-medium text-accent hover:underline">
              {reviews.length === 0 ? "כתבו את הראשונה" : "הוסיפו ביקורת"}
            </Link>
          </div>
        )}
      </div>

      {shown.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className="pressable mt-5 w-full rounded-xl border border-line bg-surface py-3 font-medium hover:border-ink/30"
        >
          עוד ביקורות ({shown.length - limit})
        </button>
      )}
    </section>
  );
}
