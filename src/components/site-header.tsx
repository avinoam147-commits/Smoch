import Link from "next/link";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" aria-label="סמוך, לדף הבית" className="shrink-0">
          <Logo />
        </Link>
        <nav className="ms-auto flex items-center gap-1 text-sm">
          <Link
            href="/companies"
            className="pressable hidden rounded-lg px-3 py-2 text-muted hover:bg-surface-2 hover:text-ink sm:block"
          >
            כל החברות
          </Link>
          <Link
            href="/add-company"
            className="pressable hidden rounded-lg px-3 py-2 text-muted hover:bg-surface-2 hover:text-ink sm:block"
          >
            הוספת חברה
          </Link>
          <Link
            href="/login"
            className="pressable rounded-lg bg-ink px-4 py-2 font-medium text-bg hover:bg-ink/85"
          >
            התחברות
          </Link>
        </nav>
      </div>
    </header>
  );
}
