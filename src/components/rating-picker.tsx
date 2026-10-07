"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { scoreTone } from "@/lib/data";

const labels = ["", "גרוע", "חלש", "בסדר", "טוב", "מצוין"];
const fills: Record<string, string> = {
  great: "bg-great",
  good: "bg-good",
  mixed: "bg-mixed",
  poor: "bg-poor",
  bad: "bg-bad",
};

export function RatingPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const fill = shown ? fills[scoreTone(shown).tone] : "";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div role="radiogroup" aria-label="דירוג" className="flex gap-1.5" onPointerLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= shown;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} כוכבים, ${labels[n]}`}
              onClick={() => onChange(n)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHover(n)}
              className="pressable relative grid size-12 place-items-center rounded-xl bg-line"
            >
              <span
                className={`absolute inset-0 rounded-xl ${fill} transition-[opacity,transform] duration-150 ease-[var(--ease-out)]`}
                style={{ opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(0.85)" }}
                aria-hidden
              />
              <Star className="relative size-6 fill-white stroke-none" aria-hidden />
            </button>
          );
        })}
      </div>
      <span className="min-w-12 text-sm font-medium text-muted" aria-live="polite">
        {labels[shown]}
      </span>
    </div>
  );
}
