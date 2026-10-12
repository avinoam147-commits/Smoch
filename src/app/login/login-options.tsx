"use client";

import { useSearchParams } from "next/navigation";
import { GoogleButton } from "@/components/google-button";
import { safeNext } from "@/lib/safe-next";

export function LoginOptions() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  return (
    <>
      {params.get("error") && (
        <p role="alert" className="appear mb-4 rounded-xl bg-surface-2 px-4 py-3 text-sm text-bad">
          ההתחברות לא הושלמה. נסו שוב.
        </p>
      )}
      <GoogleButton next={next} />
    </>
  );
}
