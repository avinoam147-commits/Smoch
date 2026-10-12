"use client";

import { startTransition, useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { claimCompany, type ClaimResult } from "@/app/actions/companies";

export function ClaimForm({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [result, formAction, pending] = useActionState<ClaimResult | null, FormData>(claimCompany, null);

  if (result?.ok) {
    return (
      <div role="status" className="appear mt-8 rounded-2xl border border-line bg-surface p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-great" aria-hidden />
        <p className="mt-3 text-lg font-semibold">הבקשה נשלחה</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          נבדוק את הקשר שלך ל{companyName}, בדרך כלל דרך המייל של החברה, ונעדכן במייל.
        </p>
      </div>
    );
  }
  const errors = result && !result.ok ? (result.fieldErrors ?? {}) : {};

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="appear mt-8 space-y-5"
    >
      <input type="hidden" name="companyId" value={companyId} />
      <Input name="fullName" label="שם מלא" error={errors.fullName} />
      <Input name="jobTitle" label="תפקיד בחברה" error={errors.jobTitle} />
      <Input
        name="workEmail"
        label="מייל בדומיין של החברה"
        hint="דרכו נוודא שאת/ה עובד/ת בחברה. עם מייל פרטי (gmail וכו׳) הבדיקה תיקח יותר זמן."
        ltr
        error={errors.workEmail}
      />
      <Input name="phone" label="טלפון (לא חובה)" ltr />
      <div>
        <label htmlFor="message" className="block font-semibold">
          הערות (לא חובה)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          maxLength={1000}
          className="mt-2.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-ink/40"
        />
      </div>
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
        {pending ? "שולחים…" : "שליחת בקשה"}
      </button>
    </form>
  );
}

function Input({
  name,
  label,
  hint,
  ltr,
  error,
}: {
  name: string;
  label: string;
  hint?: string;
  ltr?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block font-semibold">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <input
        id={name}
        name={name}
        dir={ltr ? "ltr" : undefined}
        className={`mt-2.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-ink/40 ${ltr ? "text-left" : ""}`}
      />
      {error && (
        <p role="alert" className="appear mt-1.5 text-sm font-medium text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
