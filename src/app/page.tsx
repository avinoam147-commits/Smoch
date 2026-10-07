import Link from "next/link";
import { BadgeCheck, MessageSquareReply, ShieldCheck } from "lucide-react";
import { categories, companies, recentReviews, trustScore, type CategoryId } from "@/lib/data";
import { SearchBox } from "@/components/search-box";
import { CompanyCard } from "@/components/company-card";
import { ReviewCard } from "@/components/review-card";

export default function Home() {
  const ranked = [...companies].sort((a, b) => trustScore(b) - trustScore(a));
  const top = ranked.slice(0, 3);
  const lowest = ranked.slice(-3).reverse();

  return (
    <>
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
          {(Object.keys(categories) as CategoryId[]).map((id) => (
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

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <SectionHeading title="הכי מומלצים" href="/companies?sort=top" />
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((c) => (
            <CompanyCard key={c.slug} company={c} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <SectionHeading title="הדירוג הנמוך ביותר" href="/companies?sort=low" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lowest.map((c) => (
            <CompanyCard key={c.slug} company={c} />
          ))}
        </div>
      </section>

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

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">ביקורות אחרונות</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {recentReviews(4).map((r) => (
            <ReviewCard key={r.id} review={r} company={r.company} showCompany />
          ))}
        </div>
      </section>
    </>
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
