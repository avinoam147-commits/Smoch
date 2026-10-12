"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/actions/account";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted">
        מחיקת החשבון מוחקת לצמיתות את הפרטים שלך, את כל הביקורות שכתבת ואת הקבלות שצירפת. אי אפשר לשחזר.
      </p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pressable rounded-xl border border-bad/30 px-4 py-2.5 font-medium text-bad hover:bg-bad/5"
        >
          מחיקת החשבון
        </button>
      ) : (
        <div className="appear space-y-2">
          <label htmlFor="confirm-delete" className="block">
            כדי לאשר, הקלידו <strong>מחיקה</strong>
          </label>
          <div className="flex max-w-sm gap-2">
            <input
              id="confirm-delete"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-base outline-none focus:border-ink/40"
            />
            <button
              type="button"
              disabled={pending || text.trim() !== "מחיקה"}
              onClick={() =>
                start(async () => {
                  const res = await deleteAccount(text);
                  if (res && !res.ok) setMessage(res.message ?? null);
                })
              }
              className="pressable shrink-0 rounded-xl bg-bad px-4 font-medium text-white disabled:opacity-50"
            >
              מחיקה לצמיתות
            </button>
          </div>
          {message && <p className="text-bad">{message}</p>}
        </div>
      )}
    </div>
  );
}
