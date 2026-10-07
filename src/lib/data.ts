// נתוני דמה לאבטיפוס. כל החברות, האנשים והביקורות כאן בדויים.
// בשלב הבא הם יוחלפו בטבלאות במסד הנתונים.

export type CategoryId = "courses" | "signals" | "mentoring" | "algo";

export const categories: Record<CategoryId, { label: string; blurb: string }> = {
  courses: { label: "קורסי מסחר", blurb: "קורסים מוקלטים ופרונטליים למסחר במניות, מט״ח וקריפטו" },
  signals: { label: "קבוצות איתותים", blurb: "קבוצות בתשלום ששולחות המלצות קנייה ומכירה" },
  mentoring: { label: "ליווי אישי", blurb: "מנטורים וליווי צמוד לסוחרים מתחילים" },
  algo: { label: "בוטים ואלגו-טריידינג", blurb: "תוכנות ובוטים למסחר אוטומטי" },
};

export type Review = {
  id: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  date: string; // ISO
  verifiedPurchase: boolean;
  paid?: number; // ₪
  helpful: number;
  reply?: { body: string; date: string };
};

export type Company = {
  slug: string;
  name: string;
  category: CategoryId;
  tagline: string;
  about: string;
  website: string;
  registryId: string; // ח.פ. / ע.מ.
  registryVerified: boolean;
  claimed: boolean; // החברה מנהלת את הדף ומגיבה
  founded: number;
  city: string;
  priceRange: string;
  // התפלגות כל הדירוגים (1..5). הביקורות המוצגות הן מדגם.
  distribution: [number, number, number, number, number];
  reviews: Review[];
};

