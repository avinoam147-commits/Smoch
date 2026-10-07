import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, Hash, MapPin, PenLine, Wallet } from "lucide-react";
import {
  categories,
  companies,
  getCompany,
  rawAverage,
  reviewCount,
  scoreTone,
  trustScore,
} from "@/lib/data";
import { CompanyMark } from "@/components/company-card";
import { Stars, toneText } from "@/components/stars";
import { ClaimedBadge, RegistryBadge } from "@/components/badges";
import { ReviewsSection } from "./reviews-section";

export function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/company/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) return {};
  return {
    title: `${company.name}: ביקורות ודירוג`,
    description: `${reviewCount(company)} ביקורות על ${company.name}. ציון אמינות ${trustScore(company).toFixed(1)} מתוך 5.`,
  };
}

export default async function CompanyPage({ params }: PageProps<"/company/[slug]">) {
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) notFound();

  const score = trustScore(company);
  const { tone, label } = scoreTone(score);
  const total = reviewCount(company);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <nav className="text-sm text-muted" aria-label="פירורי לחם">
        <Link href="/companies" className="hover:text-ink">כל החברות</Link>
        <span className="mx-2">/</span>
        <Link href={`/companies?category=${company.category}`} className="hover:text-ink">
          {categories[company.category].label}
        </Link>
      </nav>

      <section className="mt-5 rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <CompanyMark name={company.name} size="lg" />
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold tracking-tight text-balance">{company.name}</h1>
              <p className="mt-1 text-muted">{company.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <RegistryBadge verified={company.registryVerified} />
                <ClaimedBadge claimed={company.claimed} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
            <Link
              href={`/company/${company.slug}/review`}
              className="pressable inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-accent-ink hover:opacity-90"
            >
              <PenLine className="size-4" aria-hidden />
              כתיבת ביקורת
            </Link>
            <a
              href={`https://${company.website}`}
              target="_blank"
              rel="noopener nofollow"
              className="pressable inline-flex items-center justify-center gap-2 rounded-xl border border-line px-6 py-3 font-medium hover:border-ink/30"
            >
              לאתר החברה
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-8 border-t border-line pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <p className="text-sm text-muted">ציון אמינות</p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-5xl font-extrabold tabular-nums">{score.toFixed(1)}</span>
              <span className={`text-xl font-semibold ${toneText[tone]}`}>{label}</span>
            </div>
            <div className="mt-3">
              <Stars value={score} size="lg" />
            </div>
            <p className="mt-3 text-sm text-muted">
              מבוסס על {total.toLocaleString("he-IL")} ביקורות. ממוצע גולמי {rawAverage(company).toFixed(2)}.{" "}
              <Link href="/guidelines#score" className="text-accent hover:underline">איך מחושב הציון?</Link>
            </p>
          </div>
          <Distribution distribution={company.distribution} total={total} />
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ReviewsSection company={company} />

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-semibold">על החברה</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{company.about}</p>
            <dl className="mt-4 space-y-3 text-sm">
              <Fact icon={<Hash className="size-4" />} label="ח.פ. / ע.מ." value={company.registryId} />
              <Fact icon={<Wallet className="size-4" />} label="טווח מחירים" value={company.priceRange} />
              <Fact icon={<MapPin className="size-4" />} label="מיקום" value={company.city} />
              <Fact icon={<CalendarDays className="size-4" />} label="פעילה משנת" value={String(company.founded)} />
            </dl>
          </div>
          {!company.claimed && (
            <div className="rounded-2xl border border-dashed border-line p-5 text-sm">
              <p className="font-semibold">זו החברה שלך?</p>
              <p className="mt-1 text-muted">אפשר לאמת בעלות ולהגיב לביקורות בפומבי. ההצטרפות לא משפיעה על הציון.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Distribution({ distribution, total }: { distribution: number[]; total: number }) {
  const tones = ["bg-bad", "bg-poor", "bg-mixed", "bg-good", "bg-great"];
  return (
    <div className="space-y-2.5" aria-label="התפלגות הדירוגים">
      {[4, 3, 2, 1, 0].map((i) => {
        const pct = total ? Math.round((distribution[i] / total) * 100) : 0;
        return (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="w-14 shrink-0 text-muted">{i + 1} כוכבים</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <span className={`block h-full rounded-full ${tones[i]}`} style={{ width: `${pct}%` }} />
            </span>
            <span className="w-10 shrink-0 text-start tabular-nums text-muted">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted" aria-hidden>{icon}</span>
      <dt className="text-muted">{label}</dt>
      <dd className="ms-auto font-medium" dir="auto">{value}</dd>
    </div>
  );
}
