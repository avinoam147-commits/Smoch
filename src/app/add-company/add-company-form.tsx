"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { categories, type CategoryId } from "@/lib/data";

export function AddCompanyForm() {
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  if (done) {
    return (
      <div role="status" className="appear mt-8 rounded-2xl border border-line bg-surface p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-great" aria-hidden />
        <p className="mt-3 text-lg font-semibold">תודה, {name} נשלחה לבדיקה</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          בדרך כלל זה לוקח עד יום עבודה. נשלח לך מייל כשהדף יעלה, ואז אפשר לכתוב את הביקורת הראשונה.
        </p>
      </div>
    );
  }

  const nameError = name.trim().length < 2;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (nameError) setShowErrors(true);
        else setDone(true);
      }}
      className="mt-8 space-y-6"
    >
      <Input label="שם החברה או הקורס" value={name} onChange={setName} required />
      {showErrors && nameError && (
        <p role="alert" className="appear -mt-4 text-sm font-medium text-bad">כתבו את שם החברה</p>
      )}
      <div>
        <label htmlFor="category" className="block font-semibold">קטגוריה</label>
        <select
          id="category"
          defaultValue="courses"
          className="mt-2.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base"
        >
          {(Object.keys(categories) as CategoryId[]).map((id) => (
            <option key={id} value={id}>{categories[id].label}</option>
          ))}
        </select>
      </div>
      <Input label="אתר אינטרנט" placeholder="example.co.il" dir="ltr" inputMode="url" />
      <Input
        label="ח.פ. או ע.מ. (אם ידוע)"
        hint="מאפשר לאמת את החברה מול רשם החברות ולמנוע כפילויות."
        placeholder="51-XXXXXX-X"
        dir="ltr"
        inputMode="numeric"
      />
      <Input label="דף פייסבוק, אינסטגרם או טלגרם (אם יש)" dir="ltr" inputMode="url" />
      <button
        type="submit"
        className="pressable w-full rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-accent-ink hover:opacity-90"
      >
        שליחה לבדיקה
      </button>
    </form>
  );
}

function Input({
  label,
  hint,
  value,
  onChange,
  required,
  ...rest
}: {
  label: string;
  hint?: string;
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  inputMode?: "url" | "numeric";
}) {
  const id = label;
  return (
    <div>
      <label htmlFor={id} className="block font-semibold">
        {label}
        {required && <span className="text-bad"> *</span>}
      </label>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <input
        id={id}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        {...rest}
        className="mt-2.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none placeholder:text-muted focus:border-ink/40 [&[dir=ltr]]:text-left"
      />
    </div>
  );
}
