import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../_components/ui";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "הגדרות" };

export default async function AdminSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("key, value");
  const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return (
    <>
      <PageHeader title="הגדרות" description="כללים שהמסד אוכף על כל ביקורת וחברה חדשה." />
      <SettingsForm
        initial={{
          requirePhone: s.require_phone_for_reviews === true,
          autoPublish: s.auto_publish_reviews !== false,
          reviewsPerDay: Number(s.reviews_per_day ?? 3),
          companiesPerDay: Number(s.companies_per_day ?? 5),
        }}
      />
    </>
  );
}
