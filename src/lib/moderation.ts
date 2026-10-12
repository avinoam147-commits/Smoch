// Mirrors public.moderation_reason() in the database so writers get a
// warning before submitting. The database is the source of truth.
const checks: [RegExp, string][] = [
  [/(\+?972[\s-]?|(?<![\d])0)(5\d|[2-489]|7\d)[\s-]?\d{3}[\s-]?\d{4}/, "מספר טלפון"],
  [/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, "כתובת מייל"],
  [/(https?:\/\/|www\.)/i, "קישור"],
  [/(נוכל|הונא|רמאי|רמאות|גנב|גנבים|פושע|עבריין|מאפיה|עוקץ|עוקצים|סקאם|scam|fraud)/i, "האשמה חמורה"],
];

export function moderationWarning(text: string): string | null {
  for (const [re, label] of checks) if (re.test(text)) return label;
  return null;
}
