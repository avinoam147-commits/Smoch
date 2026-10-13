// End-to-end flows in a real browser against `next start` + local Supabase.
// Run: npx supabase db reset && npm run build && npx next start -p 3000 & node tests/e2e.mjs [screenshotDir]
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, SUPABASE_URL } from "./local-env.mjs";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("/opt/node22/lib/node_modules/playwright"));
}

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SB_URL = SUPABASE_URL;
const ANON = SUPABASE_ANON_KEY;
const SERVICE = SUPABASE_SERVICE_KEY;
const shots = process.argv[2];
const service = createClient(SB_URL, SERVICE, { auth: { persistSession: false } });
const run = Date.now().toString(36);
const body =
  "הקורס היה מסודר והמרצה ענה לשאלות. החומר על ניהול סיכונים היה הכי שימושי, אבל חלק מהשיעורים היו ארוכים מדי.";

async function makeUser(name, { admin = false } = {}) {
  const email = `${name}-${run}@test.local`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: "password-123",
    email_confirm: true,
    user_metadata: { full_name: `${name} טסט` },
  });
  if (error) throw error;
  if (admin) await service.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
  // Produce the same auth cookies the app sets after Google login.
  const jar = new Map();
  const sb = createServerClient(SB_URL, ANON, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach((c) => jar.set(c.name, c.value)),
    },
  });
  const { error: e2 } = await sb.auth.signInWithPassword({ email, password: "password-123" });
  if (e2) throw e2;
  return {
    id: data.user.id,
    email,
    cookies: [...jar].map(([name, value]) => ({ name, value, domain: "localhost", path: "/" })),
  };
}

const browser = await chromium.launch();
const errors = [];
let current = null;
async function pageFor(user, viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport, locale: "he-IL" });
  if (user) await ctx.addCookies(user.cookies);
  const page = await ctx.newPage();
  current = page;
  page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
  page.on(
    "console",
    (m) =>
      m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(`${page.url()}: ${m.text()}`),
  );
  page.on("dialog", (d) => d.accept(d.type() === "prompt" ? "בדיקה" : undefined));
  return page;
}
async function shot(page, name) {
  if (shots) await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
}
const steps = [];
async function step(name, fn) {
  try {
    await fn();
    steps.push(`ok   ${name}`);
  } catch (e) {
    steps.push(`FAIL ${name}: ${e.message.split("\n")[0]}`);
    if (shots && current && !current.isClosed())
      await current.screenshot({ path: `${shots}/FAIL-${name.slice(0, 20)}.png`, fullPage: true }).catch(() => {});
  }
}

const alice = await makeUser("alice");
const bob = await makeUser("bob");
const admin = await makeUser("admin", { admin: true });

await step("public: home, company page, JSON-LD", async () => {
  const p = await pageFor(null);
  await p.goto(BASE);
  await p
    .getByRole("heading", { name: "הכי מומלצים" })
    .or(p.getByRole("heading", { name: "חברות באתר" }))
    .first()
    .waitFor();
  assert.equal(await p.getByText("גרסת הדגמה").count(), 0, "demo banner hidden when Supabase is configured");
  await shot(p, "01-home");
  await p.goto(`${BASE}/company/green-candle`);
  await p.getByRole("heading", { name: "קורס הנר הירוק" }).waitFor();
  const ld = await p.locator('script[type="application/ld+json"]').textContent();
  assert.match(ld, /AggregateRating/, "12 ratings: score and rich result are public");
  await shot(p, "02-company");
  await p.goto(`${BASE}/company/eye-level-trading`);
  await p.getByText("למה הציון מוסתר?").waitFor();
  await p.getByText("2 מתוך 10").waitFor();
  const ld2 = await p.locator('script[type="application/ld+json"]').textContent();
  assert.doesNotMatch(ld2, /AggregateRating/, "below 10 ratings the score stays hidden");
  await shot(p, "02b-company-pending");
  await p.context().close();
});

await step("auth: admin panel is a 404 for anonymous users and non-admins", async () => {
  const p = await pageFor(alice);
  const res = await p.goto(`${BASE}/admin`);
  await p.getByText("הדף לא נמצא").waitFor();
  assert.ok(res);
  await p.context().close();
});

