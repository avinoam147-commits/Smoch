import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LoginCard } from "./login-card";

export const metadata: Metadata = { title: "התחברות" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 pt-16">
      <div className="rounded-3xl border border-line bg-surface p-8 text-center">
        <Logo className="justify-center" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">התחברות לסמוך</h1>
        <p className="mt-2 text-sm text-muted">כדי לכתוב ביקורות, להוסיף חברות ולסמן ביקורות כמועילות.</p>
        <LoginCard />
        <p className="mt-6 text-xs leading-relaxed text-muted">
          בהתחברות את/ה מסכים/ה ל<Link href="/guidelines" className="underline">כללי האתר</Link>. נציג רק שם פרטי
          ואות ראשונה משם המשפחה.
        </p>
      </div>
    </div>
  );
}
