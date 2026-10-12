"use client";

import { startTransition, useActionState, useState } from "react";
import type { ActionState } from "@/lib/types";
import { RatingPicker } from "@/components/rating-picker";
import { saveAdminReview } from "../actions";
import { Field, inputClass } from "../_components/field";

export type ReviewFormValues = {
  id?: string;
  companyId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  paid: boolean;
  amountPaid: string;
  experienceDate: string;
  verifiedPurchase: boolean;
  status: string;
  moderationNote: string;
};

export function ReviewEditor({
  initial,
  companies,
  isUserReview,
}: {
  initial: ReviewFormValues;
  companies: { id: string; name: string }[];
  isUserReview: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveAdminReview, null);
  const [rating, setRating] = useState(initial.rating);
  const [paid, setPaid] = useState(initial.paid);
  const [bodyLen, setBodyLen] = useState(initial.body.length);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-5 rounded-2xl border border-line bg-surface p-5 sm:p-6"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      {!initial.id && (
        <p className="rounded-xl bg-surface-2 p-3 text-sm leading-relaxed">
          ביקורת שמוזנת כאן מסומנת באתר ״הוזנה על ידי הצוות״. השתמשו בזה רק להעברת ביקורת אמיתית באישור הכותב/ת (למשל
          ממייל או מאתר אחר), ולא לכתיבת ביקורות בשם אחרים.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="חברה" error={errors.companyId} required>
          {initial.id ? (
            <>
              <input type="hidden" name="companyId" value={initial.companyId} />
              <input
                disabled
                value={companies.find((c) => c.id === initial.companyId)?.name ?? ""}
                className={`${inputClass} opacity-70`}
              />
            </>
          ) : (
            <select name="companyId" defaultValue={initial.companyId} className={inputClass}>
              <option value="">בחרו חברה…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field
          label="שם מוצג של הכותב/ת"
          hint={isUserReview ? "ביקורת של משתמש רשום. שנו רק כדי להסיר פרט מזהה." : "שם פרטי ואות ראשונה"}
          error={errors.authorName}
          required
        >
          <input name="authorName" defaultValue={initial.authorName} maxLength={40} className={inputClass} />
        </Field>
      </div>

      <div>
        <span className="block text-sm font-semibold">דירוג *</span>
        <div className="mt-1.5">
          <RatingPicker value={rating} onChange={setRating} />
        </div>
        <input type="hidden" name="rating" value={rating || ""} />
        {errors.rating && <p className="mt-1 text-xs font-medium text-bad">{errors.rating}</p>}
      </div>

      <Field label="כותרת" error={errors.title} required>
        <input name="title" defaultValue={initial.title} maxLength={120} className={inputClass} />
      </Field>
      <Field label="תוכן" hint={`${bodyLen} תווים (מינימום 80)`} error={errors.body} required>
        <textarea
          name="body"
          defaultValue={initial.body}
          onChange={(e) => setBodyLen(e.target.value.trim().length)}
          rows={8}
          maxLength={5000}
          className={`${inputClass} leading-relaxed`}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="flex items-center gap-3 text-sm sm:col-span-3">
          <input
            type="checkbox"
            name="paid"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="size-5 accent-[var(--accent)]"
          />
          הכותב/ת שילם/ה לחברה
        </label>
        {paid && (
          <>
            <Field label="סכום ששולם (₪)" error={errors.amountPaid}>
              <input
                name="amountPaid"
                defaultValue={initial.amountPaid}
                inputMode="numeric"
                dir="ltr"
                className={`${inputClass} text-left`}
              />
            </Field>
            <Field label="חודש החוויה" error={errors.experienceDate}>
              <input type="month" name="experienceDate" defaultValue={initial.experienceDate} className={inputClass} />
            </Field>
          </>
        )}
      </div>

      <div className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
        <Field label="סטטוס" required>
          <select name="status" defaultValue={initial.status} className={inputClass}>
            <option value="published">מפורסמת</option>
            <option value="pending">ממתינה</option>
            <option value="hidden">מוסתרת</option>
            <option value="rejected">נדחתה</option>
          </select>
        </Field>
        <Field label="הערת מודרציה" hint="הכותב/ת רואה אותה בדף החשבון">
          <input name="moderationNote" defaultValue={initial.moderationNote} maxLength={300} className={inputClass} />
        </Field>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="verifiedPurchase"
            defaultChecked={initial.verifiedPurchase}
            className="size-5 accent-[var(--accent)]"
          />
          רכישה מאומתת
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="pressable rounded-xl bg-accent px-6 py-2.5 font-medium text-accent-ink disabled:opacity-60"
        >
          {pending ? "שומרים…" : initial.id ? "שמירה" : "יצירת ביקורת"}
        </button>
        {state?.message && (
          <p role="status" className={`appear text-sm ${state.ok ? "text-great" : "text-bad"}`}>
            {state.message}
          </p>
        )}
        {state && !state.ok && state.fieldErrors && <p className="appear text-sm text-bad">יש שדות לתיקון.</p>}
      </div>
    </form>
  );
}
