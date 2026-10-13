import type { Metadata } from "next";
import { MIN_RATINGS_FOR_SCORE } from "@/lib/format";

export const metadata: Metadata = { title: "כללי האתר" };

export default function GuidelinesPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-10 leading-relaxed">
      <h1 className="text-3xl font-extrabold tracking-tight">כללי האתר</h1>
      <p className="mt-2 text-muted">טיוטה לגרסת ההדגמה. הנוסח הסופי ייקבע עם עורך דין.</p>

      <Section title="מה מותר לכתוב">
        <ul className="list-disc space-y-1.5 ps-5">
          <li>חוויה אישית שלכם: מה הובטח, מה קיבלתם, כמה שילמתם ומתי.</li>
          <li>עובדות שאתם יכולים לתמוך בהן, כמו קבלות, צילומי מסך או התכתבויות.</li>
          <li>דעה, גם חריפה, כל עוד ברור שזו דעה: ״לא הייתי ממליץ״, ״הרגשתי שהטעו אותי״.</li>
        </ul>
      </Section>

      <Section title="מה אסור">
        <ul className="list-disc space-y-1.5 ps-5">
          <li>האשמות פליליות כעובדה (״הם נוכלים״, ״זו הונאה״) בלי פסק דין או מקור רשמי.</li>
          <li>פרטים אישיים: טלפונים, כתובות, שמות של עובדים שאינם הפנים הציבוריות של החברה.</li>
          <li>ביקורת על חברה שאתם עובדים בה, מתחרים בה או קיבלתם תמורה על הכתיבה עליה.</li>
          <li>יותר מביקורת אחת לאותה חברה. אפשר לעדכן את הביקורת הקיימת.</li>
          <li>קישורים, מספרי טלפון וכתובות מייל. ביקורת שמכילה אותם עוברת בדיקה ידנית.</li>
        </ul>
      </Section>

      <Section title="איך מחושב הציון" id="score">
        <p>
          <strong>הציון מוצג רק אחרי {MIN_RATINGS_FOR_SCORE} דירוגים.</strong> ציון שמבוסס על מעט דירוגים יכול לשקף לקוח
          אחד מאוכזב, או כמה חברים של בעלי החברה, ולהטעות. עד שמצטברים {MIN_RATINGS_FOR_SCORE} דירוגים, דף החברה מציג
          כמה דירוגים יש וכמה חסרים, ואת הביקורות עצמן. הכלל זהה לכל החברות.
        </p>
        <p className="mt-3">
          מעבר לזה, ציון האמינות הוא ממוצע משוקלל. לכל חברה נוספות כביכול עשרה דירוגים ניטרליים של 3 כוכבים, כך שגם אחרי
          הסף, חברה עם מעט דירוגים לא מקבלת ציון קיצוני. ככל שמצטברים דירוגים אמיתיים, ההשפעה של התוספת הזו נעלמת.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 ps-5">
          <li>דירוג עם רכישה מאומתת שווה פי 1.5.</li>
          <li>דירוג מלפני יותר משנה שווה 75%, ומלפני יותר משנתיים 50%.</li>
          <li>דירוגים שממתינים לבדיקה או שהוסתרו לא נספרים.</li>
        </ul>
        <p className="mt-3">ליד הציון מוצג גם הממוצע הגולמי, בלי שקלול. נפרסם כאן כל שינוי בנוסחה.</p>
      </Section>

      <Section title="דיווח והסרת תוכן" id="reports">
        <p>
          כל אחד, כולל החברות, יכול לדווח על ביקורת. ביקורת שמדווחת נשארת מוצגת עד להחלטה, אלא אם יש בה פרטים אישיים.
          חברה שטוענת שביקורת שקרית מתבקשת להציג אסמכתא, והכותב מקבל הזדמנות להגיב לפני החלטה.
        </p>
        <p className="mt-3">
          ביקורות שמכילות האשמות חמורות (״נוכלים״, ״הונאה״ וכדומה) מחכות לבדיקה ידנית לפני פרסום. כל החלטה של הצוות
          נרשמת ביומן פנימי.
        </p>
        <p className="mt-3 font-medium">אנחנו לא מסירים ולא מסתירים ביקורות תמורת תשלום. אף פעם.</p>
      </Section>
    </article>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      <div className="text-ink/85">{children}</div>
    </section>
  );
}
