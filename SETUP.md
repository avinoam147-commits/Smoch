# הקמת סמוך: מה צריך לעשות

הקוד מוכן. כדי שהאתר יעבוד עם התחברות אמיתית ומסד נתונים, צריך לפתוח שלושה חשבונות ולהעתיק כמה מפתחות.
זה לוקח בערך 30–40 דקות. בלי השלבים האלה האתר עובד ב"מצב הדגמה" עם נתונים בדויים.

---

## 1. Supabase (מסד נתונים והתחברות) — חובה

1. נכנסים ל-https://supabase.com, ואז **Start your project** ונרשמים עם GitHub.
2. **New project**:
   - Name: `smoch`
   - Database Password: לוחצים Generate ושומרים את הסיסמה במקום בטוח.
   - Region: **Central EU (Frankfurt)**, הכי קרוב לישראל.
   - Plan: Free.
3. כשהפרויקט מוכן, יוצרים את הטבלאות:
   - בתפריט הצד: **SQL Editor**, ואז **New query**.
   - פותחים בגיטהאב את הקובץ `supabase/migrations/20261012000000_init.sql`, מעתיקים את **כל** התוכן ומדביקים.
   - לוחצים **Run**. צריך להופיע `Success. No rows returned`.
4. מעתיקים את המפתחות. **Project Settings**, ואז **API Keys**:
   - `Project URL`, שנראה כמו `https://abcd1234.supabase.co`
   - `Publishable key`, שמתחיל ב-`sb_publishable_`
   - `Secret key`, שמתחיל ב-`sb_secret_`. **לא לשתף אותו עם אף אחד.**

## 2. Google (התחברות עם Gmail) — חובה

1. נכנסים ל-https://console.cloud.google.com ויוצרים פרויקט חדש בשם `smoch`.
2. **APIs & Services**, ואז **OAuth consent screen**:
   - User type: **External**
   - App name: `סמוך`, ומייל תמיכה: המייל שלך.
   - Authorized domains: `supabase.co`, ובהמשך גם הדומיין שלך.
   - שומרים, ובסוף לוחצים **Publish app** כדי שכל אחד יוכל להתחבר ולא רק משתמשי בדיקה.
3. **Credentials**, ואז **Create credentials**, ואז **OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: `https://<ה-Project-URL-שלך>/auth/v1/callback`
     (למשל `https://abcd1234.supabase.co/auth/v1/callback`).
   - מעתיקים את ה-**Client ID** ואת ה-**Client secret**.
4. חוזרים ל-Supabase, ואז **Authentication**, ואז **Sign In / Providers**, ואז **Google**:
   - מפעילים, מדביקים את ה-Client ID וה-Client secret ושומרים.

## 3. Vercel (אחסון האתר) — חובה

1. נכנסים ל-https://vercel.com ומתחברים עם GitHub.
2. **Add New**, ואז **Project**, ואז בוחרים את `Smoch` ולוחצים **Import**.
3. לפני Deploy פותחים את **Environment Variables** ומוסיפים:

| שם | ערך |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ה-Project URL מ-Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ה-Publishable key |
| `SUPABASE_SECRET_KEY` | ה-Secret key |
| `NEXT_PUBLIC_SITE_URL` | כתובת האתר, למשל `https://smoch.vercel.app` (אפשר לעדכן אחרי ה-Deploy הראשון) |

4. לוחצים **Deploy**. אם שיניתם משתנה אחרי ה-Deploy, צריך **Redeploy**.

## 4. לחבר את Supabase לכתובת האתר

ב-Supabase: **Authentication**, ואז **URL Configuration**:

- **Site URL**: כתובת האתר מ-Vercel, למשל `https://smoch.vercel.app`
- **Redirect URLs**: מוסיפים `https://smoch.vercel.app/auth/callback`, ואם יש דומיין משלכם, גם אותו.

## 5. להפוך את עצמך למנהל

1. נכנסים לאתר ומתחברים עם Google פעם אחת.
2. ב-Supabase, **SQL Editor**, מריצים (עם המייל שלך):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'avinoam147@gmail.com');
```

3. מרעננים את האתר. בתפריט המשתמש יופיע **פאנל ניהול**, ומשם אפשר להוסיף חברות ולמנות מנהלים נוספים.

> מסד הנתונים מתחיל ריק. החברות הבדויות מגרסת ההדגמה לא עוברות אליו. את החברות האמיתיות מוסיפים מהפאנל.

---

## אופציונלי (אפשר אחרי ההשקה)

### מיילים (התראות)
1. נרשמים ל-https://resend.com, מוסיפים את הדומיין ומאמתים אותו לפי ההוראות שלהם.
2. ב-Vercel מוסיפים `RESEND_API_KEY` ו-`EMAIL_FROM` (למשל `סמוך <no-reply@smoch.co.il>`).
3. כדאי גם להגדיר ב-Supabase את **Authentication**, ואז **Emails**, ואז **SMTP Settings** עם Resend, כדי שמיילים של מערכת ההתחברות לא יגיעו מכתובת של Supabase.

בלי זה האתר עובד רגיל, רק בלי התראות במייל.

### אימות טלפון ב-SMS
1. פותחים חשבון ב-https://twilio.com ומפעילים **Messaging Service**. העלות היא כ-0.05$ להודעה לישראל.
2. ב-Supabase: **Authentication**, ואז **Sign In / Providers**, ואז **Phone**: מפעילים, בוחרים Twilio ומדביקים את המפתחות.
3. בפאנל הניהול, **הגדרות**: מפעילים "חובת אימות טלפון" אם רוצים לחייב אותו.

### דומיין משלכם
קונים דומיין (למשל ב-Namecheap או ב-ISOC לסיומת `.co.il`), ואז ב-Vercel: **Settings**, ואז **Domains**, ומוסיפים אותו.
אחרי זה מעדכנים את `NEXT_PUBLIC_SITE_URL` ואת כתובות ה-Redirect ב-Supabase ובגוגל.

### גוגל
אחרי שיש דומיין: נרשמים ל-Google Search Console ושולחים את `https://<הדומיין>/sitemap.xml`.

---

## פיתוח מקומי (למתכנתים)

```bash
npm install
npx supabase start          # דורש Docker
npm run db:reset            # טבלאות + נתוני דמה
cp .env.example .env.local  # ולמלא את הערכים ש-supabase start מדפיס
npm run dev
```

בדיקות:

```bash
npm run test:db                          # 16 בדיקות של חוקי האבטחה במסד הנתונים
npm run build && npx next start -p 3000  # ובחלון נוסף:
npm run test:e2e                         # 12 תרחישים מלאים בדפדפן
```
