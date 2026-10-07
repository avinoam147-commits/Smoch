"use client";

import { useState } from "react";
import Link from "next/link";
import type { Company } from "@/lib/data";
import { ReviewCard } from "@/components/review-card";

type Filter = "all" | "verified" | 1 | 2 | 3 | 4 | 5;

export function ReviewsSection({ company }: { company: Company }) {
  const [filter, setFilter] = useState<Filter>("all");

  const shown = company.reviews.filter((r) =>
    filter === "all" ? true : filter === "verified" ? r.verifiedPurchase : r.rating === filter,
  );

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
      <h2 id="reviews-heading" className="text-2xl font-bold tracking-tight">ביקורות</h2>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="סינון ביקורות">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => setFilter(o.value)}
            aria-pressed={filter === o.value}
            className={`pressable rounded-full border px-3.5 py-1.5 text-sm ${
              filter === o.value ? "border-ink bg-ink text-bg" : "border-line bg-surface hover:border-ink/30"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div key={String(filter)} className="stagger mt-5 space-y-4">
        {shown.map((r) => (
          <ReviewCard key={r.id} review={r} company={company} />
        ))}
        {shown.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
            אין ביקורות שמתאימות לסינון הזה.{" "}
            <Link href={`/company/${company.slug}/review`} className="font-medium text-accent hover:underline">
              כתבו את הראשונה
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
