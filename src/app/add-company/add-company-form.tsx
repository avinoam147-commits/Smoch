"use client";

import { startTransition, useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Search } from "lucide-react";
import { suggestCompany, type SuggestResult } from "@/app/actions/companies";
import { lookupRegistryAction } from "@/app/actions/registry";
import type { Category } from "@/lib/types";

export function AddCompanyForm({ categories }: { categories: Category[] }) {
  const [result, formAction, pending] = useActionState<SuggestResult | null, FormData>(suggestCompany, null);
  const [name, setName] = useState("");
  const [registryId, setRegistryId] = useState("");
  const [lookup, setLookup] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [looking, startLookup] = useTransition();

  if (result?.ok) {
    return (
      <div role="status" className="appear mt-8 rounded-2xl border border-line bg-surface p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-great" aria-hidden />
        <p className="mt-3 text-lg font-semibold">תודה, {result.name} נשלחה לבדיקה</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          בדרך כלל זה לוקח עד יום עבודה. נשלח לך מייל כשהדף יעלה, ואז אפשר לכתוב את הביקורת הראשונה.
        </p>
        <Link href="/account" className="pressable mt-6 inline-flex rounded-xl bg-ink px-5 py-2.5 font-medium text-bg">
          למעקב בדף החשבון
        </Link>
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
      className="appear mt-8 space-y-6"
    >
      <div>
        <Label htmlFor="registryId">ח.פ. או ע.מ. (אם ידוע)</Label>
        <p className="mt-0.5 text-sm text-muted">מאפשר לאמת את החברה מול רשם החברות ולמנוע כפילויות.</p>
        <div className="mt-2.5 flex gap-2">
          <input
            id="registryId"
            name="registryId"
            value={registryId}
            onChange={(e) => setRegistryId(e.target.value)}
            placeholder="51-XXXXXX-X"
            dir="ltr"
            inputMode="numeric"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-left text-base outline-none placeholder:text-muted focus:border-ink/40"
          />
          <button
            type="button"
            disabled={looking || registryId.replace(/\D/g, "").length < 8}
            onClick={() =>
              startLookup(async () => {
                const res = await lookupRegistryAction(registryId);
                if (res.ok) {
                  setName((n) => n || res.record.name);
                  setLookup({
                    tone: "ok",
                    text: `נמצאה: ${res.record.name}${res.record.status ? ` (${res.record.status})` : ""}`,
                  });
                } else setLookup({ tone: "err", text: res.error });
              })
            }
            className="pressable inline-flex shrink-0 items-center gap-2 rounded-xl border border-line bg-surface px-4 font-medium hover:border-ink/30 disabled:opacity-50"
          >
            <Search className="size-4" aria-hidden />
            {looking ? "מחפשים…" : "חיפוש"}
          </button>
        </div>
        {lookup && (
          <p role="status" className={`appear mt-1.5 text-sm ${lookup.tone === "ok" ? "text-great" : "text-muted"}`}>
            {lookup.text}
          </p>
        )}
        <FieldError text={errors.registryId} />
      </div>

      <div>
        <Label htmlFor="name" required>
          שם החברה או הקורס
        </Label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          className="mt-2.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-ink/40"
        />
        <FieldError text={errors.name} />
      </div>

      <div>
        <Label htmlFor="category" required>
          קטגוריה
        </Label>
        <select
          id="category"
          name="category"
          defaultValue={categories[0]?.id}
          className="mt-2.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <TextInput name="website" label="אתר אינטרנט" placeholder="example.co.il" ltr error={errors.website} />
      <TextInput name="socialUrl" label="דף פייסבוק, אינסטגרם או טלגרם (אם יש)" ltr error={errors.socialUrl} />

      <div>
        <Label htmlFor="note">משהו שכדאי שנדע? (לא חובה)</Label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
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
        {pending ? "שולחים…" : "שליחה לבדיקה"}
      </button>
    </form>
  );
}

function Label({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block font-semibold">
      {children}
      {required && <span className="text-bad"> *</span>}
    </label>
  );
}

function FieldError({ text }: { text?: string }) {
  return text ? (
    <p role="alert" className="appear mt-1.5 text-sm font-medium text-bad">
      {text}
    </p>
  ) : null;
}

function TextInput({
  name,
  label,
  placeholder,
  ltr,
  error,
}: {
  name: string;
  label: string;
  placeholder?: string;
  ltr?: boolean;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <input
        id={name}
        name={name}
        placeholder={placeholder}
        dir={ltr ? "ltr" : undefined}
        inputMode={ltr ? "url" : undefined}
        className={`mt-2.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none placeholder:text-muted focus:border-ink/40 ${ltr ? "text-left" : ""}`}
      />
      <FieldError text={error} />
    </div>
  );
}
