import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppData } from '@/context/AppDataContext';
import type { BookingStatus } from '@/types';
import { cn } from '@/utils/cn';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingBlankDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingBlankDays + lastDay.getDate()) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - leadingBlankDays + 1;

    if (dayNumber < 1 || dayNumber > lastDay.getDate()) {
      return null;
    }

    const date = new Date(year, month, dayNumber);

    return {
      date,
      dayNumber,
      dateKey: toDateKey(date),
    };
  });
}

function bookingStatusLabel(status: BookingStatus) {
  if (status === 'pending') {
    return 'Reserved';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function bookingStatusClasses(status: BookingStatus) {
  const styles: Record<BookingStatus, string> = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-slate-100 text-slate-500',
    rejected: 'bg-rose-50 text-rose-700',
  };

  return styles[status];
}

export function ScheduleManagementPage() {
  const { bookings } = useAppData();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const calendarDays = useMemo(() => getCalendarDays(monthDate), [monthDate]);
  const todayKey = toDateKey(new Date());

  const monthBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const bookingDate = new Date(`${booking.date}T00:00:00`);

        return (
          bookingDate.getFullYear() === monthDate.getFullYear() &&
          bookingDate.getMonth() === monthDate.getMonth() &&
          booking.status !== 'cancelled' &&
          booking.status !== 'rejected'
        );
      }),
    [bookings, monthDate],
  );
  const reservedCount = monthBookings.filter((booking) => booking.status === 'pending').length;
  const bookedCount = monthBookings.filter((booking) => booking.status === 'approved' || booking.status === 'completed').length;
  const selectedDateBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.date === selectedDateKey &&
          booking.status !== 'cancelled' &&
          booking.status !== 'rejected',
      ).sort((first, second) => first.timeSlotLabel.localeCompare(second.timeSlotLabel) || first.venueName.localeCompare(second.venueName)),
    [bookings, selectedDateKey],
  );

  const moveMonth = (months: number) => {
    setMonthDate((current) => addMonths(current, months));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-white/80 bg-white px-4 py-4 shadow-card sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-slate-400">Calendar</p>
            <h1 className="mt-1 text-xl font-bold text-ink sm:text-2xl">Schedule management</h1>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              View available, reserved, and booked slots in a monthly calendar.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[320px]">
            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Available slots</div>
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">{reservedCount} reserved</div>
            <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{bookedCount} booked</div>
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-white/80 bg-white px-4 py-3 shadow-card sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink sm:text-xl">{formatMonthLabel(monthDate)}</h2>
            <p className="mt-1 text-sm text-slate-500">All venues and time slots</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => moveMonth(-1)} className="grid h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setMonthDate(new Date())} className="h-9 rounded-full px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-ink">
              Today
            </button>
            <button type="button" onClick={() => moveMonth(1)} className="grid h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-2 text-xs font-semibold text-slate-500">
          <span>Click a date to view booking details.</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-card">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {weekdayLabels.map((day) => (
            <div key={day} className="px-1 py-2 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:px-2 sm:text-xs sm:tracking-[0.18em]">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`blank-${index}`} className="min-h-[66px] border-b border-r border-slate-100 bg-slate-50/60 last:border-r-0 sm:min-h-[92px]" />;
            }

            const isToday = day.dateKey === todayKey;
            const isSelected = selectedDateKey === day.dateKey;
            const dayBookings = bookings.filter(
              (booking) =>
                booking.date === day.dateKey &&
                booking.status !== 'cancelled' &&
                booking.status !== 'rejected',
            );
            const hasBookings = dayBookings.length > 0;

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDateKey(day.dateKey)}
                className={cn(
                  'min-h-[66px] border-b border-r border-slate-100 bg-white p-1.5 text-left transition last:border-r-0 hover:bg-brand-50 sm:min-h-[92px] sm:p-2',
                  hasBookings ? 'border-brand-200 bg-brand-50/60' : '',
                  isSelected ? 'bg-brand-50 ring-2 ring-inset ring-[#294c5f]' : '',
                )}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'grid h-6 w-6 place-items-center rounded-full text-xs font-bold',
                      isToday ? 'bg-[#294c5f] text-white' : 'text-ink',
                    )}
                  >
                    {day.dayNumber}
                  </span>
                </div>

                {dayBookings.length > 0 ? (
                  <span className="inline-flex max-w-full rounded-full border border-brand-200 bg-brand-100 px-1.5 py-1 text-[10px] font-extrabold leading-none text-[#294c5f] shadow-sm sm:px-2.5 sm:text-xs">
                    {dayBookings.length}<span className="hidden sm:inline">&nbsp;booking{dayBookings.length === 1 ? '' : 's'}</span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[18px] border border-white/80 bg-white px-4 py-4 shadow-card sm:px-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#294c5f]">Selected date</p>
            <h2 className="mt-1 text-xl font-bold text-ink">{selectedDateKey}</h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {selectedDateBookings.length} booking{selectedDateBookings.length === 1 ? '' : 's'} found
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {selectedDateBookings.length > 0 ? (
            selectedDateBookings.map((booking) => (
              <div key={booking.id} className="rounded-xl border border-slate-200 bg-[#fbfcfe] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{booking.reference}</p>
                    <h3 className="mt-1 text-base font-bold text-ink">{booking.customerName}</h3>
                    <p className="mt-1 text-xs text-slate-500">{booking.customerEmail}</p>
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-bold', bookingStatusClasses(booking.status))}>
                    {bookingStatusLabel(booking.status)}
                  </span>
                </div>

                <dl className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <div className="flex justify-between gap-3">
                    <dt>Venue/package</dt>
                    <dd className="text-right font-semibold text-ink">{booking.packageName ? `${booking.venueName} - ${booking.packageName}` : booking.venueName}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Time slot</dt>
                    <dd className="text-right font-semibold text-ink">{booking.timeSlotLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Guests</dt>
                    <dd className="text-right font-semibold text-ink">{booking.guests}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Contact</dt>
                    <dd className="text-right font-semibold text-ink">{booking.customerPhone || 'No phone saved'}</dd>
                  </div>
                </dl>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500 lg:col-span-2">
              No bookings for this selected date.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
