import type { Metadata } from "next";
import { AddCompanyForm } from "./add-company-form";

export const metadata: Metadata = { title: "הוספת חברה" };

export default function AddCompanyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10">
      <h1 className="text-3xl font-extrabold tracking-tight">הוספת חברה</h1>
      <p className="mt-2 text-muted text-pretty">
        לא מצאתם קורס, מנטור או קבוצת איתותים? הוסיפו אותם. כל חברה חדשה עוברת בדיקה כדי למנוע כפילויות,
        ואם יש לה ח.פ. נמשוך את הפרטים הרשמיים מרשם החברות.
      </p>
      <AddCompanyForm />
    </div>
  );
}
