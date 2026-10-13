import Link from "next/link";
import { Suspense } from "react";
import { BadgeCheck, MessageSquareReply, ShieldCheck } from "lucide-react";
import { categories, categoryIds, hasScore } from "@/lib/format";
import { getPublishedCompanies, getRecentReviews } from "@/lib/queries";
import { SearchBox } from "@/components/search-box";
import { CompanyCard } from "@/components/company-card";
import { ReviewCard } from "@/components/review-card";
import { AccountDeletedNotice } from "@/components/account-deleted-notice";

export default function Home() {
  return (
    <>
      <Suspense>
        <AccountDeletedNotice />
      </Suspense>
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-12 sm:pt-20">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted">
            קורסי מסחר · קבוצות איתותים · ליווי · בוטים
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-balance sm:text-6xl">
            לפני שמשלמים על קורס מסחר, שומעים מי שכבר שילם.
          </h1>
          <p className="mt-5 text-lg text-muted text-pretty">
            ביקורות ציבוריות של לקוחות מחוברים ומזוהים. בלי ביקורות קנויות ובלי הסרות בתשלום.
          </p>
          <div className="mt-8 max-w-xl">
            <SearchBox />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap gap-2">
          {categoryIds.map((id) => (
            <Link
              key={id}
              href={`/companies?category=${id}`}
              className="pressable rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-ink/30"
            >
              {categories[id].label}
            </Link>
          ))}
        </div>
      </section>

      <Suspense fallback={<SectionsSkeleton />}>
        <HomeSections />
      </Suspense>
    </>
  );
}

/** Live data: rankings, the trust principles and the latest reviews. */
async function HomeSections() {
  const [companies, recent] = await Promise.all([getPublishedCompanies(), getRecentReviews(4)]);
  // Rankings only include companies whose score is public (enough ratings).
  const ranked = companies.filter((c) => hasScore(c.stats)).sort((a, b) => b.stats.trustScore - a.stats.trustScore);
  const top = ranked.slice(0, 3);
  const lowest = ranked.length > 3 ? ranked.slice(-3).reverse() : [];

  return (
    <>
      {top.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl px-4">
          <SectionHeading title="הכי מומלצים" href="/companies?sort=top" />
          <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((c) => (
              <CompanyCard key={c.slug} company={c} />
            ))}
          </div>
        </section>
      )}

      {lowest.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl px-4">
          <SectionHeading title="הדירוג הנמוך ביותר" href="/companies?sort=low" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lowest.map((c) => (
              <CompanyCard key={c.slug} company={c} />
            ))}
          </div>
        </section>
      )}

      {companies.length === 0 && (
        <section className="mx-auto mt-14 max-w-6xl px-4">
          <div className="rounded-2xl border border-dashed border-line p-10 text-center">
            <p className="font-semibold">עדיין אין חברות באתר</p>
            <p className="mt-1 text-sm text-muted">מכירים קורס מסחר או קבוצת איתותים? הוסיפו אותם ראשונים.</p>
            <Link
              href="/add-company"
              className="pressable mt-5 inline-flex rounded-xl bg-accent px-5 py-2.5 font-medium text-accent-ink"
            >
              הוספת חברה
            </Link>
          </div>
        </section>
      )}

      {ranked.length === 0 && companies.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl px-4">
          <SectionHeading title="חברות באתר" href="/companies" />
          <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.slice(0, 6).map((c) => (
              <CompanyCard key={c.slug} company={c} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <h2 className="text-2xl font-bold tracking-tight">למה לסמוך על סמוך</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Principle
            icon={<ShieldCheck className="size-5" />}
            title="כל מבקר מזוהה"
            body="כדי לכתוב ביקורת צריך להתחבר עם חשבון Google. ביקורת אחת לכל אדם לכל חברה."
          />
          <Principle
            icon={<BadgeCheck className="size-5" />}
            title="רכישה מאומתת"
            body="מי שמצרף קבלה מקבל תג ״רכישה מאומתת״. הקבלה נבדקת ידנית ולא מתפרסמת."
          />
          <Principle
            icon={<MessageSquareReply className="size-5" />}
            title="לחברות יש זכות תגובה"
            body="חברות יכולות להגיב בפומבי. הן לא יכולות לשלם כדי להסתיר או להסיר ביקורות."
          />
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">ביקורות אחרונות</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {recent.map((r) => (
              <ReviewCard key={r.id} review={r} company={r.company} showCompany />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function SectionsSkeleton() {
  return (
    <div className="mx-auto mt-14 grid max-w-6xl animate-pulse gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 rounded-2xl bg-surface-2" />
      ))}
    </div>
  );
}

function SectionHeading({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <Link href={href} className="text-sm font-medium text-accent hover:underline underline-offset-4">
        לכל הרשימה
      </Link>
    </div>
  );
}

function Principle({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
