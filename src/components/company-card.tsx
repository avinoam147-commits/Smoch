import Link from "next/link";
import { categories, reviewCount, trustScore, type Company } from "@/lib/data";
import { Stars } from "./stars";
import { ScoreBadge } from "./score-badge";

export function CompanyCard({ company }: { company: Company }) {
  const score = trustScore(company);
  return (
    <Link
      href={`/company/${company.slug}`}
      className="pressable group flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 hover:border-ink/25"
    >
      <div className="flex items-start gap-3">
        <CompanyMark name={company.name} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold group-hover:underline underline-offset-4">{company.name}</h3>
          <p className="truncate text-sm text-muted">{categories[company.category].label}</p>
        </div>
      </div>
      <p className="line-clamp-2 text-sm text-muted">{company.tagline}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={score} size="sm" />
        <ScoreBadge score={score} />
        <span className="text-xs text-muted">· {reviewCount(company).toLocaleString("he-IL")} ביקורות</span>
      </div>
    </Link>
  );
}

export function CompanyMark({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const dims = size === "lg" ? "size-16 text-2xl rounded-2xl" : "size-11 text-base rounded-xl";
  return (
    <span
      aria-hidden
      className={`grid ${dims} shrink-0 place-items-center border border-line bg-surface-2 font-bold text-muted`}
    >
      {name.trim().charAt(0)}
    </span>
  );
}
