import { Star } from "lucide-react";
import { scoreTone, type Tone } from "@/lib/format";

const toneFill: Record<Tone, string> = {
  great: "bg-great",
  good: "bg-good",
  mixed: "bg-mixed",
  poor: "bg-poor",
  bad: "bg-bad",
};

export const toneText: Record<Tone, string> = {
  great: "text-great",
  good: "text-good",
  mixed: "text-mixed",
  poor: "text-poor",
  bad: "text-bad",
};

/** חמש משבצות עם מילוי חלקי לפי הציון. ממלא מימין לשמאל, כמו שקוראים. */
export function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const { tone } = scoreTone(value);
  const box = size === "sm" ? "size-4" : size === "lg" ? "size-7" : "size-5";
  const icon = size === "sm" ? "size-2.5" : size === "lg" ? "size-4.5" : "size-3.5";
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value.toFixed(1)} מתוך 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className={`relative grid ${box} place-items-center overflow-hidden rounded-[5px] bg-line`}>
            <span className={`absolute inset-y-0 start-0 ${toneFill[tone]}`} style={{ width: `${fill * 100}%` }} />
            <Star className={`relative ${icon} fill-white stroke-none`} />
          </span>
        );
      })}
    </span>
  );
}
