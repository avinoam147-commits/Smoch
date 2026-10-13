import Link from "next/link";
import { formatDate, formatShekel } from "@/lib/format";
import type { Review } from "@/lib/types";
import { Stars } from "./stars";
import { StaffBadge, VerifiedPurchase } from "./badges";
import { ReviewActions } from "./review-actions";

export function ReviewCard({
  review,
  company,
  showCompany = false,
}: {
  review: Review;
  company: { slug: string; name: string };
  showCompany?: boolean;
}) {
  return (
    <article id={`review-${review.id}`} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          aria-hidden
          className="grid size-9 place-items-center rounded-full bg-surface-2 text-sm font-semibold text-muted"
        >
          {review.authorName.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="font-medium">{review.authorName}</p>
          <p className="text-xs text-muted">
            {formatDate(review.createdAt)}
            {review.editedAt && " · נערכה"}
          </p>
        </div>
        <span className="ms-auto flex flex-wrap gap-1.5">
          {review.verifiedPurchase && <VerifiedPurchase />}
          {review.source === "staff" && <StaffBadge />}
        </span>
      </header>

      <div className="mt-4 flex items-center gap-3">
        <Stars value={review.rating} size="sm" />
        {showCompany && (
          <Link href={`/company/${company.slug}`} className="truncate text-sm font-medium text-accent hover:underline">
            {company.name}
          </Link>
        )}
      </div>
      <p className="mt-3 whitespace-pre-line leading-relaxed text-pretty text-ink/85">{review.body}</p>
      {(review.amountPaid != null || review.experienceDate || !review.paid) && (
        <p className="mt-3 text-xs text-muted">
          {!review.paid && "לא רכש/ה מהחברה"}
          {review.amountPaid != null && `שילם/ה ${formatShekel(review.amountPaid)}`}
          {review.experienceDate &&
            ` · חוויה מ${new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(new Date(review.experienceDate))}`}
        </p>
      )}

      {review.reply && (
        <div className="mt-4 rounded-xl border-s-4 border-accent bg-surface-2 p-4">
          <p className="text-sm font-semibold">
            תגובת {company.name} <span className="font-normal text-muted">· {formatDate(review.reply.createdAt)}</span>
          </p>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink/85">{review.reply.body}</p>
        </div>
      )}

      {!showCompany && (
        <ReviewActions
          reviewId={review.id}
          helpfulCount={review.helpfulCount}
          companySlug={company.slug}
          existingReply={review.reply?.body ?? null}
        />
      )}
    </article>
  );
}
