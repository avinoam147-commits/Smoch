// Integration tests for the database rules (RLS + triggers) against a local
// Supabase: `npx supabase start && node --test tests/db.test.mjs`.
// They call the REST API directly, the way an attacker could, not through the UI.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, SUPABASE_URL } from "./local-env.mjs";

const url = SUPABASE_URL;
const anonKey = SUPABASE_ANON_KEY;
const serviceKey = SUPABASE_SERVICE_KEY;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

const service = createClient(url, serviceKey, opts);
const anon = createClient(url, anonKey, opts);
const run = Date.now().toString(36);
const longBody = "תוכן הביקורת המפורט שמתאר חוויה אישית עם החברה, מה הובטח ומה התקבל בפועל, כולל פרטים על השירות. ";

async function makeUser(name) {
  const email = `${name}-${run}@test.local`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: "password-123",
    email_confirm: true,
    user_metadata: { full_name: `${name} בודק` },
  });
  if (error) throw error;
  const client = createClient(url, anonKey, opts);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password: "password-123" });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

async function newCompany(status = "published") {
  const slug = `t-${run}-${Math.random().toString(36).slice(2, 7)}`;
  const { data, error } = await admin.client
    .from("companies")
    .insert({ slug, name: `חברת בדיקה ${slug}`, category: "courses", status })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function setSetting(key, value) {
  const { error } = await admin.client.from("app_settings").update({ value }).eq("key", key);
  if (error) throw error;
}

let admin, alice, bob, carol;

before(async () => {
  admin = await makeUser("admin");
  alice = await makeUser("alice");
  bob = await makeUser("bob");
  carol = await makeUser("carol");
  // Bootstrap the first admin the same way the setup guide does (SQL / service role).
  const { error } = await service.from("profiles").update({ role: "admin" }).eq("id", admin.id);
  if (error) throw error;
  await setSetting("reviews_per_day", 50);
  await setSetting("require_phone_for_reviews", false);
  await setSetting("auto_publish_reviews", true);
});

test("profiles: display name is first name + initial, and role can't be self-promoted", async () => {
  const { data } = await alice.client.from("profiles").select("display_name, role").eq("id", alice.id).single();
  assert.equal(data.display_name, "alice ב.");
  await alice.client
    .from("profiles")
    .update({ role: "admin", is_banned: false, display_name: "אליס" })
    .eq("id", alice.id);
  const { data: after } = await alice.client.from("profiles").select("display_name, role").eq("id", alice.id).single();
  assert.equal(after.role, "user");
  assert.equal(after.display_name, "אליס");
  const { data: others } = await alice.client.from("profiles").select("id").neq("id", alice.id);
  assert.equal(others.length, 0, "users can't list other profiles");
});

test("companies: suggestions are forced to pending and hidden from the public", async () => {
  const slug = `sug-${run}`;
  const { data, error } = await alice.client
    .from("companies")
    .insert({ slug, name: "הצעה חדשה", category: "signals", status: "published", registry_verified: true })
    .select()
    .single();
  assert.ifError(error);
  assert.equal(data.status, "pending");
  assert.equal(data.registry_verified, false);
  assert.equal(data.created_by, alice.id);

  const { data: pub } = await anon.from("companies").select("id").eq("slug", slug);
  assert.equal(pub.length, 0);
  const { data: other } = await bob.client.from("companies").select("id").eq("slug", slug);
  assert.equal(other.length, 0);

  const { error: updErr, data: upd } = await alice.client
    .from("companies")
    .update({ status: "published" })
    .eq("slug", slug)
    .select();
  assert.ok(updErr || upd.length === 0, "suggester can't publish");

  await admin.client.from("companies").update({ status: "published" }).eq("slug", slug);
  const { data: pub2 } = await anon.from("companies").select("id").eq("slug", slug);
  assert.equal(pub2.length, 1);
});

test("reviews: server decides author, status and verified flag", async () => {
  const c = await newCompany();
  const { data, error } = await alice.client
    .from("reviews")
    .insert({
      company_id: c.id,
      author_name: "מישהו אחר",
      rating: 4,

      body: longBody,
      verified_purchase: true,
      helpful_count: 999,
      status: "published",
      source: "staff",
      user_id: bob.id,
    })
    .select()
    .single();
  assert.ifError(error);
  assert.equal(data.user_id, alice.id);
  assert.equal(data.author_name, "אליס");
  assert.equal(data.verified_purchase, false);
  assert.equal(data.helpful_count, 0);
  assert.equal(data.source, "user");
  assert.equal(data.status, "published");

  const dup = await alice.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 1, body: longBody });
  assert.equal(dup.error?.code, "23505", "one review per user per company");
});

