import "server-only";
import { createServiceClient } from "./supabase/service";
import { siteName, siteUrl } from "./site";
import { excerpt } from "./format";

// Transactional email. Silently skipped until RESEND_API_KEY and the
// Supabase secret key are configured, so nothing here can block a request.

const apiKey = process.env.RESEND_API_KEY ?? "";
const from = process.env.EMAIL_FROM ?? `${siteName} <no-reply@example.com>`;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, paragraphs: string[], cta?: { label: string; href: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 12px;line-height:1.6">${escapeHtml(p)}</p>`).join("");
  const button = cta
    ? `<p style="margin:20px 0 0"><a href="${cta.href}" style="background:#0e6b5c;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;display:inline-block">${escapeHtml(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html lang="he" dir="rtl"><body style="margin:0;background:#f7f6f2;font-family:Arial,sans-serif;color:#1a1a17">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<p style="font-weight:800;font-size:20px;margin:0 0 24px">${siteName}</p>
<div style="background:#fff;border:1px solid #e4e1d8;border-radius:16px;padding:24px">
<h1 style="font-size:18px;margin:0 0 12px">${escapeHtml(title)}</h1>${body}${button}</div>
<p style="font-size:12px;color:#6b6a63;margin:16px 0 0">אפשר לכבות התראות במייל בדף החשבון: ${siteUrl}/account</p>
</div></body></html>`;
}

async function send(to: string, subject: string, html: string) {
  if (!apiKey) {
    console.info(`[email skipped: no RESEND_API_KEY] ${to}: ${subject}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) console.error("[email failed]", res.status, await res.text().catch(() => ""));
}

/** Email addresses of users who haven't turned notifications off. */
async function recipients(userIds: string[]) {
  const admin = createServiceClient();
  if (!admin || userIds.length === 0) return [];
  const { data: profiles } = await admin.from("profiles").select("id, notify_email").in("id", userIds);
  const wanted = (profiles ?? []).filter((p) => p.notify_email).map((p) => p.id);
  const emails: string[] = [];
  for (const id of wanted) {
    const { data } = await admin.auth.admin.getUserById(id);
    if (data.user?.email) emails.push(data.user.email);
  }
  return emails;
}

async function safely(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    console.error("[notify]", e);
  }
}

export function notifyReplyPosted(reviewId: string) {
  return safely(async () => {
    const admin = createServiceClient();
    if (!admin) return;
    const { data } = await admin
      .from("reviews")
      .select("user_id, body, rating, companies(name, slug)")
      .eq("id", reviewId)
      .single();
    if (!data?.user_id || !data.companies) return;
    for (const to of await recipients([data.user_id])) {
      await send(
        to,
        `${data.companies.name} הגיבו לביקורת שלך`,
        layout(
          `${data.companies.name} הגיבו לביקורת שלך`,
          [`על הביקורת: ${data.rating} כוכבים${data.body ? `, ״${excerpt(data.body, 80)}״` : ""}`],
          {
            label: "לצפייה בתגובה",
            href: `${siteUrl}/company/${data.companies.slug}#review-${reviewId}`,
          },
        ),
      );
    }
  });
}

export function notifyNewReview(reviewId: string) {
  return safely(async () => {
    const admin = createServiceClient();
    if (!admin) return;
    const { data } = await admin
      .from("reviews")
      .select("status, company_id, rating, body, companies(name, slug)")
      .eq("id", reviewId)
      .single();
    if (!data || data.status !== "published" || !data.companies) return;
    const { data: members } = await admin.from("company_members").select("user_id").eq("company_id", data.company_id);
    for (const to of await recipients((members ?? []).map((m) => m.user_id))) {
      await send(
        to,
        `ביקורת חדשה על ${data.companies.name}`,
        layout(
          `ביקורת חדשה על ${data.companies.name}`,
          [
            `${data.rating} כוכבים${data.body ? `: ״${excerpt(data.body, 120)}״` : " (בלי טקסט)"}`,
            "אפשר להגיב לביקורות בפומבי מדף החברה.",
          ],
          {
            label: "לביקורת",
            href: `${siteUrl}/company/${data.companies.slug}#review-${reviewId}`,
          },
        ),
      );
    }
  });
}

export function notifyCompanyDecision(companyId: string) {
  return safely(async () => {
    const admin = createServiceClient();
    if (!admin) return;
    const { data } = await admin
      .from("companies")
      .select("name, slug, status, created_by, admin_note")
      .eq("id", companyId)
      .single();
    if (!data?.created_by || !["published", "rejected"].includes(data.status)) return;
    const approved = data.status === "published";
    for (const to of await recipients([data.created_by])) {
      await send(
        to,
        approved ? `${data.name} עלתה לאתר` : `לגבי ההצעה להוסיף את ${data.name}`,
        approved
          ? layout(`${data.name} עלתה לאתר`, ["תודה שהוספת את החברה. עכשיו אפשר לכתוב עליה ביקורת."], {
              label: "לדף החברה",
              href: `${siteUrl}/company/${data.slug}`,
            })
          : layout(`לא הוספנו את ${data.name}`, [
              data.admin_note || "החברה כבר קיימת באתר או שאינה מתאימה לקטגוריות שלנו.",
            ]),
      );
    }
  });
}

export function notifyClaimDecision(claimId: string) {
  return safely(async () => {
    const admin = createServiceClient();
    if (!admin) return;
    const { data } = await admin
      .from("company_claims")
      .select("user_id, status, admin_note, companies(name, slug)")
      .eq("id", claimId)
      .single();
    if (!data?.companies || data.status === "pending") return;
    const approved = data.status === "approved";
    for (const to of await recipients([data.user_id])) {
      await send(
        to,
        approved ? `אושרת כנציג/ה של ${data.companies.name}` : `לגבי הבקשה לנהל את ${data.companies.name}`,
        approved
          ? layout(`אושרת כנציג/ה של ${data.companies.name}`, ["מעכשיו אפשר להגיב לביקורות בפומבי מדף החברה."], {
              label: "לדף החברה",
              href: `${siteUrl}/company/${data.companies.slug}`,
            })
          : layout("הבקשה לא אושרה", [data.admin_note || "לא הצלחנו לאמת את הקשר שלך לחברה."]),
      );
    }
  });
}

export function notifyReceiptDecision(receiptId: string) {
  return safely(async () => {
    const admin = createServiceClient();
    if (!admin) return;
    const { data } = await admin
      .from("receipts")
      .select("user_id, status, admin_note, reviews(companies(name, slug))")
      .eq("id", receiptId)
      .single();
    const company = data?.reviews?.companies;
    if (!data || !company || data.status === "pending") return;
    const approved = data.status === "approved";
    for (const to of await recipients([data.user_id])) {
      await send(
        to,
        approved ? "הרכישה אומתה" : "לא הצלחנו לאמת את הקבלה",
        approved
          ? layout("הרכישה אומתה", [`לביקורת שלך על ${company.name} נוסף תג ״רכישה מאומתת״. הקובץ נמחק.`], {
              label: "לביקורת",
              href: `${siteUrl}/company/${company.slug}`,
            })
          : layout("לא הצלחנו לאמת את הקבלה", [
              data.admin_note || "הקובץ לא היה קריא או שלא הופיע בו שם החברה.",
              "הקובץ נמחק. אפשר לצרף קבלה אחרת מדף החשבון.",
            ]),
      );
    }
  });
}
