export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${className}`}>
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
        <rect width="24" height="24" rx="7" className="fill-accent" />
        <path
          d="M7 12.5l3.2 3.2L17 9"
          fill="none"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-accent-ink"
        />
      </svg>
      <span className="text-xl">סמוך</span>
    </span>
  );
}
