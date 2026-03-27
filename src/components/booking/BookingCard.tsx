import type { Booking } from '@/types';
import { CalendarDays, CircleDollarSign, Users } from 'lucide-react';
import { formatCompactDate, formatCurrency } from '@/utils/format';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gold-600">{booking.reference}</p>
          <h3 className="mt-2 text-xl font-semibold text-ink">{booking.venueName}</h3>
          <p className="mt-1 text-sm text-slate-500">{booking.eventType}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {formatCompactDate(booking.date)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Users className="h-4 w-4" />
          {booking.guests} guests
        </span>
        <span className="inline-flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4" />
          {formatCurrency(booking.totalPrice)}
        </span>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">{booking.timeSlotLabel}</div>
    </div>
  );
}
