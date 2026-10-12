import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { Empty, PageHeader, Panel } from "../_components/ui";
import { changedFields, describeAudit } from "../_lib/audit";

export const metadata = { title: "יומן פעולות" };

function show(v: unknown) {
  if (v === null || v === undefined) return "—";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 120 ? `${s.slice(0, 120)}…` : s;
}

export default async function AdminAudit() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("admin_audit")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const actorIds = [...new Set((rows ?? []).map((r) => r.actor_id).filter((x): x is string => Boolean(x)))];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", actorIds)
    : { data: [] };
  const names = new Map((actors ?? []).map((a) => [a.id, a.display_name]));

  return (
    <>
      <PageHeader
        title="יומן פעולות"
        description="כל שינוי שמנהל/ת עושה נרשם אוטומטית במסד הנתונים. היומן הזה הוא התיעוד שלכם אם חברה תטען שביקורת הוסרה או נערכה."
      />
      {rows?.length ? (
        <Panel className="divide-y divide-line text-sm">
          {rows.map((a) => {
            const changes =
              a.action === "update"
                ? changedFields(a).filter((c) => !["edited_at", "decided_at", "resolved_at"].includes(c.field))
                : [];
            return (
              <details key={a.id} className="group px-5 py-3">
                <summary className="flex cursor-pointer list-none flex-wrap gap-x-3 gap-y-1">
                  <span className="text-muted tabular-nums">{formatDateTime(a.created_at)}</span>
                  <span className="font-medium">{names.get(a.actor_id ?? "") ?? "מנהל/ת"}</span>
                  <span>{describeAudit(a)}</span>
                </summary>
                {changes.length > 0 && (
                  <table className="mt-3 w-full text-xs">
                    <tbody>
                      {changes.map((c) => (
                        <tr key={c.field} className="align-top">
                          <td className="py-1 pe-3 font-mono text-muted" dir="ltr">
                            {c.field}
                          </td>
                          <td className="py-1 pe-3 text-bad line-through">{show(c.before)}</td>
                          <td className="py-1 text-great">{show(c.after)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </details>
            );
          })}
        </Panel>
      ) : (
        <Empty>עדיין אין פעולות.</Empty>
      )}
    </>
  );
}
