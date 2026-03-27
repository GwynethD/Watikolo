import { Star } from 'lucide-react';
import { PublicBannerImage } from '@/components/common/PublicBannerImage';
import { SectionHeader } from '@/components/common/SectionHeader';
import { testimonials } from '@/mock/venues';

const reviewStats = [
  { label: 'Guest confidence', value: 'High' },
  { label: 'Experience rating', value: '4.9/5' },
  { label: 'Booking clarity', value: 'Easy to follow' },
] as const;

export function GuestReviewsPage() {
  const bannerImage = new URL('../../pictures/villa.png', import.meta.url).href;

  return (
    <div className="bg-[#fbfaf6] font-body">
      <PublicBannerImage image={bannerImage} alt="Watikolo guest reviews banner" />

      <section className="container-shell py-16 sm:py-20">
        <SectionHeader
          title="GUEST REVIEWS"
          description="These review cards help the public side feel more trustworthy and realistic while supporting your thesis presentation."
          compact
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {reviewStats.map((item) => (
            <div key={item.label} className="rounded-[1.75rem] border border-[#ece2d0] bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
              <h2 className="mt-3 text-2xl font-semibold text-[#202321]">{item.value}</h2>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.id} className="rounded-[2rem] border border-[#ece2d0] bg-white p-6 shadow-card">
              <div className="flex gap-1 text-gold-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">&quot;{testimonial.quote}&quot;</p>
              <div className="mt-6 border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-[#202321]">{testimonial.name}</h3>
                <p className="text-sm text-slate-500">{testimonial.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