await step("review: write with receipt, published and visible", async () => {
  const p = await pageFor(alice);
  await p.goto(`${BASE}/company/green-candle/review`);
  await p.getByText("יפורסם בשם").waitFor();
  await p.getByRole("button", { name: "פרסום הביקורת" }).click();
  await p.getByText("בחרו דירוג").waitFor();
  await p.getByRole("radio", { name: /4 כוכבים/ }).click();
  await p.locator("#body").fill(`קורס מסודר עם מרצה זמין. ${body}`);
  await p.getByText("פרטי רכישה").click();
  await p.locator('input[name="amountPaid"]').fill("3400");
  await p
    .locator('input[type="file"]')
    .setInputFiles({ name: "receipt.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") });
  await shot(p, "03-review-form");
  await p.getByRole("button", { name: "פרסום הביקורת" }).click();
  await p.getByText("תודה, הביקורת פורסמה").waitFor();
  await p.getByText("הקבלה תיבדק ידנית").waitFor();
  await p.goto(`${BASE}/company/green-candle`);
  await p.getByText("קורס מסודר עם מרצה זמין").waitFor();
  await p.getByRole("link", { name: "עריכת הביקורת שלי" }).waitFor();
  await p.context().close();
});

await step("review: moderation warning and pending status", async () => {
  const p = await pageFor(alice);
  await p.goto(`${BASE}/company/signal-bot-pro/review`);
  await p.getByRole("radio", { name: /1 כוכבים/ }).click();
  await p.locator("#body").fill(`לא מומלץ בכלל. ${body} אלה נוכלים.`);
  await p.getByText("תעבור בדיקה ידנית").waitFor();
  await p.locator('input[name="paid"]').uncheck();
  await p.getByRole("button", { name: "פרסום הביקורת" }).click();
  await p.getByText("תודה, הביקורת התקבלה").waitFor();
  await p.context().close();
});

await step("review: a short review is quick, but needs a few words", async () => {
  const p = await pageFor(bob, { width: 390, height: 844 });
  await p.goto(`${BASE}/company/gal-trade-algo/review`);
  await p.getByRole("radio", { name: /2 כוכבים/ }).click();
  await p.locator("#body").fill("לא טוב");
  await p.getByText("עוד 4 תווים").waitFor();
  await p.getByRole("button", { name: "פרסום הביקורת" }).click();
  await p.getByText("כתבו לפחות כמה מילים על החוויה").waitFor();
  await p.locator("#body").fill("לא טוב, הבוט הפסיד כסף");
  await shot(p, "03b-quick-review-mobile");
  await p.getByRole("button", { name: "פרסום הביקורת" }).click();
  await p.getByText("תודה, הביקורת פורסמה").waitFor();
  await p.goto(`${BASE}/company/gal-trade-algo`);
  await p.getByText("הבוט הפסיד כסף").waitFor();
  await p.getByText("3 מתוך 10").waitFor();
  await p.context().close();
});

await step("votes and reports from another user persist", async () => {
  const p = await pageFor(bob);
  await p.goto(`${BASE}/company/green-candle`);
  const card = p.locator("article", { hasText: "קורס מסודר עם מרצה זמין" });
  await card.getByRole("button", { name: /מועיל/ }).click();
  await p.waitForTimeout(800);
  await p.reload();
  await p
    .locator("article", { hasText: "קורס מסודר עם מרצה זמין" })
    .getByRole("button", { name: /מועיל\s*1/ })
    .waitFor();
  const card2 = p.locator("article", { hasText: "קורס מסודר עם מרצה זמין" });
  await card2.getByRole("button", { name: "דיווח" }).click();
  await card2.getByRole("radio", { name: "ביקורת מזויפת או ממומנת" }).click();
  await card2.getByRole("button", { name: "שליחת דיווח" }).click();
  await p.getByText("הדיווח הועבר לבדיקה").waitFor();
  await p.context().close();
});

await step("add company: suggestion goes to admin queue and account page", async () => {
  const p = await pageFor(bob);
  await p.goto(`${BASE}/add-company`);
  await p.locator("#name").fill(`אקדמיית בדיקה ${run}`);
  await p.locator("#category").selectOption("signals");
  await p.locator("#website").fill("test-academy.example");
  await p.getByRole("button", { name: "שליחה לבדיקה" }).click();
  await p.getByText("נשלחה לבדיקה").waitFor();
  await p.goto(`${BASE}/account`);
  await p.getByText(`אקדמיית בדיקה ${run}`).waitFor();
  await shot(p, "04-account");
  await p.context().close();
});

