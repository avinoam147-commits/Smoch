import { BadgeCheck, Building2, MessageSquareReply, ShieldCheck } from "lucide-react";

export function VerifiedPurchase() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
      <BadgeCheck className="size-3.5" aria-hidden />
      רכישה מאומתת
    </span>
  );
}

export function StaffBadge() {
  return (
    <span
      title="הביקורת הוזנה על ידי צוות האתר, למשל בהעברה מאתר אחר באישור הכותב"
      className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted"
    >
      <ShieldCheck className="size-3.5" aria-hidden />
      הוזנה על ידי הצוות
    </span>
  );
}

export function RegistryBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
      <Building2 className="size-3.5" aria-hidden />
      אומתה מול רשם החברות
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
      <Building2 className="size-3.5" aria-hidden />
      לא אומתה מול רשם החברות
    </span>
  );
}

export function ClaimedBadge({ claimed }: { claimed: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
      <MessageSquareReply className="size-3.5" aria-hidden />
      {claimed ? "החברה מגיבה לביקורות" : "החברה עדיין לא הצטרפה"}
    </span>
  );
}

export function SponsoredBadge() {
  return (
    <span
      title="החברה שילמה כדי להופיע כאן. התשלום לא משפיע על הדירוג או על הביקורות."
      className="inline-flex shrink-0 items-center rounded-full border border-line px-2 py-0.5 text-xs font-medium text-muted"
    >
      ממומן
    </span>
  );
}
