export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base outline-none placeholder:text-muted focus:border-ink/40 sm:text-sm";

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold">
        {label}
        {required && <span className="text-bad"> *</span>}
      </span>
      {hint && (
        <span className="mt-0.5 block text-xs text-muted" dir="auto">
          {hint}
        </span>
      )}
      <span className="mt-1.5 block">{children}</span>
      {error && <span className="appear mt-1 block text-xs font-medium text-bad">{error}</span>}
    </label>
  );
}
