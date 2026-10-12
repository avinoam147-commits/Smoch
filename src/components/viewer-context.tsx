"use client";

import { createContext, use, useEffect, useState } from "react";
import type { ViewerState } from "@/app/api/viewer/route";

const anonymous: ViewerState = {
  signedIn: false,
  isAdmin: false,
  isMember: false,
  votedReviewIds: [],
  myReviewId: null,
};

const Ctx = createContext<{ state: ViewerState; loaded: boolean }>({ state: anonymous, loaded: false });

export function CompanyViewerProvider({
  companyId,
  enabled,
  children,
}: {
  companyId: string;
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [value, setValue] = useState({ state: anonymous, loaded: !enabled });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch(`/api/viewer?company=${companyId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : anonymous))
      .then((state: ViewerState) => !cancelled && setValue({ state, loaded: true }))
      .catch(() => !cancelled && setValue({ state: anonymous, loaded: true }));
    return () => {
      cancelled = true;
    };
  }, [companyId, enabled]);

  return <Ctx value={value}>{children}</Ctx>;
}

export function useCompanyViewer() {
  return use(Ctx);
}
