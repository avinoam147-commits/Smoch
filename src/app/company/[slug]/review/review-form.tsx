"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, Paperclip } from "lucide-react";
import { RatingPicker } from "@/components/rating-picker";
import { GoogleButton } from "@/components/google-button";

const MIN_BODY = 80;

export function ReviewForm({ companyName, companySlug }: { companyName: string; companySlug: string }) {
  const [signedIn, setSignedIn] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bought, setBought] = useState(true);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  if (!signedIn) {
    return (
      <div className="appear mt-8 rounded-2xl border border-line bg-surface p-6 text-center sm:p-8">
        <p className="font-semibold">כדי לכתוב ביקורת צריך להתחבר</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          אנחנו מציגים רק שם פרטי ואות ראשונה משם המשפחה. כתובת המייל לא מתפרסמת.
        </p>
        <div className="mx-auto mt-5 max-w-xs">
          <GoogleButton onClick={() => setSignedIn(true)} />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div role="status" className="appear mt-8 rounded-2xl border border-line bg-surface p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-great" aria-hidden />
        <p className="mt-3 text-lg font-semibold">תודה, הביקורת התקבלה</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          היא תתפרסם אחרי בדיקה אוטומטית קצרה.
          {receipt && " הקבלה תיבדק ידנית, ואחרי האישור יתווסף לביקורת תג ״רכישה מאומתת״."}
        </p>
        <Link
          href={`/company/${companySlug}`}
          className="pressable mt-6 inline-flex rounded-xl bg-ink px-5 py-2.5 font-medium text-bg"
        >
          חזרה לדף של {companyName}
        </Link>
      </div>
    );
  }

  const errors = {
    rating: rating === 0 ? "בחרו דירוג" : null,
    title: title.trim().length < 4 ? "כתבו כותרת קצרה" : null,
    body: body.trim().length < MIN_BODY ? `עוד ${MIN_BODY - body.trim().length} תווים לפחות` : null,
    agreed: !agreed ? "צריך לאשר את כללי הכתיבה" : null,
  };
  const valid = Object.values(errors).every((e) => e === null);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) setSubmitted(true);
        else setShowErrors(true);
      }}
      className="appear mt-8 space-y-8"
    >
      <p className="flex items-center gap-2 text-sm text-muted">
        <span className="grid size-7 place-items-center rounded-full bg-accent-soft font-semibold text-accent">ד</span>
        מחובר/ת כ<strong className="font-medium text-ink">דנה כ.</strong> (חשבון לדוגמה)
      </p>

      <Field label="הדירוג שלך" error={showErrors ? errors.rating : null}>
        <RatingPicker value={rating} onChange={setRating} />
      </Field>

      <Field label="כותרת" error={showErrors ? errors.title : null} htmlFor="title">
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={90}
          placeholder="המשפט שמסכם את החוויה"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-ink/40"
        />
      </Field>

      <Field
        label="הביקורת"
        hint="מה הובטח, מה קיבלתם, איך היה השירות, והאם הייתם ממליצים."
        error={showErrors ? errors.body : null}
        htmlFor="body"
      >
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={7}
          className="w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-base leading-relaxed outline-none focus:border-ink/40"
        />
        <p className={`mt-1.5 text-xs tabular-nums ${body.trim().length >= MIN_BODY ? "text-great" : "text-muted"}`}>
          {body.trim().length} / {MIN_BODY} תווים מינימום
        </p>
      </Field>

      <fieldset className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <legend className="px-1 font-semibold">רכישה</legend>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={bought}
            onChange={(e) => setBought(e.target.checked)}
            className="size-5 accent-[var(--accent)]"
          />
          שילמתי על שירות או מוצר של החברה
        </label>
        {bought && (
          <div className="appear space-y-3">
            <p className="flex items-start gap-2 text-sm text-muted">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              צירוף קבלה או חשבונית מוסיף תג ״רכישה מאומתת״. הקובץ נבדק ידנית, לא מתפרסם, ונמחק אחרי הבדיקה.
            </p>
            <label className="pressable inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-4 py-2.5 text-sm hover:border-ink/30">
              <Paperclip className="size-4" aria-hidden />
              {receipt ?? "צירוף קבלה (PDF או תמונה)"}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(e) => setReceipt(e.target.files?.[0]?.name ?? null)}
              />
            </label>
          </div>
        )}
      </fieldset>

      <Field error={showErrors ? errors.agreed : null}>
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
          />
          <span>
            הביקורת מתארת חוויה אישית שלי, אין לי קשר לחברה או למתחרים שלה, והיא עומדת ב
            <Link href="/guidelines" target="_blank" className="font-medium text-accent hover:underline">
              כללי הכתיבה
            </Link>
            .
          </span>
        </label>
      </Field>

      <button
        type="submit"
        className="pressable w-full rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-accent-ink hover:opacity-90"
      >
        פרסום הביקורת
      </button>
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
  error?: string | null;
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
