"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { categories, companies, reviewCount, trustScore, type CategoryId } from "@/lib/data";
import { CompanyCard } from "@/components/company-card";
import { SearchBox } from "@/components/search-box";

type Sort = "top" | "low" | "reviews";

const sortLabels: Record<Sort, string> = {
  top: "ציון גבוה",
  low: "ציון נמוך",
  reviews: "הכי הרבה ביקורות",
};

export function CompaniesBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = params.get("q")?.trim() ?? "";
  const category = params.get("category") as CategoryId | null;
  const sort = (params.get("sort") as Sort | null) ?? "top";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const results = companies
    .filter((c) => !category || c.category === category)
    .filter((c) => !q || `${c.name} ${c.tagline} ${c.registryId}`.includes(q))
    .sort((a, b) => {
      if (sort === "low") return trustScore(a) - trustScore(b);
      if (sort === "reviews") return reviewCount(b) - reviewCount(a);
      return trustScore(b) - trustScore(a);
    });

  return (
    <>
      <div className="mt-6 max-w-xl">
        <SearchBox key={q} defaultValue={q} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="סינון לפי קטגוריה">
          <Chip active={!category} onClick={() => setParam("category", null)}>
            הכל
          </Chip>
          {(Object.keys(categories) as CategoryId[]).map((id) => (
            <Chip key={id} active={category === id} onClick={() => setParam("category", id)}>
              {categories[id].label}
            </Chip>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          מיון
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink sm:text-sm"
          >
            {(Object.keys(sortLabels) as Sort[]).map((s) => (
              <option key={s} value={s}>
                {sortLabels[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {results.length} תוצאות{q && <> עבור ״{q}״</>}
      </p>

      {results.length > 0 ? (
        <div key={`${q}-${category}-${sort}`} className="stagger mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <CompanyCard key={c.slug} company={c} />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="font-semibold">לא מצאנו את החברה הזו</p>
          <p className="mt-1 text-sm text-muted">אולי היא עדיין לא נוספה. אפשר להוסיף אותה ולהיות הראשון לכתוב עליה.</p>
          <Link
            href="/add-company"
            className="pressable mt-5 inline-flex rounded-xl bg-accent px-5 py-2.5 font-medium text-accent-ink"
          >
            הוספת חברה
          </Link>
        </div>
      )}
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`pressable rounded-full border px-4 py-2 text-sm ${
        active ? "border-ink bg-ink text-bg" : "border-line bg-surface hover:border-ink/30"
      }`}
    >
      {children}
    </button>
  );
}
