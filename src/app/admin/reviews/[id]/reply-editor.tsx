"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReply, saveReply } from "@/app/actions/reviews";
import { inputClass } from "../../_components/field";

export function ReplyEditor({ reviewId, initial }: { reviewId: string; initial: string }) {
  const router = useRouter();
  const [text, setText] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="אין תגובה"
        className={inputClass}
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || text.trim().length < 2 || text === initial}
          onClick={() =>
            start(async () => {
              const res = await saveReply(reviewId, text);
              setMsg(res.ok ? "נשמר." : (res.message ?? "שגיאה"));
              router.refresh();
            })
          }
          className="pressable rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-bg disabled:opacity-50"
        >
          שמירה
        </button>
        {initial && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              confirm("למחוק את התגובה?") &&
              start(async () => {
                const res = await deleteReply(reviewId);
                if (res.ok) setText("");
                setMsg(res.ok ? "נמחק." : (res.message ?? "שגיאה"));
                router.refresh();
              })
            }
            className="pressable rounded-lg px-3.5 py-2 text-sm font-medium text-bad hover:bg-surface-2"
          >
            מחיקה
          </button>
        )}
      </div>
      {msg && <p className="appear text-xs text-muted">{msg}</p>}
    </div>
  );
}
