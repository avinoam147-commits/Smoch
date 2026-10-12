"use client";

import { startTransition, useActionState } from "react";
import { updateProfile } from "@/app/actions/account";

export function ProfileForm({ displayName, notifyEmail }: { displayName: string; notifyEmail: boolean }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="displayName" className="block text-sm font-semibold">
          השם שמוצג על הביקורות
        </label>
        <p className="mt-0.5 text-sm text-muted">
          מומלץ שם פרטי ואות ראשונה משם המשפחה. ביקורות קיימות שומרות את השם הקודם.
        </p>
        <input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          maxLength={40}
          className="mt-2 w-full max-w-xs rounded-xl border border-line bg-surface px-4 py-2.5 text-base outline-none focus:border-ink/40"
        />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="notifyEmail"
          defaultChecked={notifyEmail}
          className="size-5 accent-[var(--accent)]"
        />
        לשלוח לי מייל כשמגיבים לביקורת שלי או כשבקשה שלי מטופלת
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="pressable rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-bg disabled:opacity-60"
        >
          שמירה
        </button>
        {state && (
          <p role="status" className={`appear text-sm ${state.ok ? "text-great" : "text-bad"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
