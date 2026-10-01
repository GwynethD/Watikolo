import { Star } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { PublicBannerImage } from '@/components/common/PublicBannerImage';
import { useAppData } from '@/context/AppDataContext';

const sources = ['All Reviews 5.0', 'Google 5.0', 'Facebook 5.0', 'Tripadvisor 5.0', 'Watikolo 5.0'] as const;

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export function GuestReviewsPage() {
  const { reviews, createReview } = useAppData();
  const bannerImage = new URL('../../pictures/villa.png', import.meta.url).href;
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewQuote, setReviewQuote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const approvedReviews = reviews.filter((review) => review.status === 'approved');

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = reviewName.trim();
    const trimmedQuote = reviewQuote.trim();
    if (!trimmedName || !trimmedQuote) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createReview({
        name: trimmedName,
        rating: Number(reviewRating),
        quote: trimmedQuote,
      });
      setReviewName('');
      setReviewRating('5');
      setReviewQuote('');
      setIsReviewOpen(false);
      setSubmitMessage('Thank you. Your review was submitted and is waiting for admin approval.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white font-body">
      <PublicBannerImage image={bannerImage} alt="Watikolo guest reviews banner" />

      <section className="mx-auto max-w-[1180px] px-4 py-9">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold uppercase text-[#222]">Guest Reviews</h1>
            <p className="mt-10 text-[13px] text-slate-500">
              Real feedback from guests who stayed or celebrated at Watikolo.
            </p>
          </div>

          <a
            href="/venues"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#0f4da0] px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b3f82]"
          >
            Book now
          </a>
        </div>

        {submitMessage ? (
          <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            {submitMessage}
          </div>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-card">
          <div className="flex flex-wrap gap-5 border-b border-slate-100 px-6 py-5">
            {sources.map((source, index) => (
              <button
                key={source}
                className={
                  index === 0
                    ? 'rounded-full bg-[#0f4da0] px-5 py-2 text-[12px] font-semibold text-white'
                    : 'px-2 py-2 text-[12px] font-semibold text-slate-500 hover:text-[#0f4da0]'
                }
              >
                {source}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Overall Rating</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-3xl font-semibold text-[#222]">5.0</span>
                <span className="inline-flex gap-1 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </span>
                <span className="text-[13px] text-slate-400">({approvedReviews.length} reviews)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsReviewOpen(true)}
              className="rounded bg-white px-5 py-3 text-[13px] font-semibold text-[#222] shadow-card transition hover:bg-slate-50"
            >
              Write a Review
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {approvedReviews.slice(0, 6).map((review) => (
            <article key={review.id} className="rounded-xl border border-slate-100 bg-white p-6 shadow-card">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5b3fc3] text-sm font-semibold text-white">
                  {review.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#222]">{review.name}</h2>
                  <p className="text-xs text-slate-400">{formatReviewDate(review.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4 text-[13px] font-semibold text-yellow-500">5/5</div>
              <p className="mt-3 text-[13px] leading-6 text-slate-600">{review.quote}</p>
              <button className="mt-3 text-[13px] text-slate-300 hover:text-slate-500">Read more</button>
              <p className="mt-5 text-xs text-slate-400">Posted on {review.provider[0].toUpperCase() + review.provider.slice(1)}</p>
            </article>
          ))}
        </div>
      </section>

      {isReviewOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#222]">Write a Review</h2>
                <p className="mt-2 text-[13px] text-slate-500">Share your Watikolo experience.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="rounded px-3 py-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                x
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleReviewSubmit}>
              <label className="block text-sm font-semibold text-slate-700">
                Name
                <input
                  value={reviewName}
                  onChange={(event) => setReviewName(event.target.value)}
                  className="mt-2 w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0f4da0]"
                  placeholder="Your name"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Rating
                <select
                  value={reviewRating}
                  onChange={(event) => setReviewRating(event.target.value)}
                  className="mt-2 w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0f4da0]"
                >
                  <option value="5">5/5</option>
                  <option value="4">4/5</option>
                  <option value="3">3/5</option>
                  <option value="2">2/5</option>
                  <option value="1">1/5</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Review
                <textarea
                  value={reviewQuote}
                  onChange={(event) => setReviewQuote(event.target.value)}
                  className="mt-2 min-h-32 w-full rounded border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0f4da0]"
                  placeholder="Write your feedback here"
                  required
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="rounded px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded bg-[#0f4da0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3f82] disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