test("reviews: a few words are required, there is no other length rule", async () => {
  const c = await newCompany();
  const empty = await alice.client.from("reviews").insert({ company_id: c.id, author_name: "x", rating: 4 });
  assert.ok(empty.error, "a rating needs text");
  const blank = await alice.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 4, body: "         " });
  assert.ok(blank.error, "whitespace isn't text");
  const short = await alice.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 4, body: "טוב מאוד" });
  assert.ok(short.error, "under 10 characters is rejected");

  const { data, error } = await alice.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 4, body: "קורס טוב מאוד" })
    .select()
    .single();
  assert.ifError(error);
  assert.equal(data.status, "published");

  const tooLong = await bob.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 3, body: "א".repeat(5001) });
  assert.ok(tooLong.error, "text is capped at 5000 characters");
});

test("reviews: phone numbers, links and accusations are held for moderation", async () => {
  for (const text of ["התקשרו אליי 050-1234567", "ראו www.example.com", "הם פשוט נוכלים"]) {
    const c = await newCompany();
    const { data, error } = await bob.client
      .from("reviews")
      .insert({ company_id: c.id, author_name: "x", rating: 1, body: `${longBody} ${text}` })
      .select()
      .single();
    assert.ifError(error);
    assert.equal(data.status, "pending", text);
    assert.ok(data.moderation_note);
    const { data: pub } = await anon.from("reviews").select("id").eq("id", data.id);
    assert.equal(pub.length, 0, "pending reviews are not public");
  }
});

test("reviews: owners edit content only; moderators' decisions stick", async () => {
  const c = await newCompany();
  const { data: r } = await carol.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 2, body: longBody })
    .select()
    .single();

  const { data: upd } = await carol.client
    .from("reviews")
    .update({ rating: 3, verified_purchase: true, helpful_count: 50, company_id: (await newCompany()).id })
    .eq("id", r.id)
    .select()
    .single();
  assert.equal(upd.rating, 3);
  assert.equal(upd.verified_purchase, false);
  assert.equal(upd.helpful_count, 0);
  assert.equal(upd.company_id, c.id);
  assert.ok(upd.edited_at);

  const { data: other } = await bob.client.from("reviews").update({ rating: 1 }).eq("id", r.id).select();
  assert.equal(other.length, 0, "can't edit someone else's review");

  await admin.client.from("reviews").update({ status: "hidden", moderation_note: "הפרה" }).eq("id", r.id);
  const { data: again } = await carol.client
    .from("reviews")
    .update({ body: "טקסט חדש וארוך יותר" })
    .eq("id", r.id)
    .select()
    .single();
  assert.equal(again.status, "hidden", "editing doesn't un-hide");
});

test("reviews: daily rate limit and phone requirement are enforced", async () => {
  await setSetting("reviews_per_day", 1);
  const dave = await makeUser("dave");
  const c1 = await newCompany();
  const c2 = await newCompany();
  const ok = await dave.client
    .from("reviews")
    .insert({ company_id: c1.id, author_name: "x", rating: 5, body: longBody });
  assert.ifError(ok.error);
  const limited = await dave.client
    .from("reviews")
    .insert({ company_id: c2.id, author_name: "x", rating: 5, body: longBody });
  assert.match(limited.error?.message ?? "", /rate_limited/);
  await setSetting("reviews_per_day", 50);

  await setSetting("require_phone_for_reviews", true);
  const phoneless = await dave.client
    .from("reviews")
    .insert({ company_id: c2.id, author_name: "x", rating: 5, body: longBody });
  assert.match(phoneless.error?.message ?? "", /phone_required/);
  await setSetting("require_phone_for_reviews", false);
});

