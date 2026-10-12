import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublishedCompanies } from "@/lib/queries";
import { CompaniesBrowser } from "./companies-browser";

export const metadata: Metadata = {
  title: "כל החברות",
  description: "קורסי מסחר, קבוצות איתותים, ליווי ובוטים בישראל, מדורגים לפי ציון האמינות של הלקוחות.",
};

export default async function CompaniesPage() {
  const companies = await getPublishedCompanies();
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="text-3xl font-extrabold tracking-tight">כל החברות</h1>
      <p className="mt-2 text-muted">קורסי מסחר, קבוצות איתותים, ליווי ובוטים, מדורגים לפי ציון האמינות.</p>
      <Suspense fallback={<div className="mt-8 h-96 rounded-2xl bg-surface-2" />}>
        <CompaniesBrowser companies={companies} />
      </Suspense>
    </div>
  );
}