await step("claim: user asks to manage a company page", async () => {
  const p = await pageFor(bob);
  await p.goto(`${BASE}/company/green-candle/claim`);
  await p.locator("#fullName").fill("בוב טסט");
  await p.locator("#jobTitle").fill("מנהל שיווק");
  await p.locator("#workEmail").fill("bob@green-candle.example");
  await p.getByRole("button", { name: "שליחת בקשה" }).click();
  await p.getByText("הבקשה נשלחה").waitFor();
  await p.context().close();
});

await step("admin: dashboard, approve company, receipt, claim, report", async () => {
  const p = await pageFor(admin);
  await p.goto(`${BASE}/admin`);
  await p.getByRole("heading", { name: "סקירה" }).waitFor();
  await shot(p, "05-admin-home");

  await p.goto(`${BASE}/admin/companies?status=pending`);
  const row = p.locator("tr", { hasText: `אקדמיית בדיקה ${run}` });
  await row.getByRole("button", { name: "אישור" }).click();
  await row.waitFor({ state: "detached" });

  await p.goto(`${BASE}/admin/receipts`);
  await shot(p, "06-admin-receipts");
  await p.getByRole("button", { name: "אישור רכישה" }).first().click();
  await p.getByText("אין קבלות שממתינות לבדיקה").waitFor();

  await p.goto(`${BASE}/admin/claims`);
  await p.getByText("תואם לאתר", { exact: true }).waitFor();
  await p.getByRole("button", { name: "אישור" }).first().click();
  await p.getByText("אין בקשות ממתינות").waitFor();

  await p.goto(`${BASE}/admin/reports`);
  await shot(p, "07-admin-reports");
  await p.getByRole("button", { name: "הביקורת תקינה, סגירה" }).first().click();
  await p.getByText("אין דיווחים פתוחים").waitFor();

  await p.goto(`${BASE}/admin/reviews?status=pending`);
  await p.getByText("לא מומלץ בכלל").waitFor();
  await shot(p, "08-admin-reviews");
  await p.context().close();

  const pub = await pageFor(null);
  await pub.goto(`${BASE}/companies?q=${encodeURIComponent("אקדמיית בדיקה")}`);
  await pub.getByText(`אקדמיית בדיקה ${run}`).waitFor();
  await pub.goto(`${BASE}/company/green-candle`);
  await pub.locator("article", { hasText: "קורס מסודר עם מרצה זמין" }).getByText("רכישה מאומתת").waitFor();
  await pub.context().close();
});

await step("admin: create, edit and delete a company and a staff review", async () => {
  const p = await pageFor(admin);
  await p.goto(`${BASE}/admin/companies/new`);
  await p.locator('input[name="name"]:visible').fill("קורס חדש מהפאנל");
  await p.locator('input[name="slug"]:visible').fill(`panel-${run}`);
  await p.locator('input[name="tagline"]:visible').fill("שורת תיאור מהפאנל");
  await p.getByRole("button", { name: "יצירת חברה" }).click();
  await p.getByText("החברה נוצרה").waitFor();
  await shot(p, "09-admin-company-edit");
  await p.locator('input[name="tagline"]:visible').fill("שורת תיאור מעודכנת");
  await p.getByRole("button", { name: "שמירה", exact: true }).click();
  await p.getByText("נשמר.").filter({ visible: true }).first().waitFor();

  await p.getByRole("link", { name: "הוספת ביקורת" }).click();
  await p.locator('input[name="authorName"]:visible').fill("יעל מ.");
  await p.getByRole("radio", { name: /5 כוכבים/ }).click();
  await p.locator('textarea[name="body"]:visible').fill(body);
  await p.getByRole("button", { name: "יצירת ביקורת" }).click();
  await p.getByText("הביקורת נוצרה").waitFor();
  await shot(p, "10-admin-review-edit");

  const pub = await pageFor(null);
  await pub.goto(`${BASE}/company/panel-${run}`);
  await pub.getByText("שורת תיאור מעודכנת").waitFor();
  await pub.getByText("הוזנה על ידי הצוות").waitFor();
  await pub.context().close();

  await p.locator('select[name="status"]:visible').selectOption("hidden");
  await p.getByRole("button", { name: "שמירה", exact: true }).first().click();
  await p.getByText("נשמר.").filter({ visible: true }).first().waitFor();
  const pub2 = await pageFor(null);
  await pub2.goto(`${BASE}/company/panel-${run}`);
  await pub2.getByText("עדיין אין דירוגים").waitFor();
  await pub2.context().close();

  await p.goto(`${BASE}/admin/companies?q=panel-${run}`);
  await p.getByRole("link", { name: "קורס חדש מהפאנל" }).first().click();
  await p.getByRole("button", { name: "מחיקה לצמיתות" }).click();
  await p.getByText("החברה נמחקה").waitFor();

  await p.goto(`${BASE}/admin/audit`);
  await p.getByText("מחיקת חברה ״קורס חדש מהפאנל״").waitFor();
  await shot(p, "11-admin-audit");
  await p.goto(`${BASE}/admin/settings`);
  await p.getByRole("button", { name: "שמירה" }).click();
  await p.getByText("ההגדרות נשמרו").waitFor();
  await p.goto(`${BASE}/admin/users`);
  await p.getByText(alice.email).waitFor();
  await shot(p, "12-admin-users");
  await p.context().close();
});

