"use client";

import { startTransition, useActionState } from "react";
import type { ActionState } from "@/lib/types";
import { saveSettings } from "../actions";
import { inputClass } from "../_components/field";

export function SettingsForm({
  initial,
}: {
  initial: { requirePhone: boolean; autoPublish: boolean; reviewsPerDay: number; companiesPerDay: number };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSettings, null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="divide-y divide-line rounded-2xl border border-line bg-surface"
    >
      <Toggle
        name="auto_publish_reviews"
        defaultChecked={initial.autoPublish}
        title="פרסום אוטומטי של ביקורות"
        body="ביקורת שעוברת את הבדיקה האוטומטית (בלי טלפונים, מיילים, קישורים או האשמות חמורות) עולה מיד. כשכבוי, כל ביקורת מחכה לאישור ידני."
      />
      <Toggle
        name="require_phone_for_reviews"
        defaultChecked={initial.requirePhone}
        title="חובת אימות טלפון"
        body="משתמשים יצטרכו לאמת מספר נייד לפני הביקורת הראשונה. מחייב ספק SMS מוגדר ב-Supabase (למשל Twilio)."
      />
      <NumberRow name="reviews_per_day" defaultValue={initial.reviewsPerDay} title="ביקורות ליום למשתמש" />
      <NumberRow name="companies_per_day" defaultValue={initial.companiesPerDay} title="הצעות חברה ליום למשתמש" />
      <div className="flex items-center gap-3 p-5">
        <button
          type="submit"
          disabled={pending}
          className="pressable rounded-xl bg-accent px-6 py-2.5 font-medium text-accent-ink disabled:opacity-60"
        >
          {pending ? "שומרים…" : "שמירה"}
        </button>
        {state?.message && (
          <p role="status" className={`appear text-sm ${state.ok ? "text-great" : "text-bad"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function Toggle({
  name,
  defaultChecked,
  title,
  body,
}: {
  name: string;
  defaultChecked: boolean;
  title: string;
  body: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 p-5">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
      />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{body}</span>
      </span>
    </label>
  );
}

function NumberRow({ name, defaultValue, title }: { name: string; defaultValue: number; title: string }) {
  return (
    <label className="flex items-center justify-between gap-4 p-5">
      <span className="font-semibold">{title}</span>
      <input
        type="number"
        name={name}
        min={1}
        max={100}
        defaultValue={defaultValue}
        className={`${inputClass} w-24 text-center`}
      />
    </label>
  );
}
