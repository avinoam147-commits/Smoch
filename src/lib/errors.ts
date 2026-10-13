type PgError = { code?: string; message?: string } | null | undefined;

/** Turns database errors raised by our triggers and constraints into Hebrew. */
export function friendlyError(error: PgError, fallback = "משהו השתבש. נסו שוב בעוד רגע."): string {
  if (!error) return fallback;
  const msg = error.message ?? "";
  if (msg.includes("rate_limited")) return "הגעתם למגבלה היומית. אפשר לנסות שוב מחר.";
  if (msg.includes("phone_required")) return "כדי לכתוב ביקורת צריך לאמת מספר טלפון בדף החשבון.";
  if (msg.includes("account suspended")) return "החשבון מושעה. לפרטים פנו אלינו.";
  if (msg.includes("login required")) return "צריך להתחבר כדי לבצע את הפעולה.";
  if (msg.includes("company not open")) return "החברה עדיין לא פתוחה לביקורות.";
  if (msg.includes("cannot vote on own")) return "אי אפשר לסמן ביקורת שלך כמועילה.";
  if (error.code === "23505") {
    if (msg.includes("reviews_one_per_user")) return "כבר כתבת ביקורת על החברה הזו. אפשר לערוך אותה.";
    if (msg.includes("companies_registry_unique")) return "חברה עם ח.פ. הזה כבר קיימת באתר.";
    if (msg.includes("companies_slug_key")) return "הכתובת (slug) כבר תפוסה. בחרו אחרת.";
    if (msg.includes("reports_one_per_user")) return "כבר דיווחת על הביקורת הזו.";
    if (msg.includes("company_claims_one_pending")) return "כבר שלחת בקשה לחברה הזו והיא ממתינה לטיפול.";
    if (msg.includes("receipts_one_pending")) return "כבר צירפת קבלה לביקורת הזו והיא ממתינה לבדיקה.";
    return "הפריט כבר קיים.";
  }
  if (error.code === "23514") return "חלק מהשדות לא עומדים בדרישות. בדקו אורך ותוכן.";
  if (error.code === "23502") return "חסרים פרטים. בדקו שכל שדות החובה מלאים.";
  if (error.code === "42501") return "אין לך הרשאה לפעולה הזו.";
  return fallback;
}
