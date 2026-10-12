"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Plus, UserRound } from "lucide-react";
import { signOut } from "@/app/actions/account";

export function UserMenuButton({
  displayName,
  avatarUrl,
  isAdmin,
}: {
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on navigation, outside click and Escape.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="pressable flex items-center gap-2 rounded-full border border-line bg-surface py-1 ps-1 pe-3 hover:border-ink/30"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google avatar URL
          <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="size-7 rounded-full object-cover" />
        ) : (
          <span className="grid size-7 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
            {displayName.charAt(0)}
          </span>
        )}
        <span className="max-w-28 truncate font-medium">{displayName}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="menu-pop absolute end-0 top-full z-40 mt-2 w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-lg shadow-black/5"
        >
          <MenuLink href="/account" icon={<UserRound className="size-4" />}>
            החשבון שלי
          </MenuLink>
          <MenuLink href="/add-company" icon={<Plus className="size-4" />}>
            הוספת חברה
          </MenuLink>
          {isAdmin && (
            <MenuLink href="/admin" icon={<LayoutDashboard className="size-4" />}>
              פאנל ניהול
            </MenuLink>
          )}
          <div className="my-1 h-px bg-line" />
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm text-muted hover:bg-surface-2 hover:text-ink"
            >
              <LogOut className="size-4" aria-hidden />
              התנתקות
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-2"
    >
      <span className="text-muted" aria-hidden>
        {icon}
      </span>
      {children}
    </Link>
  );
}
