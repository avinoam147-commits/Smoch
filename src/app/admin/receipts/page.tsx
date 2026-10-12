import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { Stars } from "@/components/stars";
import { ActionButton } from "../_components/action-button";
import { Empty, PageHeader, Panel } from "../_components/ui";
import { decideReceipt } from "../actions";
import { ReceiptViewButton } from "./receipt-view-button";

export const metadata = { title: "קבלות" };

export default async function AdminReceipts() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("receipts")
    .select("id, created_at, reviews(id, title, rating, author_name, amount_paid, companies(name))")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <>
      <PageHeader
        title="קבלות לבדיקה"
        description="בדקו שהקבלה שייכת לחברה ושהיא תואמת לביקורת. אחרי ההחלטה הקובץ נמחק אוטומטית."
      />
      {rows?.length ? (
        <div className="space-y-3">
          {rows.map((rc) => (
            <Panel key={rc.id} className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{formatDateTime(rc.created_at)}</p>
                <p className="mt-1 font-medium">{rc.reviews?.companies?.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  {rc.reviews && <Stars value={rc.reviews.rating} size="sm" />}
                  <Link href={`/admin/reviews/${rc.reviews?.id}`} className="truncate hover:underline">
                    {rc.reviews?.title}
                  </Link>
                  <span className="text-muted">· {rc.reviews?.author_name}</span>
                  {rc.reviews?.amount_paid != null && (
                    <span className="text-muted">· הצהיר/ה על ₪{rc.reviews.amount_paid.toLocaleString("he-IL")}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <ReceiptViewButton id={rc.id} />
                <ActionButton size="sm" variant="primary" action={decideReceipt.bind(null, rc.id, true)}>
                  אישור רכישה
                </ActionButton>
                <ActionButton
                  size="sm"
                  variant="danger"
                  notePrompt="סיבת הדחייה (תישלח לכותב/ת):"
                  action={decideReceipt.bind(null, rc.id, false)}
                >
                  דחייה
                </ActionButton>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Empty>אין קבלות שממתינות לבדיקה.</Empty>
      )}
    </>
  );
}
