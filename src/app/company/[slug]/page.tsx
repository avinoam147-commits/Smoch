import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, Hash, MapPin, PenLine, Wallet, AtSign } from "lucide-react";
import { displayHost, externalHref, hasScore, MIN_RATINGS_FOR_SCORE, scoreTone } from "@/lib/format";
import { getCompanyBySlug, getCompanyReviews } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { siteUrl } from "@/lib/site";
import type { Company, Review } from "@/lib/types";
import { CompanyMark } from "@/components/company-card";
import { Stars, toneText } from "@/components/stars";
import { ClaimedBadge, RegistryBadge } from "@/components/badges";
import { CompanyViewerProvider } from "@/components/viewer-context";
import { ReviewsSection } from "./reviews-section";

export async function generateMetadata({ params }: PageProps<"/company/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(decodeURIComponent(slug));
  if (!company) return { title: "החברה לא נמצאה" };
  const { reviewCount, trustScore } = company.stats;
  return {
    title: `${company.name}: ביקורות ודירוג`,
    description: hasScore(company.stats)
      ? `${reviewCount} דירוגים של ${company.name}. ציון אמינות ${trustScore.toFixed(1)} מתוך 5. ${company.tagline}`
      : `ביקורות ודירוג על ${company.name}. ${company.tagline}`,
    alternates: { canonical: `/company/${company.slug}` },
  };
}

export default function CompanyPage({ params }: PageProps<"/company/[slug]">) {
  return (
    <Suspense fallback={<CompanySkeleton />}>
      <CompanyContent params={params} />
    </Suspense>
  );
}

