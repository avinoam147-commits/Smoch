import Link from "next/link";
import { categories } from "@/lib/format";
import type { Company } from "@/lib/types";
import { Stars } from "./stars";
import { ScoreBadge } from "./score-badge";

export function CompanyCard({ company }: { company: Company }) {
  const { reviewCount, trustScore } = company.stats;
  return (
    <Link
      href={`/company/${company.slug}`}
      className="pressable group flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 hover:border-ink/25"
    >
      <div className="flex items-start gap-3">
        <CompanyMark name={company.name} logoUrl={company.logoUrl} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold underline-offset-4 group-hover:underline">{company.name}</h3>
          <p className="truncate text-sm text-muted">{categories[company.category].label}</p>
        </div>
      </div>
      {company.tagline && <p className="line-clamp-2 text-sm text-muted">{company.tagline}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
        {reviewCount > 0 ? (
          <>
            <Stars value={trustScore} size="sm" />
            <ScoreBadge score={trustScore} />
            <span className="text-xs text-muted">· {reviewCount.toLocaleString("he-IL")} ביקורות</span>
          </>
        ) : (
          <span className="text-sm text-muted">אין עדיין ביקורות</span>
        )}
      </div>
    </Link>
  );
}

export function CompanyMark({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl?: string | null;
  size?: "md" | "lg";
}) {
  const dims = size === "lg" ? "size-16 text-2xl rounded-2xl" : "size-11 text-base rounded-xl";
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logos come from Supabase storage at arbitrary sizes
      <img src={logoUrl} alt="" className={`${dims} shrink-0 border border-line bg-surface object-contain p-1`} />
    );
  }
  return (
    <span
      aria-hidden
      className={`grid ${dims} shrink-0 place-items-center border border-line bg-surface-2 font-bold text-muted`}
    >
      {name.trim().charAt(0)}
    </span>
  );
}
