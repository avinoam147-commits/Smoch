"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { lookupRegistry } from "@/lib/registry";
import { MIN_REVIEW_LENGTH } from "@/lib/format";
import type { ActionState } from "@/lib/types";
import { notifyClaimDecision, notifyCompanyDecision, notifyNewReview, notifyReceiptDecision } from "@/lib/notify";

async function adminClient() {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) throw new Error("admin only");
  return { supabase: await createClient(), viewer };
}

// Public pages read fresh data on every request; this re-renders the admin view.
function invalidate() {
  refresh();
}

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

const companySchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "שם קצר מדי").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "אותיות לטיניות קטנות, ספרות ומקפים בלבד")
    .max(80),
  category: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "בחרו קטגוריה"),
  tagline: z.string().trim().max(160).default(""),
  about: z.string().trim().max(3000).default(""),
  website: z.preprocess(blankToNull, z.string().trim().max(200).nullable()),
  socialUrl: z.preprocess(blankToNull, z.string().trim().max(300).nullable()),
  registryId: z.preprocess(blankToNull, z.string().trim().max(30).nullable()),
  registryVerified: z.enum(["on"]).optional(),
  city: z.preprocess(blankToNull, z.string().trim().max(60).nullable()),
  founded: z.preprocess(blankToNull, z.coerce.number().int().min(1948).max(2100).nullable()),
  priceRange: z.preprocess(blankToNull, z.string().trim().max(80).nullable()),
  status: z.enum(["pending", "published", "rejected", "hidden"]),
  adminNote: z.preprocess(blankToNull, z.string().trim().max(500).nullable()),
});

export async function saveCompany(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await adminClient();
  const parsed = companySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const row = {
    name: v.name,
    slug: v.slug,
    category: v.category,
    tagline: v.tagline,
    about: v.about,
    website: v.website,
    social_url: v.socialUrl,
    registry_id: v.registryId,
    registry_verified: v.registryVerified === "on",
    city: v.city,
    founded: v.founded,
    price_range: v.priceRange,
    status: v.status,
    admin_note: v.adminNote,
  };

  if (v.id) {
    const { data: before } = await supabase.from("companies").select("status").eq("id", v.id).single();
    const { error } = await supabase.from("companies").update(row).eq("id", v.id);
    if (error) return { ok: false, message: friendlyError(error) };
    if (before && before.status === "pending" && (v.status === "published" || v.status === "rejected")) {
      const id = v.id;
      after(() => notifyCompanyDecision(id));
    }
    invalidate();
    return { ok: true, message: "נשמר." };
  }

  const { data, error } = await supabase.from("companies").insert(row).select("id").single();
  if (error || !data) return { ok: false, message: friendlyError(error) };
  invalidate();
  redirect(`/admin/companies/${data.id}?created=1`);
}

export async function setCompanyStatus(
  id: string,
  status: "published" | "rejected" | "hidden" | "pending",
  note?: string,
) {
  const { supabase } = await adminClient();
  const { error } = await supabase
    .from("companies")
    .update({ status, ...(note !== undefined && { admin_note: note || null }) })
    .eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  if (status === "published" || status === "rejected") after(() => notifyCompanyDecision(id));
  invalidate();
  return { ok: true };
}

export async function deleteCompany(id: string) {
  const { supabase } = await adminClient();
  const { data: c } = await supabase.from("companies").select("logo_url").eq("id", id).single();
  // Receipt files for this company's reviews must go before the rows cascade.
  const { data: receipts } = await supabase
    .from("receipts")
    .select("storage_path, reviews!inner(company_id)")
    .eq("reviews.company_id", id);
  const paths = (receipts ?? []).map((r) => r.storage_path).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from("receipts").remove(paths);
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  const logoPath = c?.logo_url?.split("/logos/")[1];
  if (logoPath) await supabase.storage.from("logos").remove([logoPath]);
  invalidate();
  redirect("/admin/companies?deleted=1");
}

export async function setCompanyLogo(id: string, logoUrl: string | null) {
  const { supabase } = await adminClient();
  const { data: c } = await supabase.from("companies").select("logo_url").eq("id", id).single();
  const { error } = await supabase.from("companies").update({ logo_url: logoUrl }).eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  const oldPath = c?.logo_url?.split("/logos/")[1];
  if (oldPath && c?.logo_url !== logoUrl) await supabase.storage.from("logos").remove([oldPath]);
  invalidate();
  return { ok: true };
}

