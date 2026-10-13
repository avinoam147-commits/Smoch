"use client";

import { startTransition, useActionState, useState, useTransition } from "react";
import { slugify } from "@/lib/slug";
import type { Category } from "@/lib/types";
import type { ActionState } from "@/lib/types";
import { saveCompany, verifyRegistry } from "../actions";
import { Field, inputClass } from "../_components/field";

export type CompanyFormValues = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  tagline: string;
  about: string;
  website: string;
  socialUrl: string;
  registryId: string;
  registryVerified: boolean;
  city: string;
  founded: string;
  priceRange: string;
  status: string;
  adminNote: string;
};

export function CompanyEditor({ initial, categories }: { initial: CompanyFormValues; categories: Category[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveCompany, null);
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [registryId, setRegistryId] = useState(initial.registryId);
  const [verified, setVerified] = useState(initial.registryVerified);
  const [registryMsg, setRegistryMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, startCheck] = useTransition();
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-6"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <Section title="פרטים בסיסיים">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="שם" error={errors.name} required>
            <input
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              className={inputClass}
            />
          </Field>
          <Field label="כתובת בדף (slug)" hint={`smoch.co.il/company/${slug || "…"}`} error={errors.slug} required>
            <input
              name="slug"
              value={slug}
              dir="ltr"
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              className={`${inputClass} text-left`}
            />
          </Field>
          <Field label="קטגוריה" required>
            <select name="category" defaultValue={initial.category} className={inputClass}>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="סטטוס" required>
            <select name="status" defaultValue={initial.status} className={inputClass}>
              <option value="published">באוויר</option>
              <option value="pending">ממתינה</option>
              <option value="hidden">מוסתרת</option>
              <option value="rejected">נדחתה</option>
            </select>
          </Field>
        </div>
        <Field label="שורת תיאור" hint="עד 160 תווים. מופיעה בכרטיס ובראש הדף." error={errors.tagline}>
          <input name="tagline" defaultValue={initial.tagline} maxLength={160} className={inputClass} />
        </Field>
        <Field label="על החברה" error={errors.about}>
          <textarea name="about" defaultValue={initial.about} rows={5} maxLength={3000} className={inputClass} />
        </Field>
      </Section>

      <Section title="פרטי קשר ומידע">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="אתר" error={errors.website}>
            <input name="website" defaultValue={initial.website} dir="ltr" className={`${inputClass} text-left`} />
          </Field>
          <Field label="רשת חברתית" error={errors.socialUrl}>
            <input name="socialUrl" defaultValue={initial.socialUrl} dir="ltr" className={`${inputClass} text-left`} />
          </Field>
          <Field label="עיר" error={errors.city}>
            <input name="city" defaultValue={initial.city} className={inputClass} />
          </Field>
          <Field label="שנת הקמה" error={errors.founded}>
            <input
              name="founded"
              defaultValue={initial.founded}
              inputMode="numeric"
              dir="ltr"
              className={`${inputClass} text-left`}
            />
          </Field>
          <Field label="טווח מחירים" hint="למשל ₪2,900–₪4,500" error={errors.priceRange}>
            <input name="priceRange" defaultValue={initial.priceRange} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="רשם החברות">
        <Field label="ח.פ. / ע.מ." error={errors.registryId}>
          <div className="flex gap-2">
            <input
              name="registryId"
              value={registryId}
              onChange={(e) => setRegistryId(e.target.value)}
              dir="ltr"
              className={`${inputClass} text-left`}
            />
            {initial.id && (
              <button
                type="button"
                disabled={checking || !registryId.trim()}
                onClick={() =>
                  startCheck(async () => {
                    const res = await verifyRegistry(initial.id!, registryId);
                    setRegistryMsg({ ok: res.ok, text: res.message ?? "" });
                    if (res.ok) setVerified(true);
                  })
                }
                className="pressable shrink-0 rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-ink/30 disabled:opacity-50"
              >
                {checking ? "בודקים…" : "אימות מול הרשם"}
              </button>
            )}
          </div>
        </Field>
        {registryMsg && (
          <p role="status" className={`appear text-sm ${registryMsg.ok ? "text-great" : "text-bad"}`}>
            {registryMsg.text}
          </p>
        )}
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="registryVerified"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
            className="size-5 accent-[var(--accent)]"
          />
          החברה אומתה מול רשם החברות (מוצג תג באתר)
        </label>
      </Section>

      <Section title="הערה פנימית">
        <Field label="הערת צוות" hint="אם החברה נדחית, ההערה נשלחת למי שהציע אותה.">
          <textarea name="adminNote" defaultValue={initial.adminNote} rows={2} maxLength={500} className={inputClass} />
        </Field>
      </Section>

      <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-2xl border border-line bg-surface/90 p-3 backdrop-blur">
        <button
          type="submit"
          disabled={pending}
          className="pressable rounded-xl bg-accent px-6 py-2.5 font-medium text-accent-ink disabled:opacity-60"
        >
          {pending ? "שומרים…" : initial.id ? "שמירה" : "יצירת חברה"}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <legend className="px-1 font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}
