import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { companies, getCompany } from "@/lib/data";
import { ReviewForm } from "./review-form";

export function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/company/[slug]/review">): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompany(slug);
  return company ? { title: `ביקורת על ${company.name}` } : {};
}

export default async function WriteReviewPage({ params }: PageProps<"/company/[slug]/review">) {
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-10">
      <Link href={`/company/${company.slug}`} className="text-sm text-muted hover:text-ink">
        → חזרה ל{company.name}
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance">
        איך הייתה החוויה שלך עם {company.name}?
      </h1>
      <p className="mt-2 text-muted">
        כתבו על מה שקרה לכם. ביקורות כנות, גם חיוביות וגם שליליות, עוזרות לאנשים אחרים להחליט.
      </p>
      <ReviewForm companyName={company.name} companySlug={company.slug} />
    </div>
  );
}
