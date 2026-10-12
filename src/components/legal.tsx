export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-10 leading-relaxed">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">עודכן לאחרונה: {updated}. טיוטה שתעבור בדיקה משפטית לפני ההשקה.</p>
      {children}
    </article>
  );
}

export function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      <div className="space-y-3 text-ink/85 [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:ps-5">{children}</div>
    </section>
  );
}
