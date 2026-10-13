import type { Metadata } from "next";
import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { getCategories } from "@/lib/queries";
import { GoogleButton } from "@/components/google-button";
import { AddCompanyForm } from "./add-company-form";

export const metadata: Metadata = { title: "הוספת חברה" };

export default function AddCompanyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10">
      <h1 className="text-3xl font-extrabold tracking-tight">הוספת חברה</h1>
      <p className="mt-2 text-pretty text-muted">
        לא מצאתם את החברה או השירות? הוסיפו אותם. כל חברה חדשה עוברת בדיקה כדי למנוע כפילויות, ואם יש לה ח.פ. נאמת את
        הפרטים מול רשם החברות.
      </p>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-surface-2" />}>
        <Gate />
      </Suspense>
    </div>
  );
}

async function Gate() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <div className="appear mt-8 rounded-2xl border border-line bg-surface p-6 text-center sm:p-8">
        <p className="font-semibold">כדי להוסיף חברה צריך להתחבר</p>
        <div className="mx-auto mt-5 max-w-xs">
          <GoogleButton next="/add-company" />
        </div>
      </div>
    );
  }
  const categories = await getCategories();
  return <AddCompanyForm categories={categories} />;
}
