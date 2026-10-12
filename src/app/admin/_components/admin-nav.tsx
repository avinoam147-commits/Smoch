"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  Flag,
  Gauge,
  KeyRound,
  MessageSquareText,
  Receipt,
  Settings,
  Users,
} from "lucide-react";

const items = [
  { href: "/admin", label: "סקירה", icon: Gauge, exact: true },
  { href: "/admin/companies", label: "חברות", icon: Building2, badge: "companies" },
  { href: "/admin/reviews", label: "ביקורות", icon: MessageSquareText, badge: "reviews" },
  { href: "/admin/reports", label: "דיווחים", icon: Flag, badge: "reports" },
  { href: "/admin/receipts", label: "קבלות", icon: Receipt, badge: "receipts" },
  { href: "/admin/claims", label: "בקשות ניהול", icon: KeyRound, badge: "claims" },
  { href: "/admin/users", label: "משתמשים", icon: Users },
  { href: "/admin/settings", label: "הגדרות", icon: Settings },
  { href: "/admin/audit", label: "יומן פעולות", icon: ClipboardList },
] as const;

export type QueueCounts = Record<"companies" | "reviews" | "reports" | "receipts" | "claims", number>;

export function AdminNav({ counts }: { counts: QueueCounts }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="ניווט ניהול"
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
    >
      {items.map((item) => {
        const active = "exact" in item ? pathname === item.href : pathname.startsWith(item.href);
        const count = "badge" in item ? counts[item.badge] : 0;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm ${
              active ? "bg-ink text-bg" : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <Icon className="size-4" aria-hidden />
            <span>{item.label}</span>
            {count > 0 && (
              <span
                className={`ms-auto rounded-full px-1.5 text-xs tabular-nums ${
                  active ? "bg-bg/20" : "bg-mixed/15 text-mixed"
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
