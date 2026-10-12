"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/browser";
import { CompanyMark } from "@/components/company-card";
import { setCompanyLogo } from "../actions";

export function LogoUploader({
  companyId,
  name,
  logoUrl,
}: {
  companyId: string;
  name: string;
  logoUrl: string | null;
}) {
  const [url, setUrl] = useState(logoUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function upload(file: File) {
    setError(null);
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type))
      return setError("PNG, JPG, WebP או SVG בלבד.");
    if (file.size > 1024 * 1024) return setError("עד 1MB.");
    start(async () => {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${companyId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("logos")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) return setError("ההעלאה נכשלה.");
      const publicUrl = supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
      const res = await setCompanyLogo(companyId, publicUrl);
      if (res.ok) setUrl(publicUrl);
      else setError(res.message ?? "השמירה נכשלה.");
    });
  }

  return (
    <div className="flex items-center gap-4">
      <CompanyMark name={name} logoUrl={url} size="lg" />
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <label className="pressable cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-ink/30">
            {pending ? "מעלים…" : url ? "החלפת לוגו" : "העלאת לוגו"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </label>
          {url && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await setCompanyLogo(companyId, null);
                  if (res.ok) setUrl(null);
                })
              }
              className="pressable rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-2"
            >
              הסרה
            </button>
          )}
        </div>
        <p className="text-xs text-muted">ריבועי, עד 1MB. מומלץ להשתמש בלוגו רק באישור החברה.</p>
        {error && <p className="text-xs text-bad">{error}</p>}
      </div>
    </div>
  );
}
