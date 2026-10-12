import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ViewerState = {
  signedIn: boolean;
  isAdmin: boolean;
  isMember: boolean;
  votedReviewIds: string[];
  myReviewId: string | null;
};

const anonymous: ViewerState = {
  signedIn: false,
  isAdmin: false,
  isMember: false,
  votedReviewIds: [],
  myReviewId: null,
};

// Per-visitor state for a company page (votes, membership, own review).
// The page itself is cached and identical for everyone; this fills in the rest.
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("company") ?? "";
  const viewer = await getViewer();
  if (!viewer || !/^[0-9a-f-]{36}$/i.test(companyId)) {
    return NextResponse.json(anonymous, { headers: { "Cache-Control": "private, no-store" } });
  }

  const supabase = await createClient();
  const [members, votes, mine] = await Promise.all([
    supabase.from("company_members").select("user_id").eq("company_id", companyId).eq("user_id", viewer.id),
    supabase
      .from("review_votes")
      .select("review_id, reviews!inner(company_id)")
      .eq("user_id", viewer.id)
      .eq("reviews.company_id", companyId),
    supabase.from("reviews").select("id").eq("company_id", companyId).eq("user_id", viewer.id).maybeSingle(),
  ]);

  const state: ViewerState = {
    signedIn: true,
    isAdmin: viewer.isAdmin,
    isMember: (members.data?.length ?? 0) > 0,
    votedReviewIds: (votes.data ?? []).map((v) => v.review_id),
    myReviewId: mine.data?.id ?? null,
  };
  return NextResponse.json(state, { headers: { "Cache-Control": "private, no-store" } });
}
