import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import type { Viewer } from "./types";

/** The signed-in user, or null. Reads cookies, so call it inside <Suspense>. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, role, is_banned, notify_email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? "משתמש/ת",
    avatarUrl: profile?.avatar_url ?? null,
    isAdmin: profile?.role === "admin",
    isBanned: profile?.is_banned ?? false,
    phone: user.phone || null,
    phoneVerified: Boolean(user.phone_confirmed_at),
    notifyEmail: profile?.notify_email ?? true,
  };
});

export async function requireViewer(next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

/** Admin pages 404 for everyone else, so the panel's existence isn't advertised. */
export async function requireAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) notFound();
  return viewer;
}
