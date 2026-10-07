import Link from "next/link";
import { formatDate, type Company, type Review } from "@/lib/data";
import { Stars } from "./stars";
import { VerifiedPurchase } from "./badges";
import { ReviewActions } from "./review-actions";

export function ReviewCard({
  review,
  company,
  showCompany = false,
}: {
  review: Review;
  company: Company;
  showCompany?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          aria-hidden
          className="grid size-9 place-items-center rounded-full bg-surface-2 text-sm font-semibold text-muted"
        >
          {review.author.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="font-medium">{review.author}</p>
          <p className="text-xs text-muted">{formatDate(review.date)}</p>
        </div>
        {review.verifiedPurchase && (
          <span className="ms-auto">
            <VerifiedPurchase />
          </span>
        )}
      </header>

      <div className="mt-4 flex items-center gap-3">
        <Stars value={review.rating} size="sm" />
        {showCompany && (
          <Link href={`/company/${company.slug}`} className="truncate text-sm font-medium text-accent hover:underline">
            {company.name}
          </Link>
        )}
      </div>
      <h3 className="mt-2 font-semibold text-pretty">{review.title}</h3>
      <p className="mt-1.5 leading-relaxed text-ink/85 text-pretty">{review.body}</p>
      {review.paid && (
        <p className="mt-3 text-xs text-muted">שילם/ה: ₪{review.paid.toLocaleString("he-IL")}</p>
      )}

      {review.reply && (
        <div className="mt-4 rounded-xl border-s-4 border-accent bg-surface-2 p-4">
          <p className="text-sm font-semibold">
            תגובת {company.name} <span className="font-normal text-muted">· {formatDate(review.reply.date)}</span>
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink/85">{review.reply.body}</p>
        </div>
      )}

      {!showCompany && <ReviewActions helpful={review.helpful} />}
    </article>
  );
}
