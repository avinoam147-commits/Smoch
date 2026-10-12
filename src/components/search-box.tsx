"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function SearchBox({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        router.push(query ? `/companies?q=${encodeURIComponent(query)}` : "/companies");
      }}
      className="flex w-full items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-sm focus-within:border-ink/30"
    >
      <Search className="ms-2 size-5 shrink-0 text-muted" aria-hidden />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        type="search"
        enterKeyHint="search"
        placeholder="שם של קורס, מנטור או קבוצת איתותים"
        aria-label="חיפוש חברה"
        className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        className="pressable rounded-xl bg-accent px-5 py-2.5 font-medium text-accent-ink hover:opacity-90"
      >
        חיפוש
      </button>
    </form>
  );
}
