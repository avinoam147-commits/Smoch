"use client";

import { useState, useTransition } from "react";
import { receiptSignedUrl } from "../actions";

/** Opens the private file through a 10-minute signed link. */
export function ReceiptViewButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await receiptSignedUrl(id);
            if (res.ok) window.open(res.url, "_blank", "noopener,noreferrer");
            else setError(res.message);
          })
        }
        className="pressable rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium hover:border-ink/30"
      >
        {pending ? "…" : "צפייה בקובץ"}
      </button>
      {error && <span className="text-xs text-bad">{error}</span>}
    </span>
  );
}
