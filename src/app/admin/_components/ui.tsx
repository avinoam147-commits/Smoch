import Link from "next/link";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function FilterTabs({
  options,
  active,
  base,
}: {
  options: { value: string; label: string; count?: number }[];
  active: string;
  base: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {options.map((o) => {
        const href = o.value ? `${base}${base.includes("?") ? "&" : "?"}status=${o.value}` : base;
        return (
          <Link
            key={o.value}
            href={href}
            aria-current={active === o.value ? "page" : undefined}
            className={`pressable rounded-full border px-3.5 py-1.5 text-sm ${
              active === o.value ? "border-ink bg-ink text-bg" : "border-line bg-surface hover:border-ink/30"
            }`}
          >
            {o.label}
            {o.count != null && <span className="ms-1.5 tabular-nums opacity-70">{o.count}</span>}
          </Link>
        );
      })}
    </div>
  );
}

export function SearchForm({
  defaultValue,
  placeholder,
  hidden,
}: {
  defaultValue?: string;
  placeholder: string;
  hidden?: Record<string, string>;
}) {
  return (
    <form className="mb-4 flex max-w-md gap-2" role="search">
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-surface px-4 py-2 text-base outline-none focus:border-ink/40 sm:text-sm"
      />
      <button
        type="submit"
        className="pressable rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:border-ink/30"
      >
        חיפוש
      </button>
    </form>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface ${className}`}>{children}</div>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">{children}</div>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line text-start text-xs text-muted">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 text-start font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Flash({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="appear mb-4 rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent">
      {children}
    </p>
  );
}