test("reviews: can't review a company that isn't published", async () => {
  const c = await newCompany("pending");
  const res = await bob.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 5, body: longBody });
  assert.ok(res.error);
});

test("votes: count is maintained and self-votes are blocked", async () => {
  const c = await newCompany();
  const { data: r } = await alice.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 5, body: longBody })
    .select()
    .single();
  const self = await alice.client.from("review_votes").insert({ review_id: r.id, user_id: alice.id });
  assert.ok(self.error);
  const spoof = await carol.client.from("review_votes").insert({ review_id: r.id, user_id: bob.id });
  assert.ok(spoof.error, "can't vote as someone else");
  assert.ifError((await bob.client.from("review_votes").insert({ review_id: r.id, user_id: bob.id })).error);
  assert.ifError((await carol.client.from("review_votes").insert({ review_id: r.id, user_id: carol.id })).error);
  let { data } = await anon.from("reviews").select("helpful_count").eq("id", r.id).single();
  assert.equal(data.helpful_count, 2);
  await bob.client.from("review_votes").delete().eq("review_id", r.id).eq("user_id", bob.id);
  ({ data } = await anon.from("reviews").select("helpful_count, edited_at, status").eq("id", r.id).single());
  assert.equal(data.helpful_count, 1);
  assert.equal(data.edited_at, null, "votes don't mark the review as edited");
});

test("reports: one per user, private to reporter and admins", async () => {
  const c = await newCompany();
  const { data: r } = await alice.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 1, body: longBody })
    .select()
    .single();
  const { data: rep, error } = await bob.client
    .from("reports")
    .insert({ review_id: r.id, reason: "fake", status: "actioned" })
    .select()
    .single();
  assert.ifError(error);
  assert.equal(rep.status, "open");
  assert.equal((await bob.client.from("reports").insert({ review_id: r.id, reason: "other" })).error?.code, "23505");
  assert.equal((await alice.client.from("reports").select("id").eq("id", rep.id)).data.length, 0);
  assert.equal((await admin.client.from("reports").select("id").eq("id", rep.id)).data.length, 1);
  const { data: closed } = await bob.client.from("reports").update({ status: "dismissed" }).eq("id", rep.id).select();
  assert.equal(closed.length, 0, "reporters can't resolve");
});

test("claims and replies: only approved representatives reply", async () => {
  const c = await newCompany();
  const { data: r } = await alice.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 2, body: longBody })
    .select()
    .single();

  const early = await carol.client.from("review_replies").insert({ review_id: r.id, company_id: c.id, body: "תגובה" });
  assert.ok(early.error, "non-members can't reply");

  const { data: claim, error } = await carol.client
    .from("company_claims")
    .insert({
      company_id: c.id,
      full_name: "קרול",
      job_title: "מנכ״לית",
      work_email: "carol@company.co.il",
      status: "approved",
    })
    .select()
    .single();
  assert.ifError(error);
  assert.equal(claim.status, "pending");
  const self = await carol.client.from("company_claims").update({ status: "approved" }).eq("id", claim.id).select();
  assert.equal(self.data.length, 0, "can't approve own claim");

  await admin.client.from("company_claims").update({ status: "approved" }).eq("id", claim.id);
  const { data: company } = await anon.from("companies").select("claimed").eq("id", c.id).single();
  assert.equal(company.claimed, true);

  const reply = await carol.client
    .from("review_replies")
    .insert({ review_id: r.id, company_id: c.id, body: "תודה על המשוב" })
    .select()
    .single();
  assert.ifError(reply.error);
  const { data: pub } = await anon.from("reviews").select("review_replies(body)").eq("id", r.id).single();
  assert.equal(pub.review_replies.body, "תודה על המשוב");

  const other = await newCompany();
  const { data: r2 } = await bob.client
    .from("reviews")
    .insert({ company_id: other.id, author_name: "x", rating: 2, body: longBody })
    .select()
    .single();
  const cross = await carol.client.from("review_replies").insert({ review_id: r2.id, company_id: c.id, body: "תגובה" });
  assert.ok(cross.error, "can't reply on another company's review by spoofing company_id");
});

