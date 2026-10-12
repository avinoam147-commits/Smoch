"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { confirmPhoneCode, sendPhoneCode } from "@/app/actions/account";
import { safeNext } from "@/lib/safe-next";

export function PhoneVerification({ verified, phone }: { verified: boolean; phone: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [input, setInput] = useState("");
  const [e164, setE164] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (verified) {
    return (
      <p className="flex items-center gap-2 text-sm">
        <BadgeCheck className="size-5 text-accent" aria-hidden />
        המספר {phone ? <span dir="ltr">+{phone}</span> : null} אומת. הוא לא מוצג באתר.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        אימות טלפון מקשה על פתיחת חשבונות מזויפים. המספר לא מוצג באתר ולא מועבר לחברות.
      </p>
      {step === "phone" ? (
        <div className="flex max-w-sm gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="050-1234567"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            aria-label="מספר טלפון נייד"
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-left text-base outline-none focus:border-ink/40"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setMessage(null);
                const res = await sendPhoneCode(input);
                if (res.ok && res.phone) {
                  setE164(res.phone);
                  setStep("code");
                } else setMessage(res.message ?? null);
              })
            }
            className="pressable shrink-0 rounded-xl bg-ink px-4 text-sm font-medium text-bg disabled:opacity-60"
          >
            שליחת קוד
          </button>
        </div>
      ) : (
        <div className="appear space-y-2">
          <p className="text-sm">
            שלחנו קוד ב-SMS ל-<span dir="ltr">{e164}</span>.{" "}
            <button type="button" onClick={() => setStep("phone")} className="text-accent underline">
              שינוי מספר
            </button>
          </p>
          <div className="flex max-w-sm gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              aria-label="קוד אימות"
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-left text-base tracking-widest outline-none focus:border-ink/40"
            />
            <button
              type="button"
              disabled={pending || code.length < 6}
              onClick={() =>
                start(async () => {
                  const res = await confirmPhoneCode(e164, code);
                  if (res.ok) {
                    const next = params.get("next");
                    if (next) router.push(safeNext(next));
                    else router.refresh();
                  } else setMessage(res.message ?? null);
                })
              }
              className="pressable shrink-0 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink disabled:opacity-60"
            >
              אימות
            </button>
          </div>
        </div>
      )}
      {message && (
        <p role="alert" className="appear text-sm text-bad">
          {message}
        </p>
      )}
    </div>
  );
}