export const companies: Company[] = [
  {
    slug: "green-candle",
    name: "קורס הנר הירוק",
    category: "courses",
    tagline: "קורס מסחר במניות אמריקאיות למתחילים",
    about:
      "קורס דיגיטלי של 40 שיעורים מוקלטים ומפגש זום שבועי. מתמקד בניתוח טכני ובניהול סיכונים למסחר יומי.",
    website: "green-candle.example",
    registryId: "51-555001-2",
    registryVerified: true,
    claimed: true,
    founded: 2019,
    city: "תל אביב",
    priceRange: "₪2,900–₪4,500",
    distribution: [9, 6, 14, 61, 112],
    reviews: [
      {
        id: "gc1",
        author: "מיכל ש.",
        rating: 5,
        title: "סוף סוף מישהו שמדבר על ניהול סיכונים",
        body: "לקחתי קורס אחר לפני זה שכולו היה צילומי מסך של רווחים. כאן חצי מהחומר הוא על איך לא להפסיד, וזה מה שהייתי צריכה. המפגשים השבועיים באמת קורים, והמרצה עונה לשאלות.",
        date: "2026-09-21",
        verifiedPurchase: true,
        paid: 3400,
        helpful: 41,
      },
      {
        id: "gc2",
        author: "יוסי ב.",
        rating: 4,
        title: "תוכן טוב, תמיכה איטית",
        body: "החומר מסודר וברור. הורדתי כוכב כי לקח שבוע לקבל תשובה במייל על בעיה בגישה לשיעורים.",
        date: "2026-08-30",
        verifiedPurchase: true,
        paid: 2900,
        helpful: 12,
        reply: {
          body: "תודה יוסי. הוספנו מאז נציג תמיכה בוואטסאפ וזמן התגובה הממוצע ירד לפחות מיום. נשמח אם תנסה שוב.",
          date: "2026-09-02",
        },
      },
      {
        id: "gc3",
        author: "אורי ג.",
        rating: 2,
        title: "לא מתאים למי שעובד במשרה מלאה",
        body: "המסחר היומי שהם מלמדים דורש להיות מול המסך בשעות המסחר בארה״ב. זה לא נאמר בשיחת המכירה, וגיליתי את זה אחרי שכבר שילמתי.",
        date: "2026-07-14",
        verifiedPurchase: false,
        helpful: 27,
      },
    ],
  },
  {
    slug: "eye-level-trading",
    name: "מסחר בגובה העיניים",
    category: "mentoring",
    tagline: "ליווי אישי צמוד לשלושה חודשים",
    about:
      "תוכנית ליווי אחד-על-אחד: פגישה שבועית, בניית תוכנית מסחר אישית ומעבר על יומן העסקאות.",
    website: "eye-level.example",
    registryId: "51-555002-0",
    registryVerified: true,
    claimed: false,
    founded: 2021,
    city: "חיפה",
    priceRange: "₪6,000–₪9,000",
    distribution: [4, 2, 5, 22, 48],
    reviews: [
      {
        id: "el1",
        author: "נועה ר.",
        rating: 5,
        title: "המנטור באמת מסתכל על העסקאות שלך",
        body: "כל שבוע עברנו על יומן המסחר שלי. זה היה מביך בהתחלה ושימושי מאוד בהמשך. יקר, אבל קיבלתי מה שהובטח.",
        date: "2026-09-10",
        verifiedPurchase: true,
        paid: 7500,
        helpful: 18,
      },
      {
        id: "el2",
        author: "רון ח.",
        rating: 4,
        title: "טוב, אבל המחיר גבוה",
        body: "הליווי מקצועי. הייתי שמח לאפשרות של חודש ניסיון במקום התחייבות לשלושה חודשים.",
        date: "2026-06-03",
        verifiedPurchase: true,
        paid: 6000,
        helpful: 6,
      },
    ],
  },
  {
    slug: "signal-bot-pro",
    name: "סיגנל-בוט פרו",
    category: "signals",
    tagline: "קבוצת איתותי קריפטו בטלגרם",
    about: "מנוי חודשי לקבוצת טלגרם שמפרסמת איתותי קנייה ומכירה למטבעות קריפטו.",
    website: "signalbot.example",
    registryId: "ע.מ. 0-555003-1",
    registryVerified: false,
    claimed: false,
    founded: 2023,
    city: "לא ידוע",
    priceRange: "₪390 לחודש",
    distribution: [88, 21, 12, 9, 17],
    reviews: [
      {
        id: "sb1",
        author: "דניאל מ.",
        rating: 1,
        title: "ביטול המנוי היה בלתי אפשרי",
        body: "ניסיתי לבטל שלוש פעמים דרך הטלגרם ולא קיבלתי תשובה. בסוף ביטלתי דרך חברת האשראי. האיתותים עצמם הגיעו לרוב אחרי שהמחיר כבר זז.",
        date: "2026-09-28",
        verifiedPurchase: true,
        paid: 1170,
        helpful: 64,
      },
      {
        id: "sb2",
        author: "שירן ק.",
        rating: 1,
        title: "צילומי מסך של רווחים, בלי היסטוריה מלאה",
        body: "ביקשתי לראות את כל ההיסטוריה של האיתותים, כולל ההפסדים. סירבו ואמרו שזה ״סוד מקצועי״.",
        date: "2026-08-19",
        verifiedPurchase: false,
        helpful: 39,
      },
      {
        id: "sb3",
        author: "עמית ל.",
        rating: 5,
        title: "הרווחתי בחודש הראשון",
        body: "היה חודש טוב, נכנסתי לפי האיתותים ויצאתי ברווח.",
        date: "2026-08-02",
        verifiedPurchase: false,
        helpful: 2,
      },
    ],
  },
  {
    slug: "nachshon-trading-house",
    name: "בית המסחר נחשון",
    category: "courses",
    tagline: "קורס פרונטלי למסחר בשוק ההון",
    about: "קורס של 12 מפגשים פרונטליים בכיתה, כולל סימולטור מסחר וגישה לקהילת בוגרים.",
    website: "nachshon.example",
    registryId: "51-555004-6",
    registryVerified: true,
    claimed: true,
    founded: 2016,
    city: "ירושלים",
    priceRange: "₪5,200",
    distribution: [14, 11, 27, 38, 30],
    reviews: [
      {
        id: "nt1",
        author: "אביטל נ.",
        rating: 3,
        title: "מפגשים טובים, חומר קצת מיושן",
        body: "המרצים נחמדים והמפגשים בכיתה עוזרים לשאול שאלות. חלק מהדוגמאות מ-2018 ומרגישות לא רלוונטיות.",
        date: "2026-09-05",
        verifiedPurchase: true,
        paid: 5200,
        helpful: 9,
        reply: {
          body: "תודה על ההערה. אנחנו מעדכנים את סילבוס המחזור הבא ומחליפים את כל הדוגמאות לדוגמאות מהשנתיים האחרונות.",
          date: "2026-09-07",
        },
      },
      {
        id: "nt2",
        author: "גיל פ.",
        rating: 4,
        title: "הסימולטור שווה את זה",
        body: "תרגלתי בסימולטור חודשיים לפני שהכנסתי כסף אמיתי. ההמלצה הזו לבדה חסכה לי הרבה כסף.",
        date: "2026-07-22",
        verifiedPurchase: true,
        paid: 5200,
        helpful: 15,
      },
    ],
  },
  {
    slug: "gal-trade-algo",
    name: "גל-טרייד אלגו",
    category: "algo",
    tagline: "בוט מסחר אוטומטי במנוי",
    about: "תוכנה שמתחברת לחשבון הברוקר ומבצעת עסקאות לפי אסטרטגיות מוכנות. מנוי חודשי.",
    website: "galtrade.example",
    registryId: "51-555005-3",
    registryVerified: true,
    claimed: false,
    founded: 2022,
    city: "רמת גן",
    priceRange: "₪250–₪600 לחודש",
    distribution: [19, 14, 16, 12, 9],
    reviews: [
      {
        id: "ga1",
        author: "טל ו.",
        rating: 2,
        title: "התוצאות בבקטסט לא דומות למציאות",
        body: "הבקטסטים באתר מרשימים. בחשבון אמיתי, אחרי עמלות, יצאתי בהפסד קטן אחרי ארבעה חודשים. התוכנה עצמה יציבה.",
        date: "2026-09-14",
        verifiedPurchase: true,
        paid: 1600,
        helpful: 22,
      },
      {
        id: "ga2",
        author: "ליאור ד.",
        rating: 4,
        title: "כלי טוב למי שמבין מה הוא עושה",
        body: "אני משתמש בו לאוטומציה של האסטרטגיה שלי, לא באסטרטגיות המוכנות. בתור כלי הוא עושה את העבודה.",
        date: "2026-08-11",
        verifiedPurchase: true,
        paid: 3000,
        helpful: 8,
      },
    ],
  },
  {
    slug: "wolf-street-mentoring",
    name: "מנטורינג וולף-סטריט",
    category: "mentoring",
    tagline: "תוכנית ״מסחר כמקצוע״",
    about: "תוכנית ליווי קבוצתית של חצי שנה עם הבטחה ל״מקצוע חדש״. כוללת מפגשי קבוצה ותכנים מוקלטים.",
    website: "wolfstreet.example",
    registryId: "51-555006-1",
    registryVerified: true,
    claimed: false,
    founded: 2020,
    city: "הרצליה",
    priceRange: "₪14,900",
    distribution: [41, 12, 6, 5, 11],
    reviews: [
      {
        id: "ws1",
        author: "אלון צ.",
        rating: 1,
        title: "לחץ מכירה אגרסיבי",
        body: "בשיחת המכירה אמרו לי שהמקומות נגמרים היום ושאפשר לפרוס ל-36 תשלומים. אחרי ההרשמה רוב התוכן היה מוקלט, לא הליווי שהובטח.",
        date: "2026-09-25",
        verifiedPurchase: true,
        paid: 14900,
        helpful: 53,
      },
      {
        id: "ws2",
        author: "הדס א.",
        rating: 5,
        title: "שינה לי את החשיבה",
        body: "המפגשים הקבוצתיים נתנו לי הרבה מוטיבציה. עדיין לא מרוויחה, אבל מבינה הרבה יותר.",
        date: "2026-08-08",
        verifiedPurchase: true,
        paid: 14900,
        helpful: 7,
      },
    ],
  },
];

