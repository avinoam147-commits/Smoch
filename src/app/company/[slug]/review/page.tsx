import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/queries";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GoogleButton } from "@/components/google-button";
import { ReviewForm, type ReviewDefaults } from "./review-form";

export async function generateMetadata({ params }: PageProps<"/company/[slug]/review">): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(decodeURIComponent(slug));
  return company ? { title: `ביקורת על ${company.name}`, robots: { index: false } } : {};
}

export default function WriteReviewPage({ params }: PageProps<"/company/[slug]/review">) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
        <ReviewGate params={params} />
      </Suspense>
    </div>
  );
}

async function ReviewGate({ params }: { params: PageProps<"/company/[slug]/review">["params"] }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(decodeURIComponent(slug));
  if (!company) notFound();
  const viewer = await getViewer();
  const path = `/company/${company.slug}/review`;

  let defaults: ReviewDefaults | null = null;
  let requirePhone = false;
  let hasPendingReceipt = false;
  if (viewer) {
    const supabase = await createClient();
    const [{ data: mine }, { data: setting }] = await Promise.all([
      supabase
        .from("reviews")
        .select(
          "id, rating, body, paid, amount_paid, experience_date, status, moderation_note, verified_purchase, receipts(status)",
        )
        .eq("company_id", company.id)
        .eq("user_id", viewer.id)
        .maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", "require_phone_for_reviews").maybeSingle(),
    ]);
    requirePhone = setting?.value === true;
    if (mine) {
      hasPendingReceipt = (mine.receipts ?? []).some((r) => r.status === "pending");
      defaults = {
        id: mine.id,
        rating: mine.rating,
        body: mine.body ?? "",
        paid: mine.paid,
        amountPaid: mine.amount_paid,
        experienceDate: mine.experience_date?.slice(0, 7) ?? "",
        status: mine.status,
        moderationNote: mine.moderation_note,
        verifiedPurchase: mine.verified_purchase,
      };
    }
  }

  return (
    <>
      <Link href={`/company/${company.slug}`} className="text-sm text-muted hover:text-ink">
        → חזרה ל{company.name}
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance">
        {defaults ? `עריכת הדירוג שלך ל${company.name}` : `איך היה עם ${company.name}?`}
      </h1>
      <p className="mt-2 text-muted">בחרו דירוג. אם יש לכם עוד כמה מילים, הן יעזרו לאחרים להחליט, אבל זה לא חובה.</p>

      {!viewer ? (
        <div className="appear mt-8 rounded-2xl border border-line bg-surface p-6 text-center sm:p-8">
          <p className="font-semibold">כדי לדרג צריך להתחבר</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            נציג רק שם פרטי ואות ראשונה משם המשפחה. כתובת המייל לא מתפרסמת.
          </p>
          <div className="mx-auto mt-5 max-w-xs">
            <GoogleButton next={path} />
          </div>
        </div>
      ) : viewer.isBanned ? (
        <Notice>החשבון מושעה ולא ניתן לכתוב ביקורות. לפרטים פנו אלינו.</Notice>
      ) : requirePhone && !viewer.phoneVerified && !defaults ? (
        <Notice>
          כדי לדרג צריך לאמת מספר טלפון. זה לוקח פחות מדקה ועוזר לנו למנוע דירוגים מזויפים.{" "}
          <Link
            href={`/account?next=${encodeURIComponent(path)}#phone`}
            className="font-medium text-accent hover:underline"
          >
            לאימות הטלפון
          </Link>
        </Notice>
      ) : (
        <ReviewForm
          companyId={company.id}
          companySlug={company.slug}
          companyName={company.name}
          viewer={{ id: viewer.id, displayName: viewer.displayName }}
          defaults={defaults}
          hasPendingReceipt={hasPendingReceipt}
        />
      )}
    </>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="appear mt-8 rounded-2xl border border-line bg-surface p-6 text-sm leading-relaxed">{children}</div>
  );
}
