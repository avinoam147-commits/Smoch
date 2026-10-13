import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { StatusChip } from "@/components/status-chip";
import { CompanyEditor } from "../company-editor";
import { LogoUploader } from "../logo-uploader";
import { ActionButton } from "../../_components/action-button";
import { Flash, PageHeader, Panel } from "../../_components/ui";
import { deleteCompany, removeMember, setCompanyStatus } from "../../actions";

export const metadata = { title: "עריכת חברה" };

export default async function EditCompanyPage({ params, searchParams }: PageProps<"/admin/companies/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: c }, { data: stats }, { data: members }, { data: claims }, categories] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).maybeSingle(),
    supabase.from("company_stats").select("*").eq("company_id", id).maybeSingle(),
    supabase.from("company_members").select("user_id, created_at").eq("company_id", id),
    supabase
      .from("company_claims")
      .select("id, full_name, status, created_at")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),
    getCategories(),
  ]);
  if (!c) notFound();
  const memberIds = (members ?? []).map((m) => m.user_id);
  const { data: memberProfiles } = memberIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", memberIds)
    : { data: [] };
  const names = new Map((memberProfiles ?? []).map((p) => [p.id, p.display_name]));

  return (
    <>
      <Link href="/admin/companies" className="text-sm text-muted hover:text-ink">
        → כל החברות
      </Link>
      <div className="mt-2">
        <PageHeader
          title={c.name}
          description={`נוספה ב-${formatDate(c.created_at)} · ${stats?.review_count ?? 0} ביקורות מפורסמות`}
          actions={
            <>
              {c.status === "published" && (
                <Link
                  href={`/company/${c.slug}`}
                  target="_blank"
                  className="pressable inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium hover:border-ink/30"
                >
                  צפייה באתר <ExternalLink className="size-3.5" aria-hidden />
                </Link>
              )}
              <Link
                href={`/admin/reviews?company=${c.id}`}
                className="pressable rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium hover:border-ink/30"
              >
                הביקורות של החברה
              </Link>
              <Link
                href={`/admin/reviews/new?company=${c.id}`}
                className="pressable rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium hover:border-ink/30"
              >
                הוספת ביקורת
              </Link>
            </>
          }
        />
      </div>

      {sp.created && <Flash>החברה נוצרה.</Flash>}

      {c.status === "pending" && (
        <Panel className="mb-6 flex flex-wrap items-center gap-3 p-4">
          <StatusChip status="pending" />
          <p className="text-sm">החברה הוצעה על ידי משתמש ומחכה לאישור. בדקו שאין כפילות ושהיא מתאימה לקטגוריות.</p>
          <div className="ms-auto flex gap-2">
            <ActionButton variant="primary" action={setCompanyStatus.bind(null, c.id, "published")}>
              אישור ופרסום
            </ActionButton>
            <ActionButton
              variant="danger"
              notePrompt="סיבת הדחייה (תישלח למציע):"
              action={setCompanyStatus.bind(null, c.id, "rejected")}
            >
              דחייה
            </ActionButton>
          </div>
        </Panel>
      )}

      <Panel className="mb-6 p-5">
        <LogoUploader companyId={c.id} name={c.name} logoUrl={c.logo_url} />
      </Panel>

      <CompanyEditor
        categories={categories}
        initial={{
          id: c.id,
          name: c.name,
          slug: c.slug,
          category: c.category,
          tagline: c.tagline,
          about: c.about,
          website: c.website ?? "",
          socialUrl: c.social_url ?? "",
          registryId: c.registry_id ?? "",
          registryVerified: c.registry_verified,
          city: c.city ?? "",
          founded: c.founded ? String(c.founded) : "",
          priceRange: c.price_range ?? "",
          status: c.status,
          adminNote: c.admin_note ?? "",
        }}
      />

      <Panel className="mt-6 p-5 sm:p-6">
        <h2 className="mb-3 font-bold">נציגי החברה</h2>
        {members?.length ? (
          <ul className="divide-y divide-line text-sm">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-3 py-2.5">
                <span>
                  {names.get(m.user_id) ?? "משתמש/ת"}{" "}
                  <span className="text-muted">· מאז {formatDate(m.created_at)}</span>
                </span>
                <ActionButton
                  size="sm"
                  variant="danger"
                  confirm="להסיר את הנציג/ה?"
                  action={removeMember.bind(null, c.id, m.user_id)}
                >
                  הסרה
                </ActionButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">אין נציגים מאומתים.</p>
        )}
        {claims && claims.length > 0 && (
          <p className="mt-3 text-sm text-muted">
            {claims.length} בקשות ניהול ({claims.filter((x) => x.status === "pending").length} ממתינות).{" "}
            <Link href="/admin/claims" className="text-accent hover:underline">
              לבקשות
            </Link>
          </p>
        )}
      </Panel>

      <Panel className="mt-6 border-bad/30 p-5 sm:p-6">
        <h2 className="font-bold text-bad">מחיקת החברה</h2>
        <p className="mt-1 mb-3 text-sm text-muted">
          מוחק את הדף, את כל הביקורות, התגובות והקבלות שלו. אי אפשר לשחזר. כדי להוריד זמנית, שנו את הסטטוס ל״מוסתרת״.
        </p>
        <ActionButton
          variant="danger"
          confirm={`למחוק לצמיתות את ${c.name} ואת כל ${stats?.review_count ?? 0} הביקורות שלה?`}
          action={deleteCompany.bind(null, c.id)}
        >
          מחיקה לצמיתות
        </ActionButton>
      </Panel>
    </>
  );
}
