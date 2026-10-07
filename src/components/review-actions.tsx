"use client";

import { useState } from "react";
import { Flag, ThumbsUp } from "lucide-react";

const reasons = ["מידע אישי או פוגעני", "ביקורת מזויפת או ממומנת", "לא חוויה אישית", "אחר"];

export function ReviewActions({ helpful }: { helpful: number }) {
  const [voted, setVoted] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-1 text-sm">
        <button
          type="button"
          onClick={() => setVoted((v) => !v)}
          aria-pressed={voted}
          className={`pressable inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${
            voted ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
          }`}
        >
          <ThumbsUp className="size-4" aria-hidden />
          מועיל
          <span className="tabular-nums">{helpful + (voted ? 1 : 0)}</span>
        </button>
        {!reported && (
          <button
            type="button"
            onClick={() => setReporting((r) => !r)}
            aria-expanded={reporting}
            className="pressable inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-ink"
          >
            <Flag className="size-4" aria-hidden />
            דיווח
          </button>
        )}
      </div>

      {reporting && !reported && (
        <div className="appear rounded-xl border border-line bg-surface-2 p-3 text-sm">
          <p className="mb-2 font-medium">למה הביקורת הזו צריכה בדיקה?</p>
          <div className="flex flex-wrap gap-2">
            {reasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setReported(true);
                  setReporting(false);
                }}
                className="pressable rounded-full border border-line bg-surface px-3 py-1.5 hover:border-ink/30"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {reported && (
        <p role="status" className="appear text-sm text-muted">
          תודה. הדיווח הועבר לצוות הבדיקה, והביקורת נשארת מוצגת עד להחלטה.
        </p>
      )}
    </div>
  );
}
