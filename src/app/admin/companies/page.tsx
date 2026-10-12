import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { categories, formatDate } from "@/lib/format";
import type { CategoryId } from "@/lib/types";
import { StatusChip } from "@/components/status-chip";
import { ActionButton } from "../_components/action-button";
import { Empty, FilterTabs, Flash, PageHeader, SearchForm, Table } from "../_components/ui";
import { setCompanyStatus } from "../actions";

export const metadata = { title: "חברות" };

const statuses = ["pending", "published", "hidden", "rejected"] as const;

export default async function AdminCompanies({ searchParams }: PageProps<"/admin/companies">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (statuses as readonly string[]).includes(sp.status) ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const supabase = await createClient();
  let query = supabase
    .from("companies")
    .select("id, name, slug, category, status, registry_id, registry_verified, claimed, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (status) query = query.eq("status", status as (typeof statuses)[number]);
  if (q)
    query = query.or(
      `name.ilike.%${q.replace(/[%,()]/g, "")}%,slug.ilike.%${q.replace(/[%,()]/g, "")}%,registry_id.ilike.%${q.replace(/[%,()]/g, "")}%`,
    );
  const [{ data: rows }, { data: stats }] = await Promise.all([
    query,
    supabase.from("company_stats").select("company_id, review_count"),
  ]);
  const counts = new Map((stats ?? []).map((s) => [s.company_id, s.review_count ?? 0]));

  return (
    <>
      <PageHeader
        title="חברות"
        description="הוספה, עריכה, אישור והסרה של דפי חברות."
        actions={
          <Link
            href="/admin/companies/new"
            className="pressable inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink"
          >
            <Plus className="size-4" aria-hidden />
            חברה חדשה
          </Link>
        }
      />
      {sp.deleted && <Flash>החברה נמחקה.</Flash>}
      <FilterTabs
        base={`/admin/companies${q ? `?q=${encodeURIComponent(q)}` : ""}`}
        active={status}
        options={[
          { value: "", label: "הכל" },
          { value: "pending", label: "ממתינות" },
          { value: "published", label: "באוויר" },
          { value: "hidden", label: "מוסתרות" },
          { value: "rejected", label: "נדחו" },
        ]}
      />
      <SearchForm defaultValue={q} placeholder="שם, slug או ח.פ." hidden={status ? { status } : undefined} />

      {rows?.length ? (
        <Table head={["חברה", "קטגוריה", "ביקורות", "סטטוס", "נוספה", ""]}>
          {rows.map((c) => (
            <tr key={c.id} className="hover:bg-surface-2/60">
              <td className="px-4 py-3">
                <Link href={`/admin/companies/${c.id}`} className="font-medium hover:underline">
                  {c.name}
                </Link>
                <p className="text-xs text-muted" dir="ltr">
                  /{c.slug}
                  {c.registry_id && ` · ${c.registry_id}${c.registry_verified ? " ✓" : ""}`}
                </p>
              </td>
              <td className="px-4 py-3 text-muted">{categories[c.category as CategoryId]?.label}</td>
              <td className="px-4 py-3 tabular-nums">{counts.get(c.id) ?? 0}</td>
              <td className="px-4 py-3">
                <StatusChip status={c.status} />
              </td>
              <td className="px-4 py-3 text-muted">{formatDate(c.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1.5">
                  {c.status === "pending" && (
                    <>
                      <ActionButton size="sm" variant="primary" action={setCompanyStatus.bind(null, c.id, "published")}>
                        אישור
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        variant="danger"
                        notePrompt="סיבת הדחייה (תישלח למציע):"
                        action={setCompanyStatus.bind(null, c.id, "rejected")}
                      >
                        דחייה
                      </ActionButton>
                    </>
                  )}
                  <Link
                    href={`/admin/companies/${c.id}`}
                    className="pressable rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium hover:border-ink/30"
                  >
                    עריכה
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>אין חברות להצגה.</Empty>
      )}
    </>
  );
}
