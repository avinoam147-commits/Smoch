"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { slugify } from "@/lib/slug";
import type { ActionState } from "@/lib/types";
import { saveCategory } from "../actions";
import { Field, inputClass } from "../_components/field";

type Values = { originalId?: string; id: string; label: string; description: string; sortOrder: number };

export function CategoryForm({ initial }: { initial: Values }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveCategory, null);
  const [label, setLabel] = useState(initial.label);
  const [id, setId] = useState(initial.id);
  const [idTouched, setIdTouched] = useState(Boolean(initial.originalId));
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const editing = Boolean(initial.originalId);

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
      <h2 className="font-bold">{editing ? `עריכת ״${initial.label}״` : "קטגוריה חדשה"}</h2>
      {editing && <input type="hidden" name="originalId" value={initial.originalId} />}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,0.7fr)]">
        <Field label="שם" error={errors.label} required>
          <input
            name="label"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (!idTouched) setId(slugify(e.target.value));
            }}
            maxLength={60}
            placeholder="למשל: מוסכים"
            className={inputClass}
          />
        </Field>
        <Field
          label="מזהה בכתובת"
          hint={editing ? "שינוי המזהה מעדכן את כל החברות בקטגוריה" : `smoch.co.il/companies?category=${id || "…"}`}
          error={errors.id}
          required
        >
          <input
            name="id"
            value={id}
            dir="ltr"
            onChange={(e) => {
              setIdTouched(true);
              setId(e.target.value.toLowerCase());
            }}
            className={`${inputClass} text-left`}
          />
        </Field>
        <Field label="סדר" error={errors.sortOrder}>
          <input
            name="sortOrder"
            defaultValue={initial.sortOrder}
            inputMode="numeric"
            dir="ltr"
            className={`${inputClass} text-left`}
          />
        </Field>
      </div>
      <Field label="תיאור קצר (לא חובה)" error={errors.description}>
        <input name="description" defaultValue={initial.description} maxLength={200} className={inputClass} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="pressable rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink disabled:opacity-60"
        >
          {pending ? "שומרים…" : editing ? "שמירה" : "הוספת קטגוריה"}
        </button>
        {editing && (
          <Link href="/admin/categories" className="text-sm text-muted hover:text-ink">
            ביטול
          </Link>
        )}
        {state && !state.ok && state.message && <p className="appear text-sm text-bad">{state.message}</p>}
      </div>
    </form>
  );
}
