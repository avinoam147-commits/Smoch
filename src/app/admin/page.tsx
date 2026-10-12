import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { PageHeader, Panel } from "./_components/ui";
import { getQueueCounts } from "./_lib/data";
import { describeAudit } from "./_lib/audit";

export const metadata = { title: "סקירה" };

export default async function AdminHome() {
  const supabase = await createClient();
  const counts = await getQueueCounts();
  const head = { count: "exact" as const, head: true };
  const [companies, reviews, users, audit] = await Promise.all([
    supabase.from("companies").select("*", head).eq("status", "published"),
    supabase.from("reviews").select("*", head).eq("status", "published"),
    supabase.from("profiles").select("*", head),
    supabase.from("admin_audit").select("*").order("created_at", { ascending: false }).limit(8),
  ]);

  const queues = [
    { label: "חברות ממתינות לאישור", count: counts.companies, href: "/admin/companies?status=pending" },
    { label: "ביקורות ממתינות לבדיקה", count: counts.reviews, href: "/admin/reviews?status=pending" },
    { label: "דיווחים פתוחים", count: counts.reports, href: "/admin/reports" },
    { label: "קבלות לבדיקה", count: counts.receipts, href: "/admin/receipts" },
    { label: "בקשות ניהול דף", count: counts.claims, href: "/admin/claims" },
  ];

  return (
    <>
      <PageHeader title="סקירה" description="מה מחכה לטיפול, ומה קורה באתר." />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="חברות באתר" value={companies.count ?? 0} />
        <Stat label="ביקורות מפורסמות" value={reviews.count ?? 0} />
        <Stat label="משתמשים רשומים" value={users.count ?? 0} />
      </div>

      <h2 className="mt-8 mb-3 font-bold">ממתין לטיפול</h2>
      <Panel className="divide-y divide-line">
        {queues.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="group flex items-center gap-3 px-5 py-4 first:rounded-t-2xl last:rounded-b-2xl hover:bg-surface-2"
          >
            <span className={`text-2xl font-bold tabular-nums ${q.count > 0 ? "text-mixed" : "text-muted"}`}>
              {q.count}
            </span>
            <span className="text-sm">{q.label}</span>
            <ArrowLeft
              className="ms-auto size-4 text-muted transition-transform duration-150 group-hover:-translate-x-0.5"
              aria-hidden
            />
          </Link>
        ))}
      </Panel>

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="font-bold">פעולות אחרונות של הצוות</h2>
        <Link href="/admin/audit" className="text-sm text-accent hover:underline">
          ליומן המלא
        </Link>
      </div>
      <Panel className="divide-y divide-line text-sm">
        {(audit.data ?? []).map((a) => (
          <div key={a.id} className="flex flex-wrap gap-x-3 px-5 py-3">
            <span className="text-muted tabular-nums">{formatDateTime(a.created_at)}</span>
            <span>{describeAudit(a)}</span>
          </div>
        ))}
        {!audit.data?.length && <p className="px-5 py-4 text-muted">עדיין אין פעולות.</p>}
      </Panel>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Panel className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums">{value.toLocaleString("he-IL")}</p>
    </Panel>
  );
}
