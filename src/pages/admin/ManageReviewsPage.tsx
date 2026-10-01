import { useMemo, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAppData } from '@/context/AppDataContext';
import type { ReviewStatus } from '@/types';

function StarRow({ rating }: { rating: number }) {
  const filledStars = Math.round(rating);

  return (
    <div className="flex gap-1 text-[#f5b300]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={`h-4 w-4 ${index < filledStars ? 'fill-current' : 'fill-none opacity-30'}`} />
      ))}
    </div>
  );
}

export function ManageReviewsPage() {
  const { reviews, updateReviewStatus, deleteReview } = useAppData();
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus | 'all'>('pending');

  const statusOptions = ['all', 'pending', 'approved', 'rejected'] as const;
  const statusLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

  const filteredReviews = useMemo(
    () => reviews.filter((review) => selectedStatus === 'all' || review.status === selectedStatus),
    [reviews, selectedStatus],
  );

  const counts = useMemo(() => ({
    all: reviews.length,
    pending: reviews.filter((review) => review.status === 'pending').length,
    approved: reviews.filter((review) => review.status === 'approved').length,
    rejected: reviews.filter((review) => review.status === 'rejected').length,
  }), [reviews]);

  const handleUpdate = async (reviewId: string, status: ReviewStatus) => {
    await updateReviewStatus(reviewId, status);
  };

  const handleDelete = async (reviewId: string) => {
    const shouldDelete = window.confirm('Delete this review? This cannot be undone.');
    if (!shouldDelete) {
      return;
    }

    await deleteReview(reviewId);
  };

  return (
    <div className="space-y-6">
      <div className="panel p-6 sm:p-7">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Manage reviews</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">Approve guest reviews before they show on the public site.</p>

          <div className="mt-5 inline-flex max-w-full rounded-[999px] bg-transparent p-1.5 shadow-none">
            <div className="flex flex-nowrap gap-2 overflow-x-auto px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {statusOptions.map((status) => {
                const active = selectedStatus === status;
                const count =
                  status === 'all'
                    ? counts.all
                    : status === 'pending'
                      ? counts.pending
                      : status === 'approved'
                        ? counts.approved
                        : counts.rejected;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`whitespace-nowrap rounded-[999px] px-6 py-2.5 text-[13px] font-semibold transition ${
                      active
                        ? 'bg-ink text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)]'
                        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {statusLabel(status)} <span className={active ? 'text-white/80' : 'text-slate-400'}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="panel p-8 text-center">
          <h2 className="text-2xl font-semibold text-ink">No reviews</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Nothing to review right now.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredReviews.map((review) => (
            <article key={review.id} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-ink">{review.name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <StarRow rating={review.rating} />
                    <span className="text-xs text-slate-500">{review.rating}/5</span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    review.status === 'pending'
                      ? 'bg-amber-50 text-amber-700'
                      : review.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {review.status}
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">{review.quote}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {review.status === 'pending' ? (
                  <>
                  <Button variant="secondary" className="px-4 py-2" onClick={() => void handleUpdate(review.id, 'approved')}>
                    Approve
                  </Button>
                  <Button variant="danger" className="px-4 py-2" onClick={() => void handleUpdate(review.id, 'rejected')}>
                    Reject
                  </Button>
                  </>
                ) : null}
                <Button variant="ghost" className="gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50" onClick={() => void handleDelete(review.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
