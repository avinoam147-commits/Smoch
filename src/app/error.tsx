"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-24 text-center">
      <h1 className="text-2xl font-bold">משהו השתבש</h1>
      <p className="mt-2 text-muted">התקלה נרשמה. אפשר לנסות שוב.</p>
      <button
        type="button"
        onClick={reset}
        className="pressable mt-6 rounded-xl bg-ink px-5 py-2.5 font-medium text-bg"
      >
        ניסיון נוסף
      </button>
    </div>
  );
}