await step("company rep: approved member replies publicly", async () => {
  const p = await pageFor(bob);
  await p.goto(`${BASE}/company/green-candle`);
  const card = p.locator("article", { hasText: "קורס מסודר עם מרצה זמין" });
  await card.getByRole("button", { name: "תגובת החברה" }).click();
  await card.locator("textarea").fill("תודה רבה על הביקורת, נשמח לראות אותך במפגש הבא.");
  await card.getByRole("button", { name: "פרסום תגובה" }).click();
  await p.waitForTimeout(1500);
  await card.getByText("נשמח לראות אותך במפגש הבא").waitFor();
  await p.reload();
  await p.locator("article", { hasText: "קורס מסודר עם מרצה זמין" }).getByText("תגובת קורס הנר הירוק").waitFor();
  await p.context().close();
});

await step("account: rename, edit own review, delete account", async () => {
  const p = await pageFor(alice, { width: 390, height: 844 });
  await p.goto(`${BASE}/account`);
  await p.locator("#displayName").fill("אליס ט.");
  await p.getByRole("button", { name: "שמירה" }).click();
  await p.getByText("נשמר.").filter({ visible: true }).first().waitFor();
  await shot(p, "13-account-mobile");
  await p.goto(`${BASE}/company/green-candle/review`);
  await p.getByRole("heading", { name: /עריכת הביקורת שלך/ }).waitFor();
  await p.locator("#body").fill(`קורס מסודר עם מרצה זמין מאוד. ${body}`);
  await p.getByRole("button", { name: "שמירת השינויים" }).click();
  await p.getByText("תודה, הביקורת פורסמה").waitFor();
  await p.goto(`${BASE}/account`);
  await p.getByRole("button", { name: "מחיקת החשבון" }).click();
  await p.locator("#confirm-delete").fill("מחיקה");
  await p.getByRole("button", { name: "מחיקה לצמיתות" }).click();
  await p.waitForURL(`${BASE}/?deleted=1`);
  await p.context().close();
  const { data } = await service.from("reviews").select("id").eq("user_id", alice.id);
  assert.equal(data.length, 0);
});

await step("admin: categories can be added, used and shown only when they have companies", async () => {
  const p = await pageFor(admin);
  await p.goto(`${BASE}/admin/categories`);
  await p.locator('input[name="label"]:visible').fill("מוסכים");
  await p.locator('input[name="id"]:visible').fill(`garages-${run}`);
  await p.getByRole("button", { name: "הוספת קטגוריה" }).click();
  await p.getByText("הקטגוריה נשמרה").waitFor();
  await shot(p, "15-admin-categories");

  const pub = await pageFor(null);
  await pub.goto(`${BASE}/companies`);
  await pub.getByRole("group", { name: "סינון לפי קטגוריה" }).waitFor();
  assert.equal(await pub.getByRole("button", { name: "מוסכים" }).count(), 0, "empty category is hidden");

  await p.goto(`${BASE}/admin/companies/new`);
  await p.locator('input[name="name"]:visible').fill("מוסך הבדיקה");
  await p.locator('input[name="slug"]:visible').fill(`garage-${run}`);
  await p.locator('select[name="category"]:visible').selectOption(`garages-${run}`);
  await p.getByRole("button", { name: "יצירת חברה" }).click();
  await p.getByText("החברה נוצרה").waitFor();
  await p.context().close();

  await pub.goto(`${BASE}/companies`);
  await pub.getByRole("button", { name: "מוסכים" }).click();
  await pub.getByText("מוסך הבדיקה").waitFor();
  await pub.context().close();
});

