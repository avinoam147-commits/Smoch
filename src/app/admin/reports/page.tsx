import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, reportReasons, type ReportReason } from "@/lib/format";
import { Stars } from "@/components/stars";
import { StatusChip } from "@/components/status-chip";
import { ActionButton } from "../_components/action-button";
import { Empty, FilterTabs, PageHeader, Panel } from "../_components/ui";
import { deleteAdminReview, resolveReport } from "../actions";

export const metadata = { title: "דיווחים" };

export default async function AdminReports({ searchParams }: PageProps<"/admin/reports">) {
  const sp = await searchParams;
  const status = sp.status === "closed" ? "closed" : "open";
  const supabase = await createClient();
  let query = supabase
    .from("reports")
    .select(
      "id, reason, details, status, resolution_note, created_at, reviews(id, title, body, rating, author_name, status, companies(name))",
    )
    .order("created_at", { ascending: status === "open" })
    .limit(200);
  query = status === "open" ? query.eq("status", "open") : query.neq("status", "open");
  const { data: rows } = await query;

  return (
    <>
      <PageHeader
        title="דיווחים"
        description="ביקורת מדווחת נשארת באוויר עד להחלטה. הסתירו רק כשיש הפרה ברורה של הכללים."
      />
      <FilterTabs
        base="/admin/reports"
        active={status === "open" ? "" : "closed"}
        options={[
          { value: "", label: "פתוחים" },
          { value: "closed", label: "סגורים" },
        ]}
      />
      {rows?.length ? (
        <div className="space-y-3">
          {rows.map((rep) => (
            <Panel key={rep.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <StatusChip status={rep.status} />
                <span className="font-semibold">{reportReasons[rep.reason as ReportReason] ?? rep.reason}</span>
                <span className="text-muted">· {formatDateTime(rep.created_at)}</span>
              </div>
              {rep.details && <p className="mt-2 text-sm">״{rep.details}״</p>}
              {rep.reviews && (
                <div className="mt-3 rounded-xl bg-surface-2 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={rep.reviews.rating} size="sm" />
                    <Link href={`/admin/reviews/${rep.reviews.id}`} className="font-medium hover:underline">
                      {rep.reviews.title}
                    </Link>
                    <span className="text-muted">
                      · {rep.reviews.author_name} על {rep.reviews.companies?.name}
                    </span>
                    <StatusChip status={rep.reviews.status} />
                  </div>
                  <p className="mt-2 line-clamp-4 whitespace-pre-line text-ink/80">{rep.reviews.body}</p>
                </div>
              )}
              {rep.resolution_note && <p className="mt-2 text-xs text-muted">החלטה: {rep.resolution_note}</p>}
              {rep.status === "open" && rep.reviews && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton
                    size="sm"
                    variant="outline"
                    notePrompt="הערה (לא חובה):"
                    action={resolveReport.bind(null, rep.id, "dismissed", false)}
                  >
                    הביקורת תקינה, סגירה
                  </ActionButton>
                  <ActionButton
                    size="sm"
                    variant="danger"
                    notePrompt="סיבת ההסתרה (הכותב/ת רואה אותה):"
                    action={resolveReport.bind(null, rep.id, "actioned", true)}
                  >
                    הסתרת הביקורת
                  </ActionButton>
                  <ActionButton
                    size="sm"
                    variant="ghost"
                    confirm="למחוק את הביקורת לצמיתות? בדרך כלל עדיף להסתיר."
                    action={deleteAdminReview.bind(null, rep.reviews.id, undefined)}
                  >
                    מחיקת הביקורת
                  </ActionButton>
                </div>
              )}
            </Panel>
          ))}
        </div>
      ) : (
        <Empty>{status === "open" ? "אין דיווחים פתוחים." : "אין דיווחים סגורים."}</Empty>
      )}
    </>
  );
}