test("receipts: private storage, admin approval sets verified purchase", async () => {
  const c = await newCompany();
  const { data: r } = await bob.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 4, body: longBody })
    .select()
    .single();
  const file = new Blob(["%PDF-1.4 test"], { type: "application/pdf" });

  const foreign = await bob.client.storage.from("receipts").upload(`${alice.id}/${r.id}/x.pdf`, file);
  assert.ok(foreign.error, "can't upload into someone else's folder");

  const path = `${bob.id}/${r.id}/receipt.pdf`;
  assert.ifError(
    (await bob.client.storage.from("receipts").upload(path, file, { contentType: "application/pdf" })).error,
  );
  const peek = await alice.client.storage.from("receipts").download(path);
  assert.ok(peek.error, "other users can't read receipts");

  const wrongPath = await bob.client.from("receipts").insert({ review_id: r.id, storage_path: `${alice.id}/x.pdf` });
  assert.ok(wrongPath.error);
  const { data: rc, error } = await bob.client
    .from("receipts")
    .insert({ review_id: r.id, storage_path: path, status: "approved" })
    .select()
    .single();
  assert.ifError(error);
  assert.equal(rc.status, "pending");

  const { data: signed } = await admin.client.storage.from("receipts").createSignedUrl(path, 60);
  assert.ok(signed?.signedUrl, "admins can open receipts");

  await admin.client.from("receipts").update({ status: "approved" }).eq("id", rc.id);
  const { data: after } = await anon.from("reviews").select("verified_purchase").eq("id", r.id).single();
  assert.equal(after.verified_purchase, true);
  assert.ifError((await admin.client.storage.from("receipts").remove([path])).error);
});

test("admin: staff reviews are labelled and every admin change is audited", async () => {
  const c = await newCompany();
  const { data: r, error } = await admin.client
    .from("reviews")
    .insert({
      company_id: c.id,
      author_name: "יעל מ.",
      rating: 5,

      body: longBody,
      status: "published",
    })
    .select()
    .single();
  assert.ifError(error);
  assert.equal(r.source, "staff");
  assert.equal(r.added_by, admin.id);
  await admin.client.from("reviews").update({ status: "hidden" }).eq("id", r.id);
  const { data: audit } = await admin.client
    .from("admin_audit")
    .select("action, entity, entity_id, actor_id")
    .eq("entity_id", r.id);
  assert.ok(audit.some((a) => a.action === "insert"));
  assert.ok(audit.some((a) => a.action === "update" && a.actor_id === admin.id));
  const { data: hidden } = await alice.client.from("admin_audit").select("id");
  assert.equal(hidden.length, 0, "only admins read the audit log");
});

test("admin helpers are closed to regular users", async () => {
  const res = await alice.client.rpc("admin_list_users", {});
  assert.ok(res.error);
  const anonRes = await anon.rpc("delete_my_account");
  assert.ok(anonRes.error);
  const ok = await admin.client.rpc("admin_list_users", { search: `alice-${run}` });
  assert.ifError(ok.error);
  assert.equal(ok.data.length, 1);
});

