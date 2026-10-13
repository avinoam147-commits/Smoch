import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "../_components/action-button";
import { Flash, PageHeader, Table } from "../_components/ui";
import { deleteCategory } from "../actions";
import { CategoryForm } from "./category-form";

export const metadata = { title: "קטגוריות" };

export default async function AdminCategories({ searchParams }: PageProps<"/admin/categories">) {
  const sp = await searchParams;
  const editId = typeof sp.edit === "string" ? sp.edit : "";
  const supabase = await createClient();
  const [{ data: categories }, { data: companies }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("label"),
    supabase.from("companies").select("category, status"),
  ]);
  const counts = new Map<string, { total: number; published: number }>();
  for (const c of companies ?? []) {
    const entry = counts.get(c.category) ?? { total: 0, published: 0 };
    entry.total++;
    if (c.status === "published") entry.published++;
    counts.set(c.category, entry);
  }
  const editing = categories?.find((c) => c.id === editId);
  const nextOrder = Math.max(0, ...(categories ?? []).filter((c) => c.id !== "other").map((c) => c.sort_order)) + 10;

  return (
    <>
      <PageHeader
        title="קטגוריות"
        description="באתר מוצגות רק קטגוריות שיש בהן חברות. הסדר נקבע לפי המספר בעמודה ״סדר״ (קטן קודם)."
      />
      {typeof sp.saved === "string" && <Flash>הקטגוריה נשמרה.</Flash>}

      <div className="mb-8">
        <CategoryForm
          key={editing?.id ?? "new"}
          initial={
            editing
              ? {
                  originalId: editing.id,
                  id: editing.id,
                  label: editing.label,
                  description: editing.description,
                  sortOrder: editing.sort_order,
                }
              : { id: "", label: "", description: "", sortOrder: nextOrder }
          }
        />
      </div>

      <Table head={["קטגוריה", "מזהה", "חברות", "סדר", ""]}>
        {(categories ?? []).map((c) => {
          const n = counts.get(c.id);
          return (
            <tr key={c.id} className={c.id === editId ? "bg-accent-soft/50" : "hover:bg-surface-2/60"}>
              <td className="px-4 py-3">
                <p className="font-medium">{c.label}</p>
                {c.description && <p className="text-xs text-muted">{c.description}</p>}
              </td>
              <td className="px-4 py-3 text-muted" dir="ltr">
                {c.id}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {n ? (
                  <Link href={`/admin/companies?category=${c.id}`} className="hover:underline">
                    {n.published} באוויר{n.total > n.published ? ` · ${n.total - n.published} נוספות` : ""}
                  </Link>
                ) : (
                  <span className="text-muted">0</span>
                )}
              </td>
              <td className="px-4 py-3 tabular-nums text-muted">{c.sort_order}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1.5">
                  <Link
                    href={`/admin/categories?edit=${c.id}`}
                    className="pressable rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium hover:border-ink/30"
                  >
                    עריכה
                  </Link>
                  {!n?.total && c.id !== "other" && (
                    <ActionButton
                      size="sm"
                      variant="danger"
                      confirm={`למחוק את הקטגוריה ״${c.label}״?`}
                      action={deleteCategory.bind(null, c.id)}
                    >
                      מחיקה
                    </ActionButton>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
