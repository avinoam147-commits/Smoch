"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfile(_: unknown, formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר." };
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (displayName.length < 2 || displayName.length > 40) {
    return { ok: false, message: "השם צריך להכיל בין 2 ל-40 תווים." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, notify_email: formData.get("notifyEmail") === "on" })
    .eq("id", viewer.id);
  if (error) return { ok: false, message: friendlyError(error) };
  return { ok: true, message: "נשמר." };
}

/** Israeli mobile -> E.164 (+9725XXXXXXXX), or null. */
function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (/^05\d{8}$/.test(digits)) return `+972${digits.slice(1)}`;
  if (/^9725\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

export async function sendPhoneCode(phoneInput: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר." };
  const phone = normalizePhone(phoneInput);
  if (!phone) return { ok: false, message: "מספר נייד ישראלי בלבד, למשל 050-1234567." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ phone });
  if (error) {
    if (error.message.toLowerCase().includes("already")) return { ok: false, message: "המספר כבר משויך לחשבון אחר." };
    return { ok: false, message: "לא הצלחנו לשלוח קוד. נסו שוב בעוד דקה." };
  }
  return { ok: true, phone };
}

export async function confirmPhoneCode(phone: string, token: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ phone, token: token.trim(), type: "phone_change" });
  if (error) return { ok: false, message: "הקוד שגוי או שפג תוקפו." };
  return { ok: true };
}

export async function deleteAccount(confirmation: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר." };
  if (confirmation.trim() !== "מחיקה") return { ok: false, message: "כדי לאשר, הקלידו את המילה מחיקה." };
  const supabase = await createClient();

  // Storage files aren't deleted by the cascade; remove the user's receipts first.
  const { data: receipts } = await supabase.from("receipts").select("storage_path").eq("user_id", viewer.id);
  const paths = (receipts ?? []).map((r) => r.storage_path).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from("receipts").remove(paths);

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, message: friendlyError(error) };
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
