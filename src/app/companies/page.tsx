import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, getPublishedCompanies } from "@/lib/queries";
import { CompaniesBrowser } from "./companies-browser";

export const metadata: Metadata = {
  title: "כל החברות",
  description: "חברות ושירותים בישראל, מדורגים לפי ציון האמינות של הלקוחות.",
};

export default function CompaniesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="text-3xl font-extrabold tracking-tight">כל החברות</h1>
      <p className="mt-2 text-muted">חברות ושירותים בישראל, מדורגים לפי ציון האמינות של הלקוחות.</p>
      <Suspense fallback={<div className="mt-8 h-96 rounded-2xl bg-surface-2" />}>
        <CompaniesList />
      </Suspense>
    </div>
  );
}

async function CompaniesList() {
  const [companies, categories] = await Promise.all([getPublishedCompanies(), getCategories()]);
  return <CompaniesBrowser companies={companies} categories={categories} />;
}