export async function verifyRegistry(id: string, registryId: string) {
  const { supabase } = await adminClient();
  const res = await lookupRegistry(registryId);
  if (!res.ok) return { ok: false, message: res.error };
  if (!res.record) return { ok: false, message: "לא נמצאה חברה עם המספר הזה ברשם החברות." };
  const { error } = await supabase
    .from("companies")
    .update({
      registry_id: registryId.trim(),
      registry_verified: true,
      registry_data: JSON.parse(JSON.stringify(res.record.raw)),
    })
    .eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  invalidate();
  return {
    ok: true,
    message: `אומת: ${res.record.name}${res.record.status ? ` · ${res.record.status}` : ""}${res.record.city ? ` · ${res.record.city}` : ""}`,
  };
}

export async function removeMember(companyId: string, userId: string) {
  const { supabase } = await adminClient();
  const { error } = await supabase.from("company_members").delete().eq("company_id", companyId).eq("user_id", userId);
  if (error) return { ok: false, message: friendlyError(error) };
  invalidate();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

const reviewSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  companyId: z.string().uuid("בחרו חברה"),
  authorName: z.string().trim().min(2, "שם קצר מדי").max(40),
  rating: z.coerce.number().int().min(1, "בחרו דירוג").max(5),
  body: z.string().trim().min(MIN_REVIEW_LENGTH, `לפחות ${MIN_REVIEW_LENGTH} תווים`).max(5000, "עד 5,000 תווים"),
  paid: z.enum(["on"]).optional(),
  amountPaid: z.preprocess(blankToNull, z.coerce.number().int().min(0).max(1000000).nullable()),
  experienceDate: z.preprocess(
    blankToNull,
    z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .nullable(),
  ),
  verifiedPurchase: z.enum(["on"]).optional(),
  status: z.enum(["pending", "published", "hidden", "rejected"]),
  moderationNote: z.preprocess(blankToNull, z.string().trim().max(300).nullable()),
});

export async function saveAdminReview(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await adminClient();
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const paid = v.paid === "on";
  const row = {
    company_id: v.companyId,
    author_name: v.authorName,
    rating: v.rating,
    body: v.body,
    paid,
    amount_paid: paid ? v.amountPaid : null,
    experience_date: v.experienceDate ? `${v.experienceDate}-01` : null,
    verified_purchase: v.verifiedPurchase === "on",
    status: v.status,
    moderation_note: v.moderationNote,
  };

  if (v.id) {
    const { data: before } = await supabase.from("reviews").select("status").eq("id", v.id).single();
    const { error } = await supabase.from("reviews").update(row).eq("id", v.id);
    if (error) return { ok: false, message: friendlyError(error) };
    if (before?.status !== "published" && v.status === "published") {
      const id = v.id;
      after(() => notifyNewReview(id));
    }
    invalidate();
    return { ok: true, message: "נשמר." };
  }

  const { data, error } = await supabase.from("reviews").insert(row).select("id").single();
  if (error || !data) return { ok: false, message: friendlyError(error) };
  invalidate();
  redirect(`/admin/reviews/${data.id}?created=1`);
}

export async function setReviewStatus(
  id: string,
  status: "published" | "hidden" | "rejected" | "pending",
  note?: string,
) {
  const { supabase } = await adminClient();
  const { data: before } = await supabase.from("reviews").select("status").eq("id", id).single();
  const { error } = await supabase
    .from("reviews")
    .update({ status, ...(note !== undefined && { moderation_note: note || null }) })
    .eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  if (before?.status !== "published" && status === "published") after(() => notifyNewReview(id));
  invalidate();
  return { ok: true };
}

