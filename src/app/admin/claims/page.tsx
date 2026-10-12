import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { displayHost, formatDateTime } from "@/lib/format";
import { StatusChip } from "@/components/status-chip";
import { ActionButton } from "../_components/action-button";
import { Empty, FilterTabs, PageHeader, Panel } from "../_components/ui";
import { decideClaim } from "../actions";

export const metadata = { title: "בקשות ניהול" };

export default async function AdminClaims({ searchParams }: PageProps<"/admin/claims">) {
  const sp = await searchParams;
  const closed = sp.status === "closed";
  const supabase = await createClient();
  let query = supabase
    .from("company_claims")
    .select("*, companies(id, name, website)")
    .order("created_at", { ascending: !closed })
    .limit(200);
  query = closed ? query.neq("status", "pending") : query.eq("status", "pending");
  const { data: rows } = await query;

  return (
    <>
      <PageHeader
        title="בקשות ניהול דף"
        description="לפני אישור: ודאו שדומיין המייל תואם לאתר החברה, או אמתו בטלפון מול החברה."
      />
      <FilterTabs
        base="/admin/claims"
        active={closed ? "closed" : ""}
        options={[
          { value: "", label: "ממתינות" },
          { value: "closed", label: "טופלו" },
        ]}
      />
      {rows?.length ? (
        <div className="space-y-3">
          {rows.map((c) => {
            const emailDomain = c.work_email.split("@")[1]?.toLowerCase() ?? "";
            const site = c.companies?.website ? displayHost(c.companies.website).toLowerCase() : "";
            const domainMatch = Boolean(site && (emailDomain === site || emailDomain.endsWith(`.${site}`)));
            return (
              <Panel key={c.id} className="p-5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  <Link href={`/admin/companies/${c.companies?.id}`} className="font-semibold hover:underline">
                    {c.companies?.name}
                  </Link>
                  <span className="text-muted">· {formatDateTime(c.created_at)}</span>
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  <div>
                    <dt className="inline text-muted">שם: </dt>
                    <dd className="inline">
                      {c.full_name}, {c.job_title}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline text-muted">מייל: </dt>
                    <dd className="inline" dir="ltr">
                      {c.work_email}
                    </dd>{" "}
                    {site && (
                      <StatusChip tone={domainMatch ? "good" : "warn"}>
                        {domainMatch ? "תואם לאתר" : `לא תואם ל-${site}`}
                      </StatusChip>
                    )}
                  </div>
                  {c.phone && (
                    <div>
                      <dt className="inline text-muted">טלפון: </dt>
                      <dd className="inline" dir="ltr">
                        {c.phone}
                      </dd>
                    </div>
                  )}
                </dl>
                {c.message && <p className="mt-2 rounded-xl bg-surface-2 p-3">{c.message}</p>}
                {c.admin_note && <p className="mt-2 text-xs text-muted">הערה: {c.admin_note}</p>}
                {c.status === "pending" && (
                  <div className="mt-4 flex gap-2">
                    <ActionButton
                      size="sm"
                      variant="primary"
                      confirm={`לאשר את ${c.full_name} כנציג/ה של ${c.companies?.name}?`}
                      action={decideClaim.bind(null, c.id, true)}
                    >
                      אישור
                    </ActionButton>
                    <ActionButton
                      size="sm"
                      variant="danger"
                      notePrompt="סיבת הדחייה (תישלח למבקש/ת):"
                      action={decideClaim.bind(null, c.id, false)}
                    >
                      דחייה
                    </ActionButton>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      ) : (
        <Empty>{closed ? "אין בקשות שטופלו." : "אין בקשות ממתינות."}</Empty>
      )}
    </>
  );
}
