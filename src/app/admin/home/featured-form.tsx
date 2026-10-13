"use client";

import { startTransition, useActionState } from "react";
import Link from "next/link";
import type { ActionState } from "@/lib/types";
import { saveFeatured } from "../actions";
import { Field, inputClass } from "../_components/field";

type Values = { id?: string; companyId: string; companyName?: string; sponsored: boolean; endsAt: string };

export function FeaturedForm({ initial, companies }: { initial: Values; companies: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveFeatured, null);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const editing = Boolean(initial.id);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6"
    >
      <h2 className="font-bold">{editing ? `עריכת ״${initial.companyName}״` : "הוספת חברה לדף הבית"}</h2>
      {editing && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Field label="חברה" error={errors.companyId} required>
          {editing ? (
            <>
              <input type="hidden" name="companyId" value={initial.companyId} />
              <input value={initial.companyName} disabled className={`${inputClass} opacity-70`} />
            </>
          ) : (
            <select name="companyId" defaultValue="" className={inputClass}>
              <option value="" disabled>
                בחרו חברה…
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="עד תאריך (לא חובה)" hint="אחרי התאריך החברה יורדת מדף הבית לבד" error={errors.endsAt}>
          <input type="date" name="endsAt" defaultValue={initial.endsAt} dir="ltr" className={inputClass} />
        </Field>
      </div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="sponsored"
          defaultChecked={initial.sponsored}
          className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
        />
        <span>
          <span className="block text-sm font-semibold">תווית ״ממומן״</span>
          <span className="mt-0.5 block text-xs text-muted">
            חובה כשהחברה שילמה על המקום. אפשר להוריד רק כשבחרתם בה בלי תשלום.
          </span>
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="pressable rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink disabled:opacity-60"
        >
          {pending ? "שומרים…" : editing ? "שמירה" : "הוספה לדף הבית"}
        </button>
        {editing && (
          <Link href="/admin/home" className="text-sm text-muted hover:text-ink">
            ביטול
          </Link>
        )}
        {state && !state.ok && state.message && <p className="appear text-sm text-bad">{state.message}</p>}
      </div>
    </form>
  );
}