await step("admin: home page picks are labelled sponsored, the label can be removed", async () => {
  const p = await pageFor(admin);
  for (const name of ["מסחר בגובה העיניים", "סיגנל-בוט פרו"]) {
    await p.goto(`${BASE}/admin/home`);
    await p.locator('select[name="companyId"]:visible').selectOption({ label: name });
    await p.getByRole("button", { name: "הוספה לדף הבית" }).click();
    await p.getByText("נשמר. השינוי כבר מופיע בדף הבית").waitFor();
  }
  const pub = await pageFor(null);
  await pub.goto(BASE);
  const section = pub.locator("section", { has: pub.getByRole("heading", { name: "חברות נבחרות" }) });
  await section.getByText("מסחר בגובה העיניים").waitFor();
  assert.equal(await section.getByText("ממומן", { exact: true }).count(), 2, "every pick starts as sponsored");
  assert.equal(await section.getByText("2 דירוגים · ציון יוצג מ-10").count(), 1, "picks keep their real rating");

  // Move the second pick up, then take its label off.
  await p.goto(`${BASE}/admin/home`);
  await p.getByRole("button", { name: "למעלה" }).click();
  await p.locator("tbody tr").first().getByText("סיגנל-בוט פרו").waitFor();
  await p.getByRole("button", { name: "ממומן · הורדה" }).first().click();
  await p.getByRole("button", { name: "בלי תווית · הוספה" }).waitFor();
  await shot(p, "17-admin-home");

  await pub.reload();
  const cards = section.locator("a");
  await cards.first().getByText("סיגנל-בוט פרו").waitFor();
  assert.equal(await cards.first().getByText("ממומן", { exact: true }).count(), 0, "label removed");
  assert.equal(await cards.nth(1).getByText("ממומן", { exact: true }).count(), 1, "the other pick keeps its label");

  // A pick whose end date has passed disappears from the home page.
  await p.locator("tbody tr").first().getByRole("link", { name: "עריכה" }).click();
  await p.getByRole("heading", { name: "עריכת ״סיגנל-בוט פרו״" }).waitFor();
  await p.locator('input[name="endsAt"]:visible').fill("2020-01-01");
  await p.getByRole("button", { name: "שמירה" }).click();
  await p.getByText("התקופה הסתיימה").waitFor();
  await pub.reload();
  await section.getByText("מסחר בגובה העיניים").waitFor();
  assert.equal(await section.getByText("סיגנל-בוט פרו").count(), 0, "expired pick is hidden");
  await shot(pub, "18-home-featured");

  await p.getByRole("button", { name: "הסרה" }).first().click();
  await p.locator("tbody").getByText("סיגנל-בוט פרו").waitFor({ state: "detached" });
  await p.context().close();
  await pub.context().close();
});

await step("layout: a long word with no spaces can't widen the page", async () => {
  const eve = await makeUser("eve");
  const p = await pageFor(eve, { width: 390, height: 844 });
  await p.goto(`${BASE}/company/nachshon-trading-house/review`);
  await p.getByRole("radio", { name: /3 כוכבים/ }).click();
  await p.locator("#body").fill("ח".repeat(160) + "verylongwordwithoutanyspaces".repeat(6));
  await p.getByRole("button", { name: "פרסום הביקורת" }).click();
  await p.getByText("תודה, הביקורת פורסמה").waitFor();
  for (const path of ["/", "/company/nachshon-trading-house"]) {
    for (const width of [390, 1280]) {
      await p.setViewportSize({ width, height: 900 });
      await p.goto(`${BASE}${path}`);
      await p.waitForLoadState("networkidle");
      const w = await p.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(w <= width, `${path} at ${width}px: scrollWidth ${w}`);
    }
  }
  await shot(p, "16-long-word");
  await p.context().close();
});

await step("mobile: no horizontal scroll on key pages", async () => {
  const p = await pageFor(admin, { width: 390, height: 844 });
  for (const path of [
    "/",
    "/companies",
    "/company/green-candle",
    "/admin",
    "/admin/reviews",
    "/admin/companies",
    "/admin/categories",
    "/admin/home",
  ]) {
    await p.goto(`${BASE}${path}`);
    await p.waitForLoadState("networkidle");
    const w = await p.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(w <= 390, `${path} scrollWidth ${w}`);
  }
  await shot(p, "14-admin-mobile");
  await p.context().close();
});

await browser.close();
console.log(steps.join("\n"));
if (errors.length) console.log("\nBrowser errors:\n" + [...new Set(errors)].join("\n"));
process.exit(steps.some((s) => s.startsWith("FAIL")) ? 1 : 0);