test("stats: trust score is a weighted Bayesian average of published reviews", async () => {
  const c = await newCompany();
  const users = await Promise.all(["s1", "s2", "s3"].map(makeUser));
  for (const u of users) {
    await u.client.from("reviews").insert({ company_id: c.id, author_name: "x", rating: 5, body: longBody });
  }
  const { data } = await anon.from("company_stats").select("*").eq("company_id", c.id).single();
  assert.equal(data.review_count, 3);
  assert.equal(data.r5, 3);
  assert.equal(data.raw_average, 5);
  assert.ok(Math.abs(data.trust_score - (30 + 15) / 13) < 1e-9);
});

test("categories: public to read, only admins manage them, companies must use one", async () => {
  const { data: list } = await anon.from("categories").select("id").order("sort_order");
  assert.ok(list.length >= 10);
  assert.equal(list.at(-1).id, "other", "'other' is listed last");

  const denied = await alice.client.from("categories").insert({ id: `x-${run}`, label: "ניסיון" });
  assert.ok(denied.error, "users can't add categories");

  const id = `garages-${run}`;
  assert.ifError((await admin.client.from("categories").insert({ id, label: "מוסכים" })).error);
  const bad = await alice.client
    .from("companies")
    .insert({ slug: `nocat-${run}`, name: "בלי קטגוריה", category: "does-not-exist" });
  assert.equal(bad.error?.code, "23503", "unknown category is rejected");

  const c = await admin.client
    .from("companies")
    .insert({ slug: `garage-${run}`, name: "מוסך בדיקה", category: id, status: "published" })
    .select()
    .single();
  assert.ifError(c.error);
  const blocked = await admin.client.from("categories").delete().eq("id", id);
  assert.ok(blocked.error, "a category with companies can't be deleted");

  const renamed = `car-garages-${run}`;
  assert.ifError((await admin.client.from("categories").update({ id: renamed }).eq("id", id)).error);
  const { data: moved } = await anon.from("companies").select("category").eq("id", c.data.id).single();
  assert.equal(moved.category, renamed, "renaming a category id moves its companies");
});

test("banned users can't write", async () => {
  const eve = await makeUser("eve");
  await admin.client.from("profiles").update({ is_banned: true }).eq("id", eve.id);
  const c = await newCompany();
  const res = await eve.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 1, body: longBody });
  assert.match(res.error?.message ?? "", /suspended/);
  const sug = await eve.client.from("companies").insert({ slug: `ban-${run}`, name: "חסומה", category: "algo" });
  assert.match(sug.error?.message ?? "", /suspended/);
});

test("delete_my_account removes the user and their reviews", async () => {
  const frank = await makeUser("frank");
  const c = await newCompany();
  const { data: r } = await frank.client
    .from("reviews")
    .insert({ company_id: c.id, author_name: "x", rating: 3, body: longBody })
    .select()
    .single();
  assert.ifError((await frank.client.rpc("delete_my_account")).error);
  const { data } = await anon.from("reviews").select("id").eq("id", r.id);
  assert.equal(data.length, 0);
  const { data: u } = await service.auth.admin.getUserById(frank.id);
  assert.equal(u.user, null);
});

test("only admins can pick home page companies; everyone can read the picks", async () => {
  const company = await newCompany();
  const denied = await alice.client.from("featured_companies").insert({ company_id: company.id });
  assert.ok(denied.error, "a regular user must not feature a company");
  const { data, error } = await admin.client
    .from("featured_companies")
    .insert({ company_id: company.id })
    .select()
    .single();
  assert.ifError(error);
  assert.equal(data.sponsored, true, "picks are labelled sponsored by default");
  const { data: seen } = await anon.from("featured_companies").select("id").eq("id", data.id);
  assert.equal(seen.length, 1);
  const { data: audit } = await service
    .from("admin_audit")
    .select("id")
    .eq("entity", "featured_companies")
    .eq("entity_id", data.id);
  assert.equal(audit.length, 1, "the pick is in the audit log");
  const tamper = await alice.client.from("featured_companies").update({ sponsored: false }).eq("id", data.id).select();
  assert.equal(tamper.data?.length ?? 0, 0, "a regular user must not remove the label");
});
