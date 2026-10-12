"use client";

import { useState, useTransition } from "react";

type Result = { ok: boolean; message?: string } | void;

const variants = {
  primary: "bg-accent text-accent-ink hover:opacity-90",
  dark: "bg-ink text-bg hover:bg-ink/85",
  outline: "border border-line bg-surface hover:border-ink/30",
  danger: "border border-bad/30 text-bad hover:bg-bad/5",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink",
};

/**
 * Runs a bound server action. With `confirm`, asks first; with `notePrompt`,
 * asks for an optional note that is passed as the action's last argument.
 */
export function ActionButton({
  action,
  children,
  variant = "outline",
  confirm: confirmText,
  notePrompt,
  size = "md",
}: {
  action: (note: string) => Promise<Result>;
  children: React.ReactNode;
  variant?: keyof typeof variants;
  confirm?: string;
  notePrompt?: string;
  size?: "sm" | "md";
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          let note = "";
          if (notePrompt) {
            const answer = window.prompt(notePrompt, "");
            if (answer === null) return;
            note = answer;
          }
          setError(null);
          start(async () => {
            const res = await action(note);
            if (res && !res.ok) setError(res.message ?? "הפעולה נכשלה.");
          });
        }}
        className={`pressable inline-flex items-center gap-1.5 rounded-lg font-medium disabled:opacity-50 ${
          size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
        } ${variants[variant]}`}
      >
        {pending ? "…" : children}
      </button>
      {error && <span className="text-xs text-bad">{error}</span>}
    </span>
  );
}
