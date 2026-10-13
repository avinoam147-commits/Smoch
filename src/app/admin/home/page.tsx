import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { ActionButton } from "../_components/action-button";
import { Empty, Flash, PageHeader, Table } from "../_components/ui";
import { moveFeatured, removeFeatured, setFeaturedSponsored } from "../actions";
import { FeaturedForm } from "./featured-form";

export const metadata = { title: "דף הבית" };

/** YYYY-MM-DD in Israel time, for the date input. */
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" });

export default async function AdminHome({ searchParams }: PageProps<"/admin/home">) {
  const sp = await searchParams;
  const editId = typeof sp.edit === "string" ? sp.edit : "";
  const supabase = await createClient();
  const [{ data: featured }, { data: companies }] = await Promise.all([
    supabase
      .from("featured_companies")
      .select("*, companies(name, slug, status)")
      .order("position")
      .order("created_at"),
    supabase.from("companies").select("id, name").eq("status", "published").order("name"),
  ]);
  const rows = featured ?? [];
  const now = new Date().toISOString();
  const pickedIds = new Set(rows.map((f) => f.company_id));
  const editing = rows.find((f) => f.id === editId);

  return (
    <>
      <PageHeader
        title="דף הבית"
        description="החברות שבוחרים כאן מופיעות בדף הבית תחת ״חברות נבחרות״, לפי הסדר. הדירוג והביקורות שלהן מוצגים כמו שהם ולא ניתנים לשינוי."
      />
      {typeof sp.saved === "string" && <Flash>נשמר. השינוי כבר מופיע בדף הבית.</Flash>}

      <div className="mb-8">
        <FeaturedForm
          key={editing?.id ?? "new"}
          companies={(companies ?? []).filter((c) => !pickedIds.has(c.id))}
          initial={
            editing
              ? {
                  id: editing.id,
                  companyId: editing.company_id,
                  companyName: editing.companies?.name ?? "",
                  sponsored: editing.sponsored,
                  endsAt: editing.ends_at ? dayFmt.format(new Date(editing.ends_at)) : "",
                }
              : { companyId: "", sponsored: true, endsAt: "" }
          }
        />
      </div>

      {rows.length === 0 ? (
        <Empty>עדיין לא נבחרו חברות. כל עוד הרשימה ריקה, האזור לא מופיע בדף הבית.</Empty>
      ) : (
        <Table head={["סדר", "חברה", "תווית", "מוצג עד", ""]}>
          {rows.map((f, i) => {
            const expired = f.ends_at != null && f.ends_at <= now;
            const offline = f.companies?.status !== "published";
            return (
              <tr key={f.id} className={f.id === editId ? "bg-accent-soft/50" : "hover:bg-surface-2/60"}>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {i > 0 && (
                      <ActionButton size="sm" variant="ghost" action={moveFeatured.bind(null, f.id, -1)}>
                        <ArrowUp className="size-3.5" aria-label="למעלה" />
                      </ActionButton>
                    )}
                    {i < rows.length - 1 && (
                      <ActionButton size="sm" variant="ghost" action={moveFeatured.bind(null, f.id, 1)}>
                        <ArrowDown className="size-3.5" aria-label="למטה" />
                      </ActionButton>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {f.companies ? (
                    <Link href={`/company/${f.companies.slug}`} className="font-medium hover:underline">
                      {f.companies.name}
                    </Link>
                  ) : (
                    <span className="text-muted">חברה שנמחקה</span>
                  )}
                  {(expired || offline) && (
                    <p className="text-xs text-bad">
                      {offline ? "החברה לא באוויר, ולכן לא מוצגת" : "התקופה הסתיימה, ולכן לא מוצגת"}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {f.sponsored ? (
                    <ActionButton
                      size="sm"
                      variant="outline"
                      confirm="להוריד את התווית ״ממומן״? מותר רק אם החברה לא שילמה על המקום."
                      action={setFeaturedSponsored.bind(null, f.id, false)}
                    >
                      ממומן · הורדה
                    </ActionButton>
                  ) : (
                    <ActionButton size="sm" variant="ghost" action={setFeaturedSponsored.bind(null, f.id, true)}>
                      בלי תווית · הוספה
                    </ActionButton>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">{f.ends_at ? formatDate(f.ends_at) : "ללא הגבלה"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Link
                      href={`/admin/home?edit=${f.id}`}
                      className="pressable rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium hover:border-ink/30"
                    >
                      עריכה
                    </Link>
                    <ActionButton
                      size="sm"
                      variant="danger"
                      confirm={`להוריד את ״${f.companies?.name ?? "החברה"}״ מדף הבית?`}
                      action={removeFeatured.bind(null, f.id)}
                    >
                      הסרה
                    </ActionButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