async function CompanyContent({ params }: { params: PageProps<"/company/[slug]">["params"] }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(decodeURIComponent(slug));
  if (!company) notFound();
  const reviews = await getCompanyReviews(company.id);

  const { reviewCount, trustScore, rawAverage, distribution } = company.stats;
  const { tone, label } = scoreTone(trustScore);

  return (
    <CompanyViewerProvider companyId={company.id} enabled={isSupabaseConfigured}>
      <JsonLd company={company} reviews={reviews} />
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <nav className="text-sm text-muted" aria-label="פירורי לחם">
          <Link href="/companies" className="hover:text-ink">
            כל החברות
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/companies?category=${company.category}`} className="hover:text-ink">
            {company.categoryLabel}
          </Link>
        </nav>

        <section className="mt-5 rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <CompanyMark name={company.name} logoUrl={company.logoUrl} size="lg" />
              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold tracking-tight text-balance wrap-anywhere">{company.name}</h1>
                {company.tagline && <p className="mt-1 wrap-anywhere text-muted">{company.tagline}</p>}
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
              {company.website && (
                <a
                  href={externalHref(company.website)}
                  target="_blank"
                  rel="noopener nofollow ugc"
                  className="pressable inline-flex items-center justify-center gap-2 rounded-xl border border-line px-6 py-3 font-medium hover:border-ink/30"
                >
                  לאתר החברה
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              )}
            </div>
          </div>

          {hasScore(company.stats) ? (
            <div className="mt-8 grid gap-8 border-t border-line pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <div>
                <p className="text-sm text-muted">ציון אמינות</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-5xl font-extrabold tabular-nums">{trustScore.toFixed(1)}</span>
                  <span className={`text-xl font-semibold ${toneText[tone]}`}>{label}</span>
                </div>
                <div className="mt-3">
                  <Stars value={trustScore} size="lg" />
                </div>
                <p className="mt-3 text-sm text-muted">
                  מבוסס על {reviewCount.toLocaleString("he-IL")} דירוגים. ממוצע גולמי {rawAverage.toFixed(2)}.{" "}
                  <Link href="/guidelines#score" className="text-accent hover:underline">
                    איך מחושב הציון?
                  </Link>
                </p>
              </div>
              <Distribution distribution={distribution} total={reviewCount} />
            </div>
          ) : (
            <ScorePending count={reviewCount} />
          )}
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ReviewsSection company={{ slug: company.slug, name: company.name }} reviews={reviews} />

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="font-semibold">על החברה</h2>
              {company.about && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed wrap-anywhere text-muted">
                  {company.about}
                </p>
              )}
              <dl className="mt-4 space-y-3 text-sm">
                {company.registryId && (
                  <Fact icon={<Hash className="size-4" />} label="ח.פ. / ע.מ." value={company.registryId} />
                )}
                {company.priceRange && (
                  <Fact icon={<Wallet className="size-4" />} label="טווח מחירים" value={company.priceRange} />
                )}
                {company.city && <Fact icon={<MapPin className="size-4" />} label="מיקום" value={company.city} />}
                {company.founded && (
                  <Fact icon={<CalendarDays className="size-4" />} label="פעילה משנת" value={String(company.founded)} />
                )}
                {company.website && (
                  <Fact icon={<ExternalLink className="size-4" />} label="אתר" value={displayHost(company.website)} />
                )}
                {company.socialUrl && (
                  <Fact
                    icon={<AtSign className="size-4" />}
                    label="רשת חברתית"
                    value={displayHost(company.socialUrl)}
                  />
                )}
              </dl>
            </div>
            {!company.claimed && (
              <div className="rounded-2xl border border-dashed border-line p-5 text-sm">
                <p className="font-semibold">זו החברה שלך?</p>
                <p className="mt-1 text-muted">אפשר לאמת בעלות ולהגיב לביקורות בפומבי. ההצטרפות לא משפיעה על הציון.</p>
                <Link
                  href={`/company/${company.slug}/claim`}
                  className="pressable mt-3 inline-flex rounded-lg border border-line bg-surface px-3.5 py-2 font-medium hover:border-ink/30"
                >
                  בקשת ניהול הדף
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </CompanyViewerProvider>
  );
}

function ScorePending({ count }: { count: number }) {
  const missing = MIN_RATINGS_FOR_SCORE - count;
  return (
    <div className="mt-8 border-t border-line pt-8">
      <p className="text-sm text-muted">ציון אמינות</p>
      <p className="mt-1 text-xl font-semibold">
        {count === 0 ? "עדיין אין דירוגים" : `הציון יוצג אחרי ${MIN_RATINGS_FOR_SCORE} דירוגים`}
      </p>
      <div
        className="mt-4 flex max-w-sm gap-1.5"
        role="img"
        aria-label={`${count} מתוך ${MIN_RATINGS_FOR_SCORE} דירוגים`}
      >
        {Array.from({ length: MIN_RATINGS_FOR_SCORE }, (_, i) => (
          <span key={i} className={`h-2 flex-1 rounded-full ${i < count ? "bg-accent" : "bg-surface-2"}`} />
        ))}
      </div>
      <p className="mt-2 text-sm font-medium tabular-nums">
        {count.toLocaleString("he-IL")} מתוך {MIN_RATINGS_FOR_SCORE} · חסרים עוד {missing}
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
        <strong className="font-semibold text-ink">למה הציון מוסתר?</strong> ציון שמבוסס על מעט דירוגים יכול לשקף לקוח
        אחד מאוכזב, או כמה חברים של בעלי החברה, ולהטעות. לכן עד שמצטברים {MIN_RATINGS_FOR_SCORE} דירוגים אנחנו לא מציגים
        ציון ולא התפלגות, רק את הביקורות עצמן. הכלל זהה לכל החברות באתר.{" "}
        <Link href="/guidelines#score" className="text-accent hover:underline">
          עוד על חישוב הציון
        </Link>
      </p>
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
      <span className="text-muted" aria-hidden>
        {icon}
      </span>
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="ms-auto truncate font-medium" dir="auto">
        {value}
      </dd>
    </div>
  );
}

function JsonLd({ company, reviews }: { company: Company; reviews: Review[] }) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: company.website ? externalHref(company.website) : `${siteUrl}/company/${company.slug}`,
    description: company.tagline || undefined,
    ...(company.logoUrl && { logo: company.logoUrl }),
  };
  // Search engines get the aggregate only once it is shown on the page.
  if (hasScore(company.stats)) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: company.stats.rawAverage.toFixed(1),
      reviewCount: company.stats.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
    data.review = reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      datePublished: r.createdAt.slice(0, 10),
      reviewBody: r.body,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    }));
  }
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be inline; "<" is escaped so review text can't close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

function CompanySkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 pt-8" aria-busy>
      <div className="h-4 w-40 rounded bg-surface-2" />
      <div className="mt-5 h-72 rounded-3xl bg-surface-2" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="h-48 rounded-2xl bg-surface-2" />
          <div className="h-48 rounded-2xl bg-surface-2" />
        </div>
        <div className="h-64 rounded-2xl bg-surface-2" />
      </div>
    </div>
  );
}
