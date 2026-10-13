import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReviewEditor } from "../review-editor";
import { PageHeader } from "../../_components/ui";

export const metadata = { title: "ביקורת חדשה" };

export default async function NewReviewPage({ searchParams }: PageProps<"/admin/reviews/new">) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: companies } = await supabase.from("companies").select("id, name").order("name");
  const companyId = typeof sp.company === "string" ? sp.company : "";

  return (
    <>
      <Link href="/admin/reviews" className="text-sm text-muted hover:text-ink">
        → כל הביקורות
      </Link>
      <div className="mt-2">
        <PageHeader title="ביקורת חדשה" />
      </div>
      <ReviewEditor
        companies={companies ?? []}
        isUserReview={false}
        initial={{
          companyId,
          authorName: "",
          rating: 0,
          body: "",
          paid: true,
          amountPaid: "",
          experienceDate: "",
          verifiedPurchase: false,
          status: "published",
          moderationNote: "",
        }}
      />
    </>
  );
}
