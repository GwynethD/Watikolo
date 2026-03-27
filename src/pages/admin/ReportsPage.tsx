import { Button } from '@/components/ui/Button';
import { StatsCard } from '@/components/ui/StatsCard';
import { useAppData } from '@/context/AppDataContext';
import { formatCurrency } from '@/utils/format';

export function ReportsPage() {
  const { adminStats, bookings, venues, resetData } = useAppData();
  const chartBars = [1, 2, 3, 4, 5, 6, 7].map((month) => bookings.filter((booking) => Number(booking.createdAt.slice(5, 7)) === month).length * 18 + 18);
  const approvedRevenue = bookings
    .filter((booking) => booking.status === 'approved' || booking.status === 'completed')
    .reduce((sum, booking) => sum + booking.totalPrice, 0);
  const busiestSlot = bookings.reduce<Record<string, number>>((accumulator, booking) => {
    accumulator[booking.timeSlotLabel] = (accumulator[booking.timeSlotLabel] ?? 0) + 1;
    return accumulator;
  }, {});
  const topVenueId = bookings.reduce<Record<string, number>>((accumulator, booking) => {
    accumulator[booking.venueId] = (accumulator[booking.venueId] ?? 0) + 1;
    return accumulator;
  }, {});
  const topVenue = venues.find((venue) => venue.id === Object.entries(topVenueId).sort((left, right) => right[1] - left[1])[0]?.[0]);
  const busiestSlotLabel = Object.entries(busiestSlot).sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'No bookings yet';

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-ink">Reports and insights</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Use live dashboard cards and summary blocks sourced from saved booking activity.</p>
          </div>
          <Button variant="ghost" onClick={resetData}>Reset demo data</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((item) => (
          <StatsCard key={item.id} item={item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel p-6">
          <h2 className="text-2xl font-semibold text-ink">Booking trends</h2>
          <p className="mt-2 text-sm text-slate-500">Saved booking creation activity by month.</p>
          <div className="mt-8 flex h-72 items-end gap-4 rounded-[2rem] bg-slate-50 p-6">
            {chartBars.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3">
                <div className="w-full rounded-t-2xl bg-gradient-to-t from-brand-700 to-gold-400" style={{ height: `${value * 2}px` }} />
                <span className="text-xs text-slate-500">M{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <h2 className="text-2xl font-semibold text-ink">Revenue summary</h2>
            <div className="mt-6 rounded-[2rem] bg-ink p-6 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-gold-300">Current projection</p>
              <p className="mt-3 text-4xl font-semibold">{formatCurrency(approvedRevenue)}</p>
              <p className="mt-3 text-sm text-slate-300">Based on approved bookings, completed events, and current venue activity.</p>
            </div>
          </div>
          <div className="panel p-6">
            <h2 className="text-2xl font-semibold text-ink">Highlights</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4"><span className="font-semibold text-ink">Top-performing venue:</span> {topVenue?.name ?? 'No venue data yet'}</div>
              <div className="rounded-2xl bg-slate-50 p-4"><span className="font-semibold text-ink">Busiest slot:</span> {busiestSlotLabel}</div>
              <div className="rounded-2xl bg-slate-50 p-4"><span className="font-semibold text-ink">Venue count:</span> {venues.length} active listings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
