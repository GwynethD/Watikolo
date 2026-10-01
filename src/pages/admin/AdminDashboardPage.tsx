import { useState } from 'react';
import { ArrowRight, Bell, CalendarDays, ClipboardList, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAppData } from '@/context/AppDataContext';
import { addDays, startOfToday, toDateKey } from '@/utils/date';
import { formatCompactDate, formatCurrency } from '@/utils/format';

export function AdminDashboardPage() {
  const { bookings, notifications, markAdminNotificationsRead } = useAppData();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const latestNotifications = notifications.slice(0, 5);
  const approvedRevenue = bookings
    .filter((booking) => booking.status === 'approved' || booking.status === 'completed')
    .reduce((sum, booking) => sum + booking.totalPrice, 0);
  const pendingBookings = bookings.filter((booking) => booking.status === 'pending');
  const todayKey = toDateKey(startOfToday());
  const nextWeekKey = toDateKey(addDays(startOfToday(), 7));
  const upcomingBookings = [...bookings]
    .filter(
      (booking) =>
        booking.date >= todayKey &&
        booking.date <= nextWeekKey &&
        booking.status !== 'cancelled' &&
        booking.status !== 'rejected',
    )
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, 2);
  const nextBookingDate = upcomingBookings[0]?.date;
  const scheduleCount = nextBookingDate
    ? bookings.filter((booking) => booking.date === nextBookingDate && booking.status !== 'cancelled' && booking.status !== 'rejected').length
    : 0;

  const summaryCards = [
    {
      label: 'Pending approvals',
      value: String(pendingBookings.length).padStart(2, '0'),
      caption: 'Needs review',
      icon: ClipboardList,
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      label: "Today's schedule",
      value: String(scheduleCount).padStart(2, '0'),
      caption: 'Live bookings today',
      icon: CalendarDays,
      tone: 'bg-cyan-50 text-cyan-700',
    },
    {
      label: 'Confirmed revenue',
      value: formatCurrency(approvedRevenue),
      caption: 'Approved + completed',
      icon: Coins,
      tone: 'bg-emerald-50 text-emerald-700',
    },
  ];

  const toggleNotifications = () => {
    setIsNotificationsOpen((open) => !open);
    markAdminNotificationsRead();
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-4 rounded-[18px] border border-white/80 bg-white px-4 py-4 shadow-card sm:px-7 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-ink sm:text-3xl">Admin dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Pending queue, today schedule, and what to do next.</p>
        </div>
        <div className="grid w-full shrink-0 gap-2 sm:grid-cols-3 md:w-auto md:flex md:items-center md:gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={toggleNotifications}
              className="relative inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/80 bg-white px-4 text-sm font-bold text-ink shadow-card transition hover:bg-slate-50 md:w-auto"
            >
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-extrabold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>

            {isNotificationsOpen ? (
              <div className="absolute right-0 top-14 z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[18px] border border-white/80 bg-white shadow-card max-sm:right-auto max-sm:left-0">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-ink">Admin notifications</p>
                  <p className="mt-1 text-xs text-slate-500">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {latestNotifications.length > 0 ? (
                    latestNotifications.map((notification) => (
                      <Link
                        key={notification.id}
                        to="/admin/bookings"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="block rounded-2xl px-3 py-3 transition hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-bold text-ink">{notification.title}</p>
                          {!notification.readAt ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-600" /> : null}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{notification.message}</p>
                        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{formatCompactDate(notification.createdAt.slice(0, 10))}</p>
                      </Link>
                    ))
                  ) : (
                    <p className="px-3 py-6 text-sm text-slate-500">No notifications yet.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <Link to="/admin/bookings" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white shadow-card transition hover:bg-[#22374e] md:min-w-[148px] md:px-5">
            Open bookings
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/admin/schedule" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:min-w-[146px] md:px-5">
            Open schedule
            <CalendarDays className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="rounded-[18px] border border-white/80 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-slate-500">{item.label}</p>
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${item.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-ink">{item.value}</p>
              <p className="mt-2 text-xs font-semibold text-slate-400">{item.caption}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[18px] border border-white/80 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Latest</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">Recent bookings</h2>
            </div>
            <Link to="/admin/bookings" className="text-sm font-bold text-[#294c5f] hover:text-ink">See all</Link>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Reference', 'Customer', 'Date', 'Status'].map((heading) => (
                    <th key={heading} className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.slice(0, 4).map((booking) => (
                  <tr key={booking.id} className="align-top">
                    <td className="px-3 py-5">
                      <p className="text-sm font-bold text-ink">{booking.reference}</p>
                      <p className="mt-1 text-xs text-slate-400">{booking.venueName}</p>
                    </td>
                    <td className="px-3 py-5">
                      <p className="text-sm font-semibold text-slate-700">{booking.customerName}</p>
                      <p className="mt-1 text-xs text-slate-400">{booking.customerPhone ?? booking.customerEmail}</p>
                    </td>
                    <td className="px-3 py-5">
                      <p className="text-sm font-semibold text-slate-700">{formatCompactDate(booking.date)}</p>
                      <p className="mt-1 max-w-[9rem] text-xs leading-5 text-slate-400">{booking.timeSlotLabel}</p>
                    </td>
                    <td className="px-3 py-5">
                      <StatusBadge status={booking.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[18px] border border-white/80 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">Upcoming</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">Next 7 days</h2>
            </div>
            <Link to="/admin/schedule" className="text-sm font-bold text-[#294c5f] hover:text-ink">Open calendar</Link>
          </div>

          <div className="mt-5 space-y-3">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="rounded-[14px] bg-slate-50 px-5 py-4 shadow-[0_8px_18px_rgba(19,33,45,0.04)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ink">{booking.customerName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatCompactDate(booking.date)} - {booking.timeSlotLabel}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              </div>
            ))}
            {upcomingBookings.length === 0 ? (
              <div className="rounded-[14px] bg-slate-50 px-5 py-4 text-sm text-slate-500">No upcoming bookings yet.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
