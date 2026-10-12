const labels: Record<string, string> = {
  published: "פורסם",
  pending: "ממתין לבדיקה",
  rejected: "נדחה",
  hidden: "מוסתר",
  approved: "אושר",
  open: "פתוח",
  dismissed: "נדחה",
  actioned: "טופל",
};

type Tone = "good" | "warn" | "bad" | "neutral";

const toneFor: Record<string, Tone> = {
  published: "good",
  approved: "good",
  actioned: "good",
  pending: "warn",
  open: "warn",
  rejected: "bad",
  hidden: "bad",
  dismissed: "neutral",
};

const toneClass: Record<Tone, string> = {
  good: "bg-accent-soft text-accent",
  warn: "bg-mixed/15 text-mixed",
  bad: "bg-bad/10 text-bad",
  neutral: "bg-surface-2 text-muted",
};

export function StatusChip({ status, tone, children }: { status?: string; tone?: Tone; children?: React.ReactNode }) {
  const t = tone ?? toneFor[status ?? ""] ?? "neutral";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClass[t]}`}>
      {children ?? labels[status ?? ""] ?? status}
    </span>
  );
}
