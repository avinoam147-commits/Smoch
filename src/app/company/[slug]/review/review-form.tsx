"use client";

import { startTransition, useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, BadgeCheck, CheckCircle2, Clock, Paperclip, X } from "lucide-react";
import { RatingPicker } from "@/components/rating-picker";
import { saveReview, registerReceipt, deleteMyReview, type SaveReviewResult } from "@/app/actions/reviews";
import { createClient } from "@/lib/supabase/browser";
import { moderationWarning } from "@/lib/moderation";

const MIN_BODY = 80;
const MAX_FILE = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

export type ReviewDefaults = {
  id: string;
  rating: number;
  title: string;
  body: string;
  paid: boolean;
  amountPaid: number | null;
  experienceDate: string;
  status: string;
  moderationNote: string | null;
  verifiedPurchase: boolean;
};

export function ReviewForm({
  companyId,
  companySlug,
  companyName,
  viewer,
  defaults,
  hasPendingReceipt,
}: {
  companyId: string;
  companySlug: string;
  companyName: string;
  viewer: { id: string; displayName: string };
  defaults: ReviewDefaults | null;
  hasPendingReceipt: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(defaults?.rating ?? 0);
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [body, setBody] = useState(defaults?.body ?? "");
  const [paid, setPaid] = useState(defaults?.paid ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [receiptState, setReceiptState] = useState<"none" | "uploaded" | "failed">("none");
  const [deleting, startDelete] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const [result, formAction, pending] = useActionState<SaveReviewResult | null, FormData>(async (prev, formData) => {
    const res = await saveReview(prev, formData);
    if (res.ok && file) {
      const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-60);
      const path = `${viewer.id}/${res.reviewId}/${Date.now()}-${safeName}`;
      const supabase = createClient();
      const { error } = await supabase.storage.from("receipts").upload(path, file, { contentType: file.type });
      const registered = error ? { ok: false } : await registerReceipt(res.reviewId, path);
      setReceiptState(registered.ok ? "uploaded" : "failed");
    }
    return res;
  }, null);

  const errors = result && !result.ok ? (result.fieldErrors ?? {}) : {};
  const warning = moderationWarning(`${title} ${body}`);
  const canAttach = !defaults?.verifiedPurchase && !hasPendingReceipt;

  if (result?.ok) {
    const published = result.status === "published";
    return (
      <div role="status" className="appear mt-8 rounded-2xl border border-line bg-surface p-8 text-center">
        {published ? (
          <CheckCircle2 className="mx-auto size-10 text-great" aria-hidden />
        ) : (
          <Clock className="mx-auto size-10 text-mixed" aria-hidden />
        )}
        <p className="mt-3 text-lg font-semibold">{published ? "תודה, הביקורת פורסמה" : "תודה, הביקורת התקבלה"}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          {published
            ? "היא כבר מופיעה בדף החברה."
            : `היא תתפרסם אחרי בדיקה ידנית קצרה${result.note ? ` (${result.note})` : ""}.`}
          {receiptState === "uploaded" && " הקבלה תיבדק ידנית, ואחרי האישור יתווסף תג ״רכישה מאומתת״."}
          {receiptState === "failed" && " את הקבלה לא הצלחנו להעלות. אפשר לנסות שוב מדף העריכה."}
        </p>
        <Link
          href={`/company/${companySlug}${published ? `#review-${result.reviewId}` : ""}`}
          className="pressable mt-6 inline-flex rounded-xl bg-ink px-5 py-2.5 font-medium text-bg"
        >
          חזרה לדף של {companyName}
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      // Submitting manually keeps the fields filled when validation fails
      // (a plain form action resets uncontrolled inputs).
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="appear mt-8 space-y-8"
    >
      <input type="hidden" name="companyId" value={companyId} />
      {defaults && <input type="hidden" name="reviewId" value={defaults.id} />}

      <p className="flex items-center gap-2 text-sm text-muted">
        <span className="grid size-7 place-items-center rounded-full bg-accent-soft font-semibold text-accent">
          {viewer.displayName.charAt(0)}
        </span>
        יפורסם בשם <strong className="font-medium text-ink">{viewer.displayName}</strong>
        <Link href="/account" className="text-xs underline">
          שינוי
        </Link>
      </p>

      {defaults && defaults.status !== "published" && (
        <p className="flex items-start gap-2 rounded-xl bg-surface-2 p-4 text-sm">
          <Clock className="mt-0.5 size-4 shrink-0 text-mixed" aria-hidden />
          {defaults.status === "pending"
            ? `הביקורת ממתינה לבדיקה${defaults.moderationNote ? `: ${defaults.moderationNote}` : ""}.`
            : "הביקורת הוסתרה על ידי הצוות ולא מוצגת באתר."}
        </p>
      )}

      <Field label="הדירוג שלך" error={errors.rating}>
        <RatingPicker value={rating} onChange={setRating} />
        <input type="hidden" name="rating" value={rating || ""} />
      </Field>

      <Field label="כותרת" error={errors.title} htmlFor="title">
        <input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="המשפט שמסכם את החוויה"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-ink/40"
        />
      </Field>

      <Field
        label="הביקורת"
        hint="מה הובטח, מה קיבלתם, איך היה השירות, והאם הייתם ממליצים."
        error={errors.body}
        htmlFor="body"
      >
        <textarea
          id="body"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          maxLength={5000}
          className="w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-base leading-relaxed outline-none focus:border-ink/40"
        />
        <p className={`mt-1.5 text-xs tabular-nums ${body.trim().length >= MIN_BODY ? "text-great" : "text-muted"}`}>
          {body.trim().length} / {MIN_BODY} תווים מינימום
        </p>
        {warning && (
          <p className="appear mt-2 flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-mixed" aria-hidden />
            <span>
              הטקסט מכיל {warning}, ולכן הביקורת תעבור בדיקה ידנית לפני פרסום. כדאי לתאר מה קרה במקום להאשים, ולא לכלול
              פרטים אישיים.{" "}
              <Link href="/guidelines" target="_blank" className="font-medium text-accent hover:underline">
                כללי הכתיבה
              </Link>
            </span>
          </p>
        )}
      </Field>

      <fieldset className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <legend className="px-1 font-semibold">רכישה</legend>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="paid"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="size-5 accent-[var(--accent)]"
          />
          שילמתי על שירות או מוצר של החברה
        </label>
        {paid && (
          <div className="appear grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">כמה שילמת? (לא חובה)</span>
              <span className="mt-1.5 flex items-center rounded-xl border border-line bg-surface focus-within:border-ink/40">
                <span className="ps-3 text-muted">₪</span>
                <input
                  name="amountPaid"
                  inputMode="numeric"
                  defaultValue={defaults?.amountPaid ?? ""}
                  className="w-full bg-transparent px-2 py-2.5 text-base outline-none"
                  dir="ltr"
                />
              </span>
            </label>
            <label className="block text-sm">
              <span className="font-medium">מתי? (לא חובה)</span>
              <input
                type="month"
                name="experienceDate"
                defaultValue={defaults?.experienceDate ?? ""}
                max={new Date().toISOString().slice(0, 7)}
                className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-ink/40"
              />
            </label>
          </div>
        )}
        {paid && canAttach && (
          <div className="appear space-y-3">
            <p className="flex items-start gap-2 text-sm text-muted">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              צירוף קבלה או חשבונית מוסיף תג ״רכישה מאומתת״. הקובץ נבדק ידנית, לא מתפרסם, ונמחק אחרי הבדיקה. אפשר להסתיר
              בו פרטים שלא קשורים לרכישה.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="pressable inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-4 py-2.5 text-sm hover:border-ink/30">
                <Paperclip className="size-4" aria-hidden />
                <span className="max-w-56 truncate">{file ? file.name : "צירוף קבלה (PDF או תמונה, עד 5MB)"}</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept={ACCEPT.join(",")}
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFileError(null);
                    if (f && !ACCEPT.includes(f.type)) {
                      setFileError("אפשר לצרף רק PDF או תמונה.");
                      e.target.value = "";
                      return;
                    }
                    if (f && f.size > MAX_FILE) {
                      setFileError("הקובץ גדול מ-5MB.");
                      e.target.value = "";
                      return;
                    }
                    setFile(f);
                  }}
                />
              </label>
              {file && (
                <button
                  type="button"
                  aria-label="הסרת הקובץ"
                  onClick={() => {
                    setFile(null);
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                  className="pressable grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            {fileError && <p className="text-sm text-bad">{fileError}</p>}
          </div>
        )}
        {defaults?.verifiedPurchase && (
          <p className="flex items-center gap-2 text-sm text-accent">
            <BadgeCheck className="size-4" aria-hidden /> הרכישה כבר אומתה.
          </p>
        )}
        {hasPendingReceipt && <p className="text-sm text-muted">הקבלה שצירפת ממתינה לבדיקה.</p>}
      </fieldset>

      <Field error={errors.agreed}>
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" name="agreed" className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
          <span>
            הביקורת מתארת חוויה אישית שלי, אין לי קשר לחברה או למתחרים שלה, והיא עומדת ב
            <Link href="/guidelines" target="_blank" className="font-medium text-accent hover:underline">
              כללי הכתיבה
            </Link>
            .
          </span>
        </label>
      </Field>

      {result && !result.ok && result.message && (
        <p role="alert" className="appear rounded-xl bg-surface-2 p-4 text-sm font-medium text-bad">
          {result.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="pressable w-full rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-accent-ink hover:opacity-90 disabled:opacity-70"
      >
        {pending ? "שומרים…" : defaults ? "שמירת השינויים" : "פרסום הביקורת"}
      </button>

      {defaults && (
        <button
          type="button"
          disabled={deleting}
          onClick={() => {
            if (!confirm("למחוק את הביקורת? אי אפשר לבטל את הפעולה.")) return;
            startDelete(async () => {
              const res = await deleteMyReview(defaults.id);
              if (res.ok) router.push(`/company/${companySlug}`);
              else alert(res.message);
            });
          }}
          className="pressable w-full rounded-xl px-6 py-3 text-sm font-medium text-bad hover:bg-surface-2"
        >
          מחיקת הביקורת
        </button>
      )}
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="block font-semibold">
          {label}
        </label>
      )}
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className={label ? "mt-2.5" : ""}>{children}</div>
      {error && (
        <p role="alert" className="appear mt-1.5 text-sm font-medium text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
