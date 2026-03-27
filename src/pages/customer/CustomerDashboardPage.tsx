import { Link } from 'react-router-dom';
import { CalendarClock, ChevronRight, UserRound } from 'lucide-react';
import { DEMO_CUSTOMER } from '@/constants/demo';
import { useAppData } from '@/context/AppDataContext';
import { BookingCard } from '@/components/booking/BookingCard';
import { StatsCard } from '@/components/ui/StatsCard';

export function CustomerDashboardPage() {
  const { bookings, customerStats } = useAppData();
  const customerBookings = bookings.filter((booking) => booking.customerEmail === DEMO_CUSTOMER.email);
  const upcomingBookings = customerBookings
    .filter((booking) => booking.status === 'approved' || booking.status === 'pending')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold-600">Customer dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Track your venue requests and upcoming events</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          A quick overview of your active reservations, confirmed schedules, and account shortcuts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {customerStats.map((item) => (
          <StatsCard key={item.id} item={item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">Upcoming bookings</h2>
              <p className="mt-2 text-sm text-slate-500">
                Stay updated on scheduled venue reservations and their current status.
              </p>
            </div>
            <Link
              to="/dashboard/bookings"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
            ) : (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                No active bookings yet. Submit a new request from the booking page to populate this dashboard.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <h2 className="text-2xl font-semibold text-ink">Quick actions</h2>
            <div className="mt-5 grid gap-3">
              <Link
                to="/dashboard/bookings"
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <span className="inline-flex items-center gap-3 font-medium text-ink">
                  <CalendarClock className="h-5 w-5 text-[#0f4da0]" />
                  Manage my bookings
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
              <Link
                to="/dashboard/profile"
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <span className="inline-flex items-center gap-3 font-medium text-ink">
                  <UserRound className="h-5 w-5 text-[#0f4da0]" />
                  Update my profile
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="text-2xl font-semibold text-ink">Account snapshot</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-slate-400">Account name</p>
                <p className="mt-2 font-medium text-ink">{DEMO_CUSTOMER.name}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-slate-400">Primary email</p>
                <p className="mt-2 font-medium text-ink">{DEMO_CUSTOMER.email}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-slate-400">Primary phone</p>
                <p className="mt-2 font-medium text-ink">{DEMO_CUSTOMER.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
