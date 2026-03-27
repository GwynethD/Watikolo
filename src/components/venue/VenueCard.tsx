import type { Venue } from '@/types';
import { MapPin, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/format';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface VenueCardProps {
  venue: Venue;
}

export function VenueCard({ venue }: VenueCardProps) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#ece2d0] bg-[#fffdfa] shadow-card transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative">
        <img src={venue.heroImage} alt={venue.name} className="h-64 w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent_0%,rgba(32,35,33,0.66)_100%)] p-5 text-white">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#e9d9a7]">{venue.type}</p>
          <h3 className="mt-2 font-display text-4xl font-semibold leading-none">{venue.name}</h3>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="max-w-lg text-sm leading-7 text-slate-600">{venue.shortDescription}</p>
          <StatusBadge status={venue.availability} />
        </div>

        <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#f8f3ea] px-4 py-3">
            <MapPin className="h-4 w-4 text-[#5fa7c9]" />
            {venue.location}
          </span>
          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#f8f3ea] px-4 py-3">
            <Users className="h-4 w-4 text-[#5fa7c9]" />
            {venue.capacity} guests
          </span>
          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#f8f3ea] px-4 py-3">
            <Star className="h-4 w-4 fill-current text-gold-500" />
            {venue.rating}
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Starting price</p>
            <p className="mt-2 text-2xl font-semibold text-[#202321]">{formatCurrency(venue.price)}</p>
          </div>
          <Link
            to={`/venues/${venue.id}`}
            className="inline-flex items-center rounded-full bg-[#2d2b2a] px-5 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#1f1d1c]"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

