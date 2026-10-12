import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/stars";
import { StatusChip } from "@/components/status-chip";
import { ProfileForm } from "./profile-form";
import { PhoneVerification } from "./phone-verification";
import { DeleteAccount } from "./delete-account";

export const metadata: Metadata = { title: "החשבון שלי", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10">
      <h1 className="text-3xl font-extrabold tracking-tight">החשבון שלי</h1>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-surface-2" />}>
        <Account />
      </Suspense>
    </div>
  );
}

async function Account() {
  const viewer = await requireViewer("/account");
  const supabase = await createClient();
  const [reviews, companies, claims, memberships] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        "id, rating, title, status, moderation_note, verified_purchase, created_at, companies(name, slug), receipts(status)",
      )
      .eq("user_id", viewer.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("companies")
      .select("id, name, slug, status, admin_note, created_at")
      .eq("created_by", viewer.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("company_claims")
      .select("id, status, admin_note, created_at, companies(name, slug)")
      .eq("user_id", viewer.id)
      .order("created_at", { ascending: false }),
    supabase.from("company_members").select("companies(name, slug)").eq("user_id", viewer.id),
  ]);

  return (
    <div className="mt-8 space-y-6">
      {viewer.isBanned && (
        <p className="rounded-2xl border border-bad/30 bg-surface p-5 text-sm">
          החשבון מושעה. אי אפשר לכתוב ביקורות, להוסיף חברות או לדווח. לפרטים פנו אלינו.
        </p>
      )}

      <Card title="פרטים אישיים">
        <p className="mb-4 text-sm text-muted">מחובר/ת עם {viewer.email}. המייל לא מוצג באתר.</p>
        <ProfileForm displayName={viewer.displayName} notifyEmail={viewer.notifyEmail} />
      </Card>

      <Card title="אימות טלפון" id="phone">
        <PhoneVerification verified={viewer.phoneVerified} phone={viewer.phone} />
      </Card>

      <Card title="הביקורות שלי">
        {reviews.data?.length ? (
          <ul className="divide-y divide-line">
            {reviews.data.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                    <Stars value={r.rating} size="sm" />
                    {r.companies?.name} · {formatDate(r.created_at)}
                  </p>
                  {r.status === "pending" && r.moderation_note && (
                    <p className="mt-1 text-xs text-muted">ממתינה לבדיקה: {r.moderation_note}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {r.verified_purchase ? (
                    <StatusChip tone="good">רכישה מאומתת</StatusChip>
                  ) : r.receipts?.some((x) => x.status === "pending") ? (
                    <StatusChip tone="neutral">קבלה בבדיקה</StatusChip>
                  ) : null}
                  <StatusChip status={r.status} />
                  {r.companies && (
                    <Link
                      href={`/company/${r.companies.slug}/review`}
                      className="pressable rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:border-ink/30"
                    >
                      עריכה
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            עדיין לא כתבת ביקורות.{" "}
            <Link href="/companies" className="font-medium text-accent hover:underline">
              למציאת חברה
            </Link>
          </p>
        )}
      </Card>

      {(companies.data?.length ?? 0) > 0 && (
        <Card title="חברות שהצעתי">
          <ul className="divide-y divide-line">
            {companies.data!.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  {c.status === "published" ? (
                    <Link href={`/company/${c.slug}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                  ) : (
                    <p className="font-medium">{c.name}</p>
                  )}
                  {c.status === "rejected" && c.admin_note && <p className="text-xs text-muted">{c.admin_note}</p>}
                </div>
                <StatusChip status={c.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {((claims.data?.length ?? 0) > 0 || (memberships.data?.length ?? 0) > 0) && (
        <Card title="חברות שאני מנהל/ת">
          <ul className="divide-y divide-line">
            {memberships.data?.map(
              (m) =>
                m.companies && (
                  <li
                    key={m.companies.slug}
                    className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <Link href={`/company/${m.companies.slug}`} className="font-medium hover:underline">
                      {m.companies.name}
                    </Link>
                    <StatusChip tone="good">נציג/ה מאומת/ת</StatusChip>
                  </li>
                ),
            )}
            {claims.data
              ?.filter((c) => c.status !== "approved")
              .map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium">{c.companies?.name}</p>
                    {c.status === "rejected" && c.admin_note && <p className="text-xs text-muted">{c.admin_note}</p>}
                  </div>
                  <StatusChip status={c.status} />
                </li>
              ))}
          </ul>
        </Card>
      )}

      <Card title="מחיקת החשבון">
        <DeleteAccount />
      </Card>
    </div>
  );
}

function Card({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