export async function deleteAdminReview(id: string, redirectTo?: string) {
  const { supabase } = await adminClient();
  const { data: receipts } = await supabase.from("receipts").select("storage_path").eq("review_id", id);
  const paths = (receipts ?? []).map((r) => r.storage_path).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from("receipts").remove(paths);
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  invalidate();
  if (redirectTo) redirect(redirectTo);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reports, receipts, claims
// ---------------------------------------------------------------------------

export async function resolveReport(id: string, outcome: "dismissed" | "actioned", hideReview: boolean, note: string) {
  const { supabase } = await adminClient();
  const { data: report, error: readError } = await supabase.from("reports").select("review_id").eq("id", id).single();
  if (readError || !report) return { ok: false, message: friendlyError(readError) };
  if (hideReview) {
    const { error } = await supabase
      .from("reviews")
      .update({ status: "hidden", moderation_note: note || "הוסתרה בעקבות דיווח" })
      .eq("id", report.review_id);
    if (error) return { ok: false, message: friendlyError(error) };
  }
  // Resolve every open report on the same review together.
  const { error } = await supabase
    .from("reports")
    .update({ status: outcome, resolution_note: note || null })
    .eq("review_id", report.review_id)
    .eq("status", "open");
  if (error) return { ok: false, message: friendlyError(error) };
  invalidate();
  return { ok: true };
}

export async function receiptSignedUrl(id: string) {
  const { supabase } = await adminClient();
  const { data } = await supabase.from("receipts").select("storage_path").eq("id", id).single();
  if (!data?.storage_path) return { ok: false as const, message: "הקובץ כבר נמחק." };
  const { data: signed, error } = await supabase.storage.from("receipts").createSignedUrl(data.storage_path, 600);
  if (error || !signed) return { ok: false as const, message: "לא הצלחנו לפתוח את הקובץ." };
  return { ok: true as const, url: signed.signedUrl };
}

export async function decideReceipt(id: string, approve: boolean, note: string) {
  const { supabase } = await adminClient();
  const { data } = await supabase.from("receipts").select("storage_path").eq("id", id).single();
  const { error } = await supabase
    .from("receipts")
    .update({ status: approve ? "approved" : "rejected", admin_note: note || null })
    .eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  // The file is only needed for the decision. Delete it right away.
  if (data?.storage_path) {
    await supabase.storage.from("receipts").remove([data.storage_path]);
    await supabase
      .from("receipts")
      .update({ storage_path: null, file_deleted_at: new Date().toISOString() })
      .eq("id", id);
  }
  after(() => notifyReceiptDecision(id));
  invalidate();
  return { ok: true };
}

export async function decideClaim(id: string, approve: boolean, note: string) {
  const { supabase } = await adminClient();
  const { error } = await supabase
    .from("company_claims")
    .update({ status: approve ? "approved" : "rejected", admin_note: note || null })
    .eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  after(() => notifyClaimDecision(id));
  invalidate();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Users & settings
// ---------------------------------------------------------------------------

export async function setUserRole(userId: string, role: "user" | "admin") {
  const { supabase, viewer } = await adminClient();
  if (userId === viewer.id) return { ok: false, message: "אי אפשר לשנות את ההרשאות של עצמך." };
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, message: friendlyError(error) };
  refresh();
  return { ok: true };
}

export async function setUserBanned(userId: string, banned: boolean) {
  const { supabase, viewer } = await adminClient();
  if (userId === viewer.id) return { ok: false, message: "אי אפשר להשעות את עצמך." };
  const { error } = await supabase.from("profiles").update({ is_banned: banned }).eq("id", userId);
  if (error) return { ok: false, message: friendlyError(error) };
  refresh();
  return { ok: true };
}

export async function saveSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await adminClient();
  const perDay = (k: string, fallback: number) => {
    const n = Number(formData.get(k));
    return Number.isInteger(n) && n >= 1 && n <= 100 ? n : fallback;
  };
  const values: [string, unknown][] = [
    ["require_phone_for_reviews", formData.get("require_phone_for_reviews") === "on"],
    ["auto_publish_reviews", formData.get("auto_publish_reviews") === "on"],
    ["reviews_per_day", perDay("reviews_per_day", 3)],
    ["companies_per_day", perDay("companies_per_day", 5)],
  ];
  for (const [key, value] of values) {
    const { error } = await supabase
      .from("app_settings")
      .update({ value: value as never })
      .eq("key", key);
    if (error) return { ok: false, message: friendlyError(error) };
  }
  refresh();
  return { ok: true, message: "ההגדרות נשמרו." };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categorySchema = z.object({
  originalId: z.string().optional(),
  id: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "אותיות לטיניות קטנות, ספרות ומקפים בלבד")
    .max(40),
  label: z.string().trim().min(2, "שם קצר מדי").max(60),
  description: z.string().trim().max(200).default(""),
  sortOrder: z.coerce.number().int().min(0).max(100000),
});

export async function saveCategory(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await adminClient();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const row = { id: v.id, label: v.label, description: v.description, sort_order: v.sortOrder };
  const { error } = v.originalId
    ? // Renaming the id cascades to companies (on update cascade).
      await supabase.from("categories").update(row).eq("id", v.originalId)
    : await supabase.from("categories").insert(row);
  if (error) {
    if (error.code === "23505") return { ok: false, fieldErrors: { id: "המזהה כבר קיים" } };
    return { ok: false, message: friendlyError(error) };
  }
  refresh();
  redirect(`/admin/categories?saved=${encodeURIComponent(v.id)}`);
}

export async function deleteCategory(id: string) {
  const { supabase } = await adminClient();
  const { count } = await supabase.from("companies").select("*", { count: "exact", head: true }).eq("category", id);
  if (count) return { ok: false, message: `יש בקטגוריה ${count} חברות. העבירו אותן לקטגוריה אחרת לפני המחיקה.` };
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  refresh();
  return { ok: true };
}
