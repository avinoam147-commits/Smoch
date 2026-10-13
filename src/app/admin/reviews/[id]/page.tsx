import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { excerpt, formatDateTime, reportReasons, type ReportReason } from "@/lib/format";
import { StatusChip } from "@/components/status-chip";
import { ReviewEditor } from "../review-editor";
import { ReplyEditor } from "./reply-editor";
import { ReceiptViewButton } from "../../receipts/receipt-view-button";
import { ActionButton } from "../../_components/action-button";
import { Flash, PageHeader, Panel } from "../../_components/ui";
import { decideReceipt, deleteAdminReview, resolveReport } from "../../actions";

export const metadata = { title: "עריכת ביקורת" };

export default async function EditReviewPage({ params, searchParams }: PageProps<"/admin/reviews/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: r }, { data: companies }] = await Promise.all([
    supabase
      .from("reviews")
      .select("*, companies(id, name, slug, status), review_replies(*), reports(*), receipts(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("companies").select("id, name").order("name"),
  ]);
  if (!r) notFound();
  const reply = Array.isArray(r.review_replies) ? r.review_replies[0] : r.review_replies;

  return (
    <>
      <Link href="/admin/reviews" className="text-sm text-muted hover:text-ink">
        → כל הביקורות
      </Link>
      <div className="mt-2">
        <PageHeader
          title={excerpt(r.body)}
          description={`${r.author_name} · ${r.companies?.name} · ${formatDateTime(r.created_at)}${r.edited_at ? ` · נערכה ${formatDateTime(r.edited_at)}` : ""}`}
          actions={
            r.status === "published" && r.companies?.status === "published" ? (
              <Link
                href={`/company/${r.companies.slug}#review-${r.id}`}
                target="_blank"
                className="pressable inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium hover:border-ink/30"
              >
                צפייה באתר <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            ) : undefined
          }
        />
      </div>
      {sp.created && <Flash>הביקורת נוצרה.</Flash>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <ReviewEditor
          companies={companies ?? []}
          isUserReview={r.source === "user"}
          initial={{
            id: r.id,
            companyId: r.company_id,
            authorName: r.author_name,
            rating: r.rating,
            body: r.body,
            paid: r.paid,
            amountPaid: r.amount_paid != null ? String(r.amount_paid) : "",
            experienceDate: r.experience_date?.slice(0, 7) ?? "",
            verifiedPurchase: r.verified_purchase,
            status: r.status,
            moderationNote: r.moderation_note ?? "",
          }}
        />

        <div className="space-y-4">
          <Panel className="p-5 text-sm">
            <h2 className="mb-2 font-bold">פרטים</h2>
            <dl className="space-y-1.5">
              <Row label="מקור">{r.source === "staff" ? "הוזנה על ידי הצוות" : "משתמש רשום"}</Row>
              <Row label="מועילה">{r.helpful_count}</Row>
              <Row label="סטטוס">
                <StatusChip status={r.status} />
              </Row>
            </dl>
          </Panel>

          {(r.reports ?? []).length > 0 && (
            <Panel className="p-5 text-sm">
              <h2 className="mb-2 font-bold">דיווחים ({r.reports.length})</h2>
              <ul className="space-y-3">
                {r.reports.map((rep) => (
                  <li key={rep.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusChip status={rep.status} />
                      <span className="font-medium">{reportReasons[rep.reason as ReportReason] ?? rep.reason}</span>
                    </div>
                    {rep.details && <p className="text-muted">{rep.details}</p>}
                    {rep.status === "open" && (
                      <div className="flex gap-1.5">
                        <ActionButton
                          size="sm"
                          variant="ghost"
                          action={resolveReport.bind(null, rep.id, "dismissed", false)}
                        >
                          דחיית הדיווח
                        </ActionButton>
                        <ActionButton
                          size="sm"
                          variant="danger"
                          notePrompt="סיבת ההסתרה:"
                          action={resolveReport.bind(null, rep.id, "actioned", true)}
                        >
                          הסתרת הביקורת
                        </ActionButton>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {(r.receipts ?? []).length > 0 && (
            <Panel className="p-5 text-sm">
              <h2 className="mb-2 font-bold">קבלות</h2>
              <ul className="space-y-3">
                {r.receipts.map((rc) => (
                  <li key={rc.id} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <StatusChip status={rc.status} />
                      <span className="text-muted">{formatDateTime(rc.created_at)}</span>
                    </div>
                    {rc.status === "pending" && (
                      <div className="flex flex-wrap gap-1.5">
                        <ReceiptViewButton id={rc.id} />
                        <ActionButton size="sm" variant="primary" action={decideReceipt.bind(null, rc.id, true)}>
                          אישור
                        </ActionButton>
                        <ActionButton
                          size="sm"
                          variant="danger"
                          notePrompt="סיבה (תישלח לכותב/ת):"
                          action={decideReceipt.bind(null, rc.id, false)}
                        >
                          דחייה
                        </ActionButton>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel className="p-5 text-sm">
            <h2 className="mb-2 font-bold">תגובת החברה</h2>
            <ReplyEditor reviewId={r.id} initial={reply?.body ?? ""} />
          </Panel>

          <Panel className="border-bad/30 p-5 text-sm">
            <h2 className="mb-1 font-bold text-bad">מחיקה</h2>
            <p className="mb-3 text-muted">מוחק את הביקורת, התגובה והקבלות. כדי להוריד זמנית, הסתירו אותה.</p>
            <ActionButton
              variant="danger"
              confirm="למחוק את הביקורת לצמיתות?"
              action={deleteAdminReview.bind(null, r.id, "/admin/reviews?deleted=1")}
            >
              מחיקה לצמיתות
            </ActionButton>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
