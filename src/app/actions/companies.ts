"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { slugFromWebsite, slugify } from "@/lib/slug";

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^(https?:\/\/)?[\w.-]+\.[a-zא-ת]{2,}(\/\S*)?$/i.test(v), "כתובת לא תקינה")
  .transform((v) => (v && !v.includes("://") ? `https://${v}` : v) || null);

const suggestSchema = z.object({
  name: z.string().trim().min(2, "כתבו את שם החברה").max(120),
  category: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "בחרו קטגוריה"),
  website: optionalUrl,
  registryId: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || v.replace(/\D/g, "").length >= 8, "מספר ח.פ. / ע.מ. צריך להכיל 8-9 ספרות")
    .transform((v) => v || null),
  socialUrl: optionalUrl,
  note: z.string().trim().max(500).optional(),
});

export type SuggestResult =
  { ok: true; name: string } | { ok: false; message?: string; fieldErrors?: Record<string, string> };

export async function suggestCompany(_: unknown, formData: FormData): Promise<SuggestResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר כדי להוסיף חברה." };

  const parsed = suggestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, fieldErrors };
  }
  const v = parsed.data;
  const supabase = await createClient();

  // A unique slug; admins can change it when approving.
  const base = slugFromWebsite(v.website) || slugify(v.name) || "company";
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const { error } = await supabase.from("companies").insert({
    slug,
    name: v.name,
    category: v.category,
    website: v.website,
    social_url: v.socialUrl,
    registry_id: v.registryId,
    about: v.note ?? "",
  });
  if (error) return { ok: false, message: friendlyError(error) };
  return { ok: true, name: v.name };
}

const claimSchema = z.object({
  companyId: z.string().uuid(),
  fullName: z.string().trim().min(2, "כתבו שם מלא").max(80),
  jobTitle: z.string().trim().min(2, "כתבו תפקיד").max(80),
  workEmail: z.string().trim().email("כתובת מייל לא תקינה").max(120),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(1000).optional(),
});

export type ClaimResult = { ok: true } | { ok: false; message?: string; fieldErrors?: Record<string, string> };

export async function claimCompany(_: unknown, formData: FormData): Promise<ClaimResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "צריך להתחבר." };
  const parsed = claimSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, fieldErrors };
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("company_claims").insert({
    company_id: v.companyId,
    full_name: v.fullName,
    job_title: v.jobTitle,
    work_email: v.workEmail,
    phone: v.phone || null,
    message: v.message || null,
  });
  if (error) return { ok: false, message: friendlyError(error) };
  return { ok: true };
}
