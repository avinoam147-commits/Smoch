import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "./_components/admin-nav";
import { getQueueCounts } from "./_lib/data";

export const metadata: Metadata = {
  title: { default: "ניהול", template: "%s · ניהול · סמוך" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const counts = await getQueueCounts();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 lg:pt-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 hidden px-3 text-xs font-semibold tracking-wide text-muted lg:block">פאנל ניהול</p>
        <AdminNav counts={counts} />
      </aside>
      <div className="mt-4 min-w-0 lg:mt-0">{children}</div>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 pt-10 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
      <div className="hidden h-80 rounded-2xl bg-surface-2 lg:block" />
      <div className="h-96 rounded-2xl bg-surface-2" />
    </div>
  );
}
