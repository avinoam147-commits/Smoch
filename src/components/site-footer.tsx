import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-muted">
            ביקורות ציבוריות של לקוחות אמיתיים. אנחנו לא מוכרים דירוגים ולא מסירים ביקורות תמורת תשלום.
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold">האתר</p>
          <ul className="space-y-1.5 text-muted">
            <li>
              <Link className="hover:text-ink" href="/companies">
                כל החברות
              </Link>
            </li>
            <li>
              <Link className="hover:text-ink" href="/add-company">
                הוספת חברה
              </Link>
            </li>
            <li>
              <Link className="hover:text-ink" href="/guidelines">
                כללי האתר
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="font-semibold">שקיפות</p>
          <ul className="space-y-1.5 text-muted">
            <li>
              <Link className="hover:text-ink" href="/guidelines#score">
                איך מחושב הציון
              </Link>
            </li>
            <li>
              <Link className="hover:text-ink" href="/guidelines#reports">
                דיווח והסרת תוכן
              </Link>
            </li>
            <li>
              <Link className="hover:text-ink" href="/terms">
                תנאי שימוש
              </Link>
            </li>
            <li>
              <Link className="hover:text-ink" href="/privacy">
                מדיניות פרטיות
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
