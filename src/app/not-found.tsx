import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 pt-24 text-center">
      <p className="text-6xl font-extrabold text-line">404</p>
      <h1 className="mt-4 text-2xl font-bold">הדף לא נמצא</h1>
      <p className="mt-2 text-muted">ייתכן שהחברה הוסרה או שהכתובת שגויה.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/companies" className="pressable rounded-xl bg-ink px-5 py-2.5 font-medium text-bg">
          לכל החברות
        </Link>
        <Link
          href="/add-company"
          className="pressable rounded-xl border border-line px-5 py-2.5 font-medium hover:border-ink/30"
        >
          הוספת חברה
        </Link>
      </div>
    </div>
  );
}