export function getCompany(slug: string) {
  return companies.find((c) => c.slug === slug);
}

export function reviewCount(c: Company) {
  return c.distribution.reduce((a, b) => a + b, 0);
}

// ממוצע בייסיאני: חברה עם מעט ביקורות נמשכת לכיוון ממוצע ניטרלי,
// כך שביקורת אחת של 5 כוכבים לא מנצחת מאות ביקורות של 4.6.
const PRIOR_MEAN = 3;
const PRIOR_WEIGHT = 10;

export function trustScore(c: Company) {
  const n = reviewCount(c);
  const sum = c.distribution.reduce((acc, count, i) => acc + count * (i + 1), 0);
  return (PRIOR_MEAN * PRIOR_WEIGHT + sum) / (PRIOR_WEIGHT + n);
}

export function rawAverage(c: Company) {
  const n = reviewCount(c);
  const sum = c.distribution.reduce((acc, count, i) => acc + count * (i + 1), 0);
  return n ? sum / n : 0;
}

export type Tone = "great" | "good" | "mixed" | "poor" | "bad";

export function scoreTone(score: number): { tone: Tone; label: string } {
  if (score >= 4.2) return { tone: "great", label: "מצוין" };
  if (score >= 3.6) return { tone: "good", label: "טוב" };
  if (score >= 2.8) return { tone: "mixed", label: "מעורב" };
  if (score >= 2.0) return { tone: "poor", label: "חלש" };
  return { tone: "bad", label: "גרוע" };
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(iso));
}

export function recentReviews(limit = 4) {
  return companies
    .flatMap((c) => c.reviews.map((r) => ({ ...r, company: c })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
