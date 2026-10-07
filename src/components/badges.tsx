import { BadgeCheck, Building2, MessageSquareReply } from "lucide-react";

export function VerifiedPurchase() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
      <BadgeCheck className="size-3.5" aria-hidden />
      רכישה מאומתת
    </span>
  );
}

export function RegistryBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
      <Building2 className="size-3.5" aria-hidden />
      רשומה ברשם החברות
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
