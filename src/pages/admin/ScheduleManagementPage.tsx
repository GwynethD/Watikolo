import { Fragment } from 'react';
import { baseTimeSlots } from '@/mock/timeSlots';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAppData } from '@/context/AppDataContext';
import { formatCompactDate } from '@/utils/format';

const scheduleDates = ['2026-04-18', '2026-04-19', '2026-04-20', '2026-04-21', '2026-04-22'];

export function ScheduleManagementPage() {
  const { venues, bookings, getSlotStatus } = useAppData();
  const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled' && booking.status !== 'rejected').length;

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <h1 className="text-3xl font-semibold text-ink">Schedule management</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">A calendar-style schedule interface showing live available, reserved, and booked slot states across venues.</p>
      </div>

      <div className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 text-sm">
            {['available', 'reserved', 'booked'].map((status) => (
              <div key={status} className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                <StatusBadge status={status} />
              </div>
            ))}
          </div>
          <div className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
            {activeBookings} active schedule blocks in the system
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card">
        <div className="grid min-w-[900px] grid-cols-[220px_repeat(5,minmax(0,1fr))]">
          <div className="border-b border-r border-slate-200 bg-slate-50 p-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Venue / Date</div>
          {scheduleDates.map((day) => (
            <div key={day} className="border-b border-r border-slate-200 bg-slate-50 p-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{formatCompactDate(day)}</div>
          ))}

          {venues.slice(0, 5).map((venue) => (
            <Fragment key={venue.id}>
              <div className="border-r border-slate-200 p-4">
                <p className="font-semibold text-ink">{venue.name}</p>
                <p className="mt-1 text-xs text-slate-500">{venue.type}</p>
              </div>
              {scheduleDates.map((day) => (
                <div key={`${venue.id}-${day}`} className="border-r border-t border-slate-200 p-4">
                  <div className="space-y-3">
                    {baseTimeSlots.map((slot) => {
                      const state = getSlotStatus(venue.id, day, slot.id);
                      return (
                        <div key={slot.id} className={`rounded-2xl p-3 text-xs ${state === 'available' ? 'bg-emerald-50 text-emerald-700' : state === 'reserved' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                          <p className="font-semibold">{slot.label}</p>
                          <p className="mt-1 capitalize">{state}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
