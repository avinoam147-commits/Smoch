"use client";

import { useSearchParams } from "next/navigation";

export function AccountDeletedNotice() {
  const params = useSearchParams();
  if (!params.get("deleted")) return null;
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <p role="status" className="appear rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent">
        החשבון וכל המידע שלך נמחקו.
      </p>
    </div>
  );
}
