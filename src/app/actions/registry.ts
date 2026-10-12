"use server";

import { getViewer } from "@/lib/auth";
import { lookupRegistry } from "@/lib/registry";

export async function lookupRegistryAction(id: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false as const, error: "צריך להתחבר." };
  const res = await lookupRegistry(id);
  if (!res.ok) return res;
  if (!res.record) return { ok: false as const, error: "לא נמצאה חברה עם המספר הזה ברשם החברות." };
  // The raw registry row stays on the server.
  const { number, name, nameEn, type, status, city, incorporated } = res.record;
  return { ok: true as const, record: { number, name, nameEn, type, status, city, incorporated } };
}
