import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/stars";
import { StatusChip } from "@/components/status-chip";
import { ActionButton } from "../_components/action-button";
import { Empty, FilterTabs, Flash, PageHeader, SearchForm, Table } from "../_components/ui";
import { setReviewStatus } from "../actions";

export const metadata = { title: "ביקורות" };

const statuses = ["pending", "published", "hidden", "rejected"] as const;

export default async function AdminReviews({ searchParams }: PageProps<"/admin/reviews">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (statuses as readonly string[]).includes(sp.status) ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim().replace(/[%,()]/g, "") : "";
  const company = typeof sp.company === "string" && /^[0-9a-f-]{36}$/i.test(sp.company) ? sp.company : "";

  const supabase = await createClient();
  let query = supabase
    .from("reviews")
    .select(
      "id, rating, title, author_name, status, moderation_note, verified_purchase, source, created_at, companies(id, name), reports(status)",
    )
    .order("created_at", { ascending: false })
    .limit(300);
  if (status) query = query.eq("status", status as (typeof statuses)[number]);
  if (company) query = query.eq("company_id", company);
  if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%,author_name.ilike.%${q}%`);
  const { data: rows } = await query;
  const { data: companyRow } = company
    ? await supabase.from("companies").select("name").eq("id", company).maybeSingle()
    : { data: null };

  const base = `/admin/reviews?${new URLSearchParams({ ...(q && { q }), ...(company && { company }) }).toString()}`;
  const hidden: Record<string, string> = { ...(status && { status }), ...(company && { company }) };

  return (
    <>
      <PageHeader
        title="ביקורות"
        description={companyRow ? `מסוננות לפי ${companyRow.name}` : "בדיקה, עריכה, הסתרה ומחיקה של ביקורות."}
        actions={
          <Link
            href={`/admin/reviews/new${company ? `?company=${company}` : ""}`}
            className="pressable inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink"
          >
            <Plus className="size-4" aria-hidden />
            ביקורת חדשה
          </Link>
        }
      />
      {sp.deleted && <Flash>הביקורת נמחקה.</Flash>}
      <FilterTabs
        base={base.endsWith("?") ? base.slice(0, -1) : base}
        active={status}
        options={[
          { value: "", label: "הכל" },
          { value: "pending", label: "ממתינות" },
          { value: "published", label: "מפורסמות" },
          { value: "hidden", label: "מוסתרות" },
          { value: "rejected", label: "נדחו" },
        ]}
      />
      <SearchForm defaultValue={q} placeholder="כותרת, תוכן או שם כותב" hidden={hidden} />

      {rows?.length ? (
        <Table head={["ביקורת", "חברה", "כותב/ת", "סטטוס", "תאריך", ""]}>
          {rows.map((r) => {
            const openReports = (r.reports ?? []).filter((x) => x.status === "open").length;
            return (
              <tr key={r.id} className="align-top hover:bg-surface-2/60">
                <td className="max-w-xs px-4 py-3">
                  <Stars value={r.rating} size="sm" />
                  <Link href={`/admin/reviews/${r.id}`} className="mt-1 block truncate font-medium hover:underline">
                    {r.title}
                  </Link>
                  {r.moderation_note && <p className="truncate text-xs text-muted">{r.moderation_note}</p>}
                </td>
                <td className="px-4 py-3">
                  {r.companies && (
                    <Link href={`/admin/reviews?company=${r.companies.id}`} className="hover:underline">
                      {r.companies.name}
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">
                  {r.author_name}
                  {r.source === "staff" && <span className="block text-xs">הוזנה ע״י הצוות</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <StatusChip status={r.status} />
                    {r.verified_purchase && <StatusChip tone="good">מאומתת</StatusChip>}
                    {openReports > 0 && <StatusChip tone="bad">{openReports} דיווחים</StatusChip>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(r.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    {r.status === "pending" && (
                      <ActionButton size="sm" variant="primary" action={setReviewStatus.bind(null, r.id, "published")}>
                        פרסום
                      </ActionButton>
                    )}
                    {r.status === "published" && (
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        notePrompt="סיבת ההסתרה (פנימית, הכותב/ת רואה אותה):"
                        action={setReviewStatus.bind(null, r.id, "hidden")}
                      >
                        הסתרה
                      </ActionButton>
                    )}
                    <Link
                      href={`/admin/reviews/${r.id}`}
                      className="pressable rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium hover:border-ink/30"
                    >
                      עריכה
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <Empty>אין ביקורות להצגה.</Empty>
      )}
    </>
  );
}
