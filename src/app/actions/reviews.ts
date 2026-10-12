"use server";

import { updateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { tags } from "@/lib/queries";
import { friendlyError } from "@/lib/errors";
import { notifyNewReview, notifyReplyPosted } from "@/lib/notify";
import { reportReasons, type ReportReason } from "@/lib/format";

function refresh() {
  updateTag(tags.reviews);
  updateTag(tags.companies);
}

const reviewSchema = z.object({
  reviewId: z.string().uuid().optional().or(z.literal("")),
  companyId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "בחרו דירוג").max(5),
  title: z.string().trim().min(4, "כתבו כותרת של 4 תווים לפחות").max(120, "הכותרת ארוכה מדי"),
  body: z.string().trim().min(80, "הביקורת צריכה להכיל לפחות 80 תווים").max(5000, "הביקורת ארוכה מדי"),
  paid: z.enum(["on"]).optional(),
  amountPaid: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d]/g, ""))
    .pipe(z.string().max(7))
    .optional(),
  experienceDate: z
    .string()
    .regex(/^\d{4}-\d{2}(-\d{2})?$/)
    .optional()
    .or(z.literal("")),
  agreed: z.literal("on", { message: "צריך לאשר את כללי הכתיבה" }),
});

export type SaveReviewResult =
  | { ok: true; reviewId: string; status: string; note: string | null }
  | { ok: false; message?: string; fieldErrors?: Record<string, string> };

export async function saveReview(_: unknown, formData: FormData): Promise<SaveReviewResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר כדי לכתוב ביקורת." };

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, fieldErrors };
  }
  const v = parsed.data;
  const paid = v.paid === "on";
  const row = {
    company_id: v.companyId,
    rating: v.rating,
    title: v.title,
    body: v.body,
    paid,
    amount_paid: paid && v.amountPaid ? Number(v.amountPaid) : null,
    experience_date: v.experienceDate
      ? v.experienceDate.length === 7
        ? `${v.experienceDate}-01`
        : v.experienceDate
      : null,
  };

  const supabase = await createClient();
  const query = v.reviewId
    ? supabase.from("reviews").update(row).eq("id", v.reviewId).eq("user_id", viewer.id)
    : supabase.from("reviews").insert({ ...row, author_name: viewer.displayName });
  const { data, error } = await query.select("id, status, moderation_note").single();
  if (error || !data) return { ok: false, message: friendlyError(error) };

  refresh();
  if (data.status === "published" && !v.reviewId) after(() => notifyNewReview(data.id));
  return { ok: true, reviewId: data.id, status: data.status, note: data.moderation_note };
}

export async function deleteMyReview(reviewId: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר." };
  const supabase = await createClient();
  // Remove any receipt files first; the rows cascade with the review.
  const { data: receipts } = await supabase.from("receipts").select("storage_path").eq("review_id", reviewId);
  const paths = (receipts ?? []).map((r) => r.storage_path).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from("receipts").remove(paths);
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId).eq("user_id", viewer.id);
  if (error) return { ok: false, message: friendlyError(error) };
  refresh();
  return { ok: true };
}

export async function toggleHelpful(reviewId: string, on: boolean) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר כדי לסמן ביקורת כמועילה." };
  const supabase = await createClient();
  const { error } = on
    ? await supabase.from("review_votes").insert({ review_id: reviewId, user_id: viewer.id })
    : await supabase.from("review_votes").delete().eq("review_id", reviewId).eq("user_id", viewer.id);
  if (error && error.code !== "23505") return { ok: false, message: friendlyError(error) };
  updateTag(tags.reviews);
  return { ok: true };
}

export async function reportReview(reviewId: string, reason: ReportReason, details: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר כדי לדווח." };
  if (!(reason in reportReasons)) return { ok: false, message: "בחרו סיבה." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .insert({ review_id: reviewId, reason, details: details.trim().slice(0, 1000) || null });
  if (error) return { ok: false, message: friendlyError(error) };
  return { ok: true };
}

/** Called after the browser uploaded the file to receipts/{uid}/... */
export async function registerReceipt(reviewId: string, storagePath: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר." };
  if (!storagePath.startsWith(`${viewer.id}/`)) return { ok: false, message: "קובץ לא תקין." };
  const supabase = await createClient();
  const { error } = await supabase.from("receipts").insert({ review_id: reviewId, storage_path: storagePath });
  if (error) {
    await supabase.storage.from("receipts").remove([storagePath]);
    return { ok: false, message: friendlyError(error) };
  }
  return { ok: true };
}

export async function saveReply(reviewId: string, body: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר." };
  const text = body.trim();
  if (text.length < 2 || text.length > 2000) return { ok: false, message: "התגובה צריכה להכיל בין 2 ל-2,000 תווים." };
  const supabase = await createClient();
  const { data: review } = await supabase.from("reviews").select("company_id").eq("id", reviewId).maybeSingle();
  if (!review) return { ok: false, message: "הביקורת לא נמצאה." };
  const { data: existing } = await supabase
    .from("review_replies")
    .select("review_id")
    .eq("review_id", reviewId)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("review_replies").update({ body: text }).eq("review_id", reviewId)
    : await supabase.from("review_replies").insert({ review_id: reviewId, body: text, company_id: review.company_id });
  if (error) return { ok: false, message: friendlyError(error) };
  updateTag(tags.reviews);
  if (!existing) after(() => notifyReplyPosted(reviewId));
  return { ok: true };
}

export async function deleteReply(reviewId: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר." };
  const supabase = await createClient();
  const { error } = await supabase.from("review_replies").delete().eq("review_id", reviewId);
  if (error) return { ok: false, message: friendlyError(error) };
  updateTag(tags.reviews);
  return { ok: true };
}
