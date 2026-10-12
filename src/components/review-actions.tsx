"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Flag, MessageSquareReply, PenLine, ThumbsUp } from "lucide-react";
import { reportReview, saveReply, deleteReply, toggleHelpful } from "@/app/actions/reviews";
import { reportReasons, type ReportReason } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useCompanyViewer } from "./viewer-context";

export function ReviewActions({
  reviewId,
  helpfulCount,
  companySlug,
  existingReply,
}: {
  reviewId: string;
  helpfulCount: number;
  companySlug: string;
  existingReply: string | null;
}) {
  const { state } = useCompanyViewer();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const serverVoted = state.votedReviewIds.includes(reviewId);
  const [votedOverride, setVotedOverride] = useState<boolean | null>(null);
  const voted = votedOverride ?? serverVoted;
  const baseCount = helpfulCount - (serverVoted ? 1 : 0);

  const [panel, setPanel] = useState<"none" | "report" | "reply">("none");
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [reply, setReply] = useState(existingReply ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  const isMine = state.myReviewId === reviewId;
  const canReply = state.isMember || state.isAdmin;

  function needLogin() {
    if (!isSupabaseConfigured) {
      setMessage("בגרסת ההדגמה הפעולה הזו לא נשמרת.");
      return true;
    }
    if (!state.signedIn) {
      router.push(`/login?next=${encodeURIComponent(`${pathname}#review-${reviewId}`)}`);
      return true;
    }
    return false;
  }

  function onVote() {
    if (needLogin()) return;
    if (isMine) return setMessage("אי אפשר לסמן ביקורת שלך כמועילה.");
    const next = !voted;
    setVotedOverride(next);
    startTransition(async () => {
      const res = await toggleHelpful(reviewId, next);
      if (!res.ok) {
        setVotedOverride(!next);
        setMessage(res.message ?? null);
      }
    });
  }

  function onReport() {
    if (!reason) return;
    startTransition(async () => {
      const res = await reportReview(reviewId, reason, details);
      if (res.ok) {
        setReported(true);
        setPanel("none");
        setMessage("תודה. הדיווח הועבר לבדיקה, והביקורת נשארת מוצגת עד להחלטה.");
      } else setMessage(res.message ?? null);
    });
  }

  function onSaveReply() {
    startTransition(async () => {
      const res = await saveReply(reviewId, reply);
      if (res.ok) {
        setPanel("none");
        setMessage("התגובה פורסמה.");
        router.refresh();
      } else setMessage(res.message ?? null);
    });
  }

  function onDeleteReply() {
    if (!confirm("למחוק את התגובה?")) return;
    startTransition(async () => {
      const res = await deleteReply(reviewId);
      if (res.ok) {
        setReply("");
        setPanel("none");
        router.refresh();
      } else setMessage(res.message ?? null);
    });
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <button
          type="button"
          onClick={onVote}
          aria-pressed={voted}
          disabled={pending}
          className={`pressable inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${
            voted ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
          }`}
        >
          <ThumbsUp className="size-4" aria-hidden />
          מועיל
          <span className="tabular-nums">{baseCount + (voted ? 1 : 0)}</span>
        </button>

        {!reported && !isMine && (
          <button
            type="button"
            onClick={() => !needLogin() && setPanel(panel === "report" ? "none" : "report")}
            aria-expanded={panel === "report"}
            className="pressable inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-ink"
          >
            <Flag className="size-4" aria-hidden />
            דיווח
          </button>
        )}

        {canReply && (
          <button
            type="button"
            onClick={() => setPanel(panel === "reply" ? "none" : "reply")}
            aria-expanded={panel === "reply"}
            className="pressable inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-ink"
          >
            <MessageSquareReply className="size-4" aria-hidden />
            {existingReply ? "עריכת התגובה" : "תגובת החברה"}
          </button>
        )}

        {isMine && (
          <Link
            href={`/company/${companySlug}/review`}
            className="pressable ms-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-accent hover:bg-accent-soft"
          >
            <PenLine className="size-4" aria-hidden />
            עריכת הביקורת שלי
          </Link>
        )}
      </div>

      {panel === "report" && (
        <div className="appear space-y-3 rounded-xl border border-line bg-surface-2 p-3 text-sm">
          <p className="font-medium">למה הביקורת הזו צריכה בדיקה?</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="סיבת הדיווח">
            {(Object.keys(reportReasons) as ReportReason[]).map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={reason === r}
                onClick={() => setReason(r)}
                className={`pressable rounded-full border px-3 py-1.5 ${
                  reason === r ? "border-ink bg-ink text-bg" : "border-line bg-surface hover:border-ink/30"
                }`}
              >
                {reportReasons[r]}
              </button>
            ))}
          </div>
          {reason && (
            <div className="appear space-y-2">
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={1000}
                rows={2}
                placeholder="פרטים נוספים (לא חובה)"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-base outline-none focus:border-ink/40"
              />
              <button
                type="button"
                onClick={onReport}
                disabled={pending}
                className="pressable rounded-lg bg-ink px-4 py-2 font-medium text-bg disabled:opacity-60"
              >
                שליחת דיווח
              </button>
            </div>
          )}
        </div>
      )}

      {panel === "reply" && (
        <div className="appear space-y-2 rounded-xl border border-line bg-surface-2 p-3 text-sm">
          <p className="font-medium">תגובה פומבית בשם החברה</p>
          <p className="text-muted">ענו לעניין, בלי פרטים אישיים של הכותב. התגובה מוצגת מתחת לביקורת.</p>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={2000}
            rows={4}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-base leading-relaxed outline-none focus:border-ink/40"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSaveReply}
              disabled={pending || reply.trim().length < 2}
              className="pressable rounded-lg bg-accent px-4 py-2 font-medium text-accent-ink disabled:opacity-60"
            >
              {existingReply ? "שמירה" : "פרסום תגובה"}
            </button>
            {existingReply && (
              <button
                type="button"
                onClick={onDeleteReply}
                disabled={pending}
                className="pressable rounded-lg px-4 py-2 font-medium text-bad hover:bg-surface"
              >
                מחיקה
              </button>
            )}
          </div>
        </div>
      )}

      {message && (
        <p role="status" className="appear text-sm text-muted">
          {message}
        </p>
      )}
    </div>
  );
}
