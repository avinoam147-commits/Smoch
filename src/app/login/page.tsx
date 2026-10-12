import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { LoginOptions } from "./login-options";

export const metadata: Metadata = { title: "התחברות", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 pt-16">
      <div className="rounded-3xl border border-line bg-surface p-8 text-center">
        <Logo className="justify-center" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">התחברות לסמוך</h1>
        <p className="mt-2 text-sm text-muted">כדי לכתוב ביקורות, להוסיף חברות ולסמן ביקורות כמועילות.</p>
        <div className="mt-6">
          <Suspense fallback={<div className="h-12 rounded-xl bg-surface-2" />}>
            <LoginOptions />
          </Suspense>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-muted">
          בהתחברות את/ה מסכים/ה ל
          <Link href="/terms" className="underline">
            תנאי השימוש
          </Link>{" "}
          ול
          <Link href="/privacy" className="underline">
            מדיניות הפרטיות
          </Link>
          . באתר יוצגו רק השם הפרטי והאות הראשונה של שם המשפחה. כתובת המייל לא מתפרסמת.
        </p>
      </div>
    </div>
  );
}
