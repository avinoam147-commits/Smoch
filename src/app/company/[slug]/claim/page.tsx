import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/queries";
import { getViewer } from "@/lib/auth";
import { GoogleButton } from "@/components/google-button";
import { ClaimForm } from "./claim-form";

export const metadata: Metadata = { title: "בקשת ניהול דף חברה", robots: { index: false } };

export default function ClaimPage({ params }: PageProps<"/company/[slug]/claim">) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
        <Gate params={params} />
      </Suspense>
    </div>
  );
}

async function Gate({ params }: { params: PageProps<"/company/[slug]/claim">["params"] }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(decodeURIComponent(slug));
  if (!company) notFound();
  const viewer = await getViewer();

  return (
    <>
      <Link href={`/company/${company.slug}`} className="text-sm text-muted hover:text-ink">
        → חזרה ל{company.name}
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance wrap-anywhere">
        ניהול הדף של {company.name}
      </h1>
      <p className="mt-2 text-pretty text-muted">
        נציג/ה מאומת/ת של החברה יכול/ה להגיב לביקורות בפומבי ולקבל התראה על ביקורות חדשות. ההצטרפות חינמית ולא משפיעה על
        הציון. אי אפשר להסיר או להסתיר ביקורות.
      </p>
      {!viewer ? (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6 text-center sm:p-8">
          <p className="font-semibold">כדי לשלוח בקשה צריך להתחבר</p>
          <div className="mx-auto mt-5 max-w-xs">
            <GoogleButton next={`/company/${company.slug}/claim`} />
          </div>
        </div>
      ) : (
        <ClaimForm companyId={company.id} companyName={company.name} />
      )}
    </>
  );
}
