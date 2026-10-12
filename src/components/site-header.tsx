import Link from "next/link";
import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { Logo } from "./logo";
import { UserMenuButton } from "./user-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
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
          <Suspense fallback={<span className="block h-9 w-24 rounded-lg bg-surface-2" aria-hidden />}>
            <UserMenu />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

async function UserMenu() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <Link href="/login" className="pressable rounded-lg bg-ink px-4 py-2 font-medium text-bg hover:bg-ink/85">
        התחברות
      </Link>
    );
  }
  return <UserMenuButton displayName={viewer.displayName} avatarUrl={viewer.avatarUrl} isAdmin={viewer.isAdmin} />;
}
