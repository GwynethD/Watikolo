import { ArrowRight, CircleCheckBig, FileClock, MailCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Booking } from '@/types';
import { formatCurrency } from '@/utils/format';

interface SuccessState {
  booking?: Booking;
  total?: number;
}

export function BookingSuccessPage() {
  const location = useLocation();
  const state = (location.state as SuccessState | null) ?? {};
  const booking = state.booking;

  return (
    <div className="container-shell section-space">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-soft sm:p-10">
        <div className="flex justify-center">
          <div className="rounded-full bg-emerald-50 p-4 text-emerald-600">
            <CircleCheckBig className="h-10 w-10" />
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold-600">Booking submitted</p>
          <h1 className="mt-3 text-4xl font-semibold text-ink">Your venue request is now saved in the system</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            The request is stored locally and ready for admin approval, schedule review, and customer tracking across the dashboard.
          </p>
        </div>

        <div className="mt-10 rounded-[2rem] bg-slate-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Reference number</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{booking?.reference ?? 'WTK-2026-0000'}</p>
            </div>
            <StatusBadge status={booking?.status ?? 'pending'} />
          </div>
          <div className="mt-6 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4"><p className="text-slate-400">Venue</p><p className="mt-2 font-medium text-ink">{booking?.venueName ?? 'The Grand Atrium'}</p></div>
            <div className="rounded-2xl bg-white p-4"><p className="text-slate-400">Date & time</p><p className="mt-2 font-medium text-ink">{booking?.date ?? '2026-04-18'} • {booking?.timeSlotLabel ?? '8:00 AM - 12:00 PM'}</p></div>
            <div className="rounded-2xl bg-white p-4"><p className="text-slate-400">Estimated total</p><p className="mt-2 font-medium text-ink">{formatCurrency(state.total ?? booking?.totalPrice ?? 91000)}</p></div>
            <div className="rounded-2xl bg-white p-4"><p className="text-slate-400">Current status</p><p className="mt-2 font-medium text-ink">Awaiting admin review</p></div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="panel p-5"><FileClock className="h-6 w-6 text-gold-500" /><h3 className="mt-4 font-semibold text-ink">Review phase</h3><p className="mt-2 text-sm text-slate-500">Admins can approve, reject, or cancel requests and the changes will persist across the app.</p></div>
          <div className="panel p-5"><MailCheck className="h-6 w-6 text-gold-500" /><h3 className="mt-4 font-semibold text-ink">Client updates</h3><p className="mt-2 text-sm text-slate-500">The customer dashboard now reflects saved requests immediately after submission.</p></div>
          <div className="panel p-5"><CircleCheckBig className="h-6 w-6 text-gold-500" /><h3 className="mt-4 font-semibold text-ink">Next steps</h3><p className="mt-2 text-sm text-slate-500">Continue to the dashboard to view upcoming bookings and live status updates.</p></div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800">
            Go to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/venues" className="inline-flex items-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Browse more venues
          </Link>
        </div>
      </div>
    </div>
  );
}


