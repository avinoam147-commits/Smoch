import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { StatusChip } from "@/components/status-chip";
import { ActionButton } from "../_components/action-button";
import { Empty, PageHeader, SearchForm, Table } from "../_components/ui";
import { setUserBanned, setUserRole } from "../actions";

export const metadata = { title: "משתמשים" };

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const supabase = await createClient();
  const [{ data: users }, viewer] = await Promise.all([
    supabase.rpc("admin_list_users", { search: q || undefined, max_rows: 300 }),
    getViewer(),
  ]);

  return (
    <>
      <PageHeader
        title="משתמשים"
        description="השעיה חוסמת כתיבת ביקורות, הוספת חברות ודיווחים. ביקורות קיימות נשארות."
      />
      <SearchForm defaultValue={q} placeholder="מייל או שם" />
      {users?.length ? (
        <Table head={["משתמש/ת", "ביקורות", "טלפון", "הצטרפות", "סטטוס", ""]}>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-surface-2/60">
              <td className="px-4 py-3">
                <p className="font-medium">{u.display_name}</p>
                <p className="text-xs text-muted" dir="ltr">
                  {u.email}
                </p>
              </td>
              <td className="px-4 py-3 tabular-nums">{u.review_count}</td>
              <td className="px-4 py-3">
                {u.phone_verified ? <StatusChip tone="good">מאומת</StatusChip> : <span className="text-muted">—</span>}
              </td>
              <td className="px-4 py-3 text-muted">{formatDate(u.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {u.role === "admin" && <StatusChip tone="good">מנהל/ת</StatusChip>}
                  {u.is_banned && <StatusChip tone="bad">מושעה</StatusChip>}
                </div>
              </td>
              <td className="px-4 py-3">
                {u.id !== viewer?.id && (
                  <div className="flex justify-end gap-1.5">
                    <ActionButton
                      size="sm"
                      variant="ghost"
                      confirm={
                        u.role === "admin"
                          ? `להסיר הרשאות ניהול מ-${u.display_name}?`
                          : `לתת הרשאות ניהול מלאות ל-${u.display_name}?`
                      }
                      action={setUserRole.bind(null, u.id, u.role === "admin" ? "user" : "admin")}
                    >
                      {u.role === "admin" ? "הסרת ניהול" : "הפיכה למנהל/ת"}
                    </ActionButton>
                    <ActionButton
                      size="sm"
                      variant={u.is_banned ? "outline" : "danger"}
                      confirm={u.is_banned ? undefined : `להשעות את ${u.display_name}?`}
                      action={setUserBanned.bind(null, u.id, !u.is_banned)}
                    >
                      {u.is_banned ? "ביטול השעיה" : "השעיה"}
                    </ActionButton>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>אין משתמשים.</Empty>
      )}
    </>
  );
}
