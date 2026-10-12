import type { Database } from "@/lib/supabase/database.types";

type Audit = Database["public"]["Tables"]["admin_audit"]["Row"];

const entities: Record<string, string> = {
  companies: "חברה",
  reviews: "ביקורת",
  review_replies: "תגובת חברה",
  reports: "דיווח",
  receipts: "קבלה",
  company_claims: "בקשת ניהול",
  company_members: "נציג חברה",
  profiles: "משתמש",
  app_settings: "הגדרה",
};

const verbs: Record<string, string> = { insert: "יצירת", update: "עדכון", delete: "מחיקת" };

function label(row: Record<string, unknown> | null) {
  if (!row) return "";
  const v = row.name ?? row.title ?? row.display_name ?? row.key ?? "";
  return v ? ` ״${String(v).slice(0, 60)}״` : "";
}

/** Short Hebrew description, e.g. "עדכון ביקורת ״...״: סטטוס published → hidden". */
export function describeAudit(a: Audit) {
  const before = a.before as Record<string, unknown> | null;
  const after = a.after as Record<string, unknown> | null;
  let text = `${verbs[a.action] ?? a.action} ${entities[a.entity] ?? a.entity}${label(after ?? before)}`;
  if (a.action === "update" && before && after) {
    const changed = Object.keys(after).filter(
      (k) =>
        !["updated_at", "edited_at", "decided_at", "resolved_at"].includes(k) &&
        JSON.stringify(after[k]) !== JSON.stringify(before[k]),
    );
    if (changed.includes("status")) text += `: סטטוס ${before.status} ← ${after.status}`;
    else if (changed.length) text += `: ${changed.slice(0, 4).join(", ")}`;
  }
  return text;
}

export function changedFields(a: Audit) {
  const before = (a.before ?? {}) as Record<string, unknown>;
  const after = (a.after ?? {}) as Record<string, unknown>;
  return Object.keys({ ...before, ...after })
    .filter((k) => !["updated_at"].includes(k) && JSON.stringify(after[k]) !== JSON.stringify(before[k]))
    .map((k) => ({ field: k, before: before[k], after: after[k] }));
}
