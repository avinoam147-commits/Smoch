import { scoreTone } from "@/lib/format";
import { toneText } from "./stars";

export function ScoreBadge({ score }: { score: number }) {
  const { tone, label } = scoreTone(score);
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-lg font-bold tabular-nums">{score.toFixed(1)}</span>
      <span className={`text-sm font-medium ${toneText[tone]}`}>{label}</span>
    </span>
  );
}
