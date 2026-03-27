import { ArrowRight, CalendarClock, CircleDollarSign, ClipboardList, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatsCard } from '@/components/ui/StatsCard';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAppData } from '@/context/AppDataContext';
import { formatCompactDate, formatCurrency, formatDate } from '@/utils/format';

export function AdminDashboardPage() {
  const { adminStats, bookings, venues } = useAppData();
  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const approvedRevenue = bookings
    .filter((booking) => booking.status === 'approved' || booking.status === 'completed')
    .reduce((sum, booking) => sum + booking.totalPrice, 0);
  const pendingBookings = bookings.filter((booking) => booking.status === 'pending');
  const upcomingBookings = [...bookings]
    .filter((booking) => booking.status !== 'cancelled' && booking.status !== 'rejected')
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, 4);
  const occupancyCards = venues.slice(0, 4).map((venue) => {
    const activeCount = bookings.filter(
      (booking) => booking.venueId === venue.id && booking.status !== 'cancelled' && booking.status !== 'rejected',
    ).length;

    return {
      ...venue,
      occupancy: Math.min(100, 35 + activeCount * 18),
      nextEvent: upcomingBookings.find((booking) => booking.venueId === venue.id),
    };
  });

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(120deg,#081624_0%,#0f2943_35%,#1a5eb0_100%)] p-6 text-white shadow-soft sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-200">Admin dashboard</p>
            <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">Resort booking command center</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Keep reservations, approvals, venue readiness, and revenue moving from one screen. This view is driven by the same saved data used by the public booking flow.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { icon: ClipboardList, label: 'Pending approvals', value: `${pendingBookings.length} requests`, detail: 'Needs same-day review' },
                { icon: CalendarClock, label: 'Next arrival', value: formatCompactDate(upcomingBookings[0]?.date ?? bookings[0]?.date ?? '2026-04-18'), detail: upcomingBookings[0]?.venueName ?? 'No arrivals yet' },
                { icon: CircleDollarSign, label: 'Approved revenue', value: formatCurrency(approvedRevenue), detail: 'Confirmed and completed stays' },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <item.icon className="h-5 w-5 text-gold-200" />
                  <p className="mt-4 text-sm text-slate-200">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-300">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-200">Today's priorities</p>
                <h2 className="mt-2 text-2xl font-semibold">Ops snapshot</h2>
              </div>
              <TrendingUp className="h-6 w-6 text-gold-200" />
            </div>
            <div className="mt-6 space-y-3">
              {[
                { title: 'Review pending stays', text: `${pendingBookings.length} requests are waiting for approval or client follow-up.` },
                { title: 'Prepare venue turnover', text: `${occupancyCards[0]?.name ?? 'The Grand Atrium'} has the highest occupancy for the next cycle.` },
                { title: 'Watch projected revenue', text: `${formatCurrency(totalRevenue)} is currently booked across all visible reservations.` },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl bg-slate-950/30 px-4 py-4">
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link to="/admin/bookings" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-100">
                Manage bookings
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/admin/schedule" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                View schedule
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((item) => (
          <StatsCard key={item.id} item={item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600">Booking pipeline</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Recent bookings</h2>
            </div>
            <Link to="/admin/bookings" className="text-sm font-semibold text-brand-700 hover:text-brand-800">Open full queue</Link>
          </div>
          <div className="mt-6">
            <DataTable
              data={bookings.slice(0, 4)}
              columns={[
                { key: 'reference', label: 'Reference', render: (row) => <div><p className="font-semibold text-ink">{row.reference}</p><p className="text-xs text-slate-500">{row.venueName}</p></div> },
                { key: 'client', label: 'Client', render: (row) => <div><p>{row.customerName}</p><p className="text-xs text-slate-500">{row.customerEmail}</p></div> },
                { key: 'date', label: 'Schedule', render: (row) => <div><p>{formatCompactDate(row.date)}</p><p className="text-xs text-slate-500">{row.timeSlotLabel}</p><p className="text-xs text-slate-400">{row.eventType}</p></div> },
                { key: 'amount', label: 'Amount', render: (row) => <span className="font-semibold text-ink">{formatCurrency(row.totalPrice)}</span> },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              ]}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <h2 className="text-2xl font-semibold text-ink">Venue occupancy</h2>
            <div className="mt-6 space-y-4">
              {occupancyCards.map((venue) => (
                <div key={venue.id}>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{venue.name}</span>
                    <span>{venue.occupancy}%</span>
                  </div>
                  <div className="mt-2 rounded-full bg-slate-100 p-1">
                    <div className="h-3 rounded-full bg-brand-600" style={{ width: `${venue.occupancy}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Next event: {venue.nextEvent ? `${venue.nextEvent.customerName} on ${formatCompactDate(venue.nextEvent.date)}` : 'No event assigned yet'}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="panel p-6">
            <h2 className="text-2xl font-semibold text-ink">Booking status overview</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              {[
                { label: 'Approved bookings', value: String(bookings.filter((booking) => booking.status === 'approved').length).padStart(2, '0'), color: 'bg-sky-500' },
                { label: 'Pending approvals', value: String(bookings.filter((booking) => booking.status === 'pending').length).padStart(2, '0'), color: 'bg-amber-500' },
                { label: 'Completed events', value: String(bookings.filter((booking) => booking.status === 'completed').length).padStart(2, '0'), color: 'bg-emerald-500' },
                { label: 'Cancelled requests', value: String(bookings.filter((booking) => booking.status === 'cancelled').length).padStart(2, '0'), color: 'bg-slate-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className="font-semibold text-ink">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-ink p-5 text-white">
              <p className="text-sm text-slate-300">Projected monthly revenue</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalRevenue)}</p>
              <p className="mt-2 text-sm text-slate-300">Based on all currently saved reservations in the local demo backend.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600">Arrival timeline</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Upcoming stays and events</h2>
          <div className="mt-6 space-y-4">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{booking.customerName}</p>
                    <p className="mt-1 text-sm text-slate-500">{booking.venueName}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Date</p>
                    <p className="mt-1 font-medium text-ink">{formatDate(booking.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Guests</p>
                    <p className="mt-1 font-medium text-ink">{booking.guests} guests</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600">Quick actions</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Admin booking system modules</h2>
            </div>
            <Link to="/admin/reports" className="text-sm font-semibold text-brand-700 hover:text-brand-800">Open analytics</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Booking approvals',
                text: 'Review new inquiries, inspect notes, and confirm or reject requests from the booking queue.',
                link: '/admin/bookings',
              },
              {
                title: 'Venue inventory',
                text: 'Manage resort spaces, pricing, capacity, visibility, and property details for each sellable unit.',
                link: '/admin/venues',
              },
              {
                title: 'Schedule board',
                text: 'Watch venue-by-date occupancy, reserved slots, and booking conflicts across the full calendar.',
                link: '/admin/schedule',
              },
              {
                title: 'Revenue reports',
                text: 'Track demand, monthly trend signals, and projected income from approved and completed stays.',
                link: '/admin/reports',
              },
            ].map((module) => (
              <Link key={module.title} to={module.link} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card">
                <h3 className="text-lg font-semibold text-ink">{module.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{module.text}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                  Open module
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
