import { Download, Printer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppData } from '@/context/AppDataContext';
import type { Booking } from '@/types';
import { currentMonthRange } from '@/utils/date';
import { formatCompactDate, formatCurrency } from '@/utils/format';

const logoImage = new URL('../../pictures/watikolo-logo.png', import.meta.url).href;

const salesReportStatuses = [
  { status: 'approved', label: 'Approved sales', description: 'Confirmed booking sales in this range.' },
  { status: 'rejected', label: 'Rejected sales', description: 'Sales requests that were declined.' },
] as const;

type SalesReportStatus = typeof salesReportStatuses[number]['status'];
type ReportRange = 'day' | 'week' | 'month';
type PrintReport = 'all' | SalesReportStatus;
type SalesFilterType = 'all' | 'venue' | 'package' | 'room' | 'pool';

interface SalesFilterOption {
  value: string;
  type: SalesFilterType;
  id?: string;
  name?: string;
  label: string;
  detail: string;
}

const printReportOptions: { value: PrintReport; label: string }[] = [
  { value: 'all', label: 'All booking report' },
  { value: 'approved', label: 'Approved sales report' },
  { value: 'rejected', label: 'Rejected sales report' },
];

function formatReportRange(startDate: string, endDate: string) {
  const [fromDate, toDate] = [startDate, endDate].sort();

  return `${formatCompactDate(fromDate)} - ${formatCompactDate(toDate)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getPresetDateRange(reportRange: ReportRange, dateKey: string) {
  const selectedDate = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(selectedDate.getTime())) {
    return { startDate: todayKey(), endDate: todayKey() };
  }

  if (reportRange === 'day') {
    return { startDate: toInputDate(selectedDate), endDate: toInputDate(selectedDate) };
  }

  if (reportRange === 'week') {
    const weekStart = new Date(selectedDate);
    weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return { startDate: toInputDate(weekStart), endDate: toInputDate(weekEnd) };
  }

  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

  return { startDate: toInputDate(monthStart), endDate: toInputDate(monthEnd) };
}

function dateKeysInRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  const currentDate = new Date(`${startDate}T00:00:00`);
  const lastDate = new Date(`${endDate}T00:00:00`);

  while (currentDate <= lastDate) {
    dates.push(currentDate.toISOString().slice(0, 10));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function csvValue(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function salesFilterValue(type: SalesFilterType, value = 'all') {
  return `${type}:${value}`;
}

function isWalkInBooking(booking: Booking) {
  return booking.notes?.includes('Walk-in booking created by admin.') ?? false;
}

function bookingMatchesSalesFilter(booking: Booking, filter: SalesFilterOption) {
  if (filter.type === 'all') {
    return true;
  }

  if (filter.type === 'venue') {
    return booking.venueId === filter.id;
  }

  if (filter.type === 'package') {
    return booking.bookingMode !== 'room' && booking.packageName === filter.name;
  }

  if (filter.type === 'pool') {
    return booking.packageName === 'Pool use only';
  }

  return (booking.bookingMode === 'room' && booking.packageName === filter.name) || Boolean(booking.roomAddOns?.includes(filter.name ?? ''));
}

export function ReportsPage() {
  const { bookings, venues, packages, rooms } = useAppData();
  const [initialRange] = useState(() => currentMonthRange());
  const [reportPreset, setReportPreset] = useState<ReportRange>('month');
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [printReport, setPrintReport] = useState<PrintReport>('all');
  const [salesFilter, setSalesFilter] = useState(salesFilterValue('all'));
  const rangeLabel = formatReportRange(startDate, endDate);

  const salesFilterOptions = useMemo<SalesFilterOption[]>(() => [
    { value: salesFilterValue('all'), type: 'all', label: 'All rooms, packages, venues, and walk-ins', detail: 'Complete sales view' },
    ...venues.slice(0, 3).map((venue) => ({
      value: salesFilterValue('venue', venue.id),
      type: 'venue' as const,
      id: venue.id,
      name: venue.name,
      label: `Venue - ${venue.name}`,
      detail: 'Venue sales',
    })),
    {
      value: salesFilterValue('pool', 'swimming-pool-only'),
      type: 'pool' as const,
      name: 'Pool use only',
      label: 'Walk-in - Swimming pool only',
      detail: 'Pool walk-in sales',
    },
    ...packages.map((item) => ({
      value: salesFilterValue('package', item.name),
      type: 'package' as const,
      name: item.name,
      label: `Package - ${item.name}`,
      detail: 'Package sales',
    })),
    ...rooms.map((room) => ({
      value: salesFilterValue('room', room.name),
      type: 'room' as const,
      name: room.name,
      label: `Room - ${room.name}`,
      detail: 'Direct room bookings and room add-ons',
    })),
  ], [packages, rooms, venues]);
  const selectedSalesFilter = salesFilterOptions.find((option) => option.value === salesFilter) ?? salesFilterOptions[0];
  const rangedBookings = useMemo(
    () => bookings.filter((booking) => booking.date >= startDate && booking.date <= endDate),
    [bookings, endDate, startDate],
  );
  const filteredBookings = useMemo(
    () => rangedBookings.filter((booking) => bookingMatchesSalesFilter(booking, selectedSalesFilter)),
    [rangedBookings, selectedSalesFilter],
  );
  const salesReportBookings = filteredBookings.filter((booking) => booking.status !== 'pending');
  const printReportLabel = printReportOptions.find((option) => option.value === printReport)?.label ?? 'All booking report';
  const reportBookings = (printReport === 'all'
    ? salesReportBookings
    : salesReportBookings.filter((booking) => booking.status === printReport)
  ).slice().sort((firstBooking, secondBooking) => (
    firstBooking.date.localeCompare(secondBooking.date)
    || firstBooking.reference.localeCompare(secondBooking.reference)
  ));
  const rangedRevenue = filteredBookings
    .filter((booking) => booking.status === 'approved' || booking.status === 'completed')
    .reduce((sum, booking) => sum + booking.totalPrice, 0);

  const reportTotals = reportBookings.reduce(
    (totals, booking) => {
      const paid = booking.depositAmount ?? (booking.status === 'completed' ? booking.totalPrice : 0);

      return {
        total: totals.total + booking.totalPrice,
        paid: totals.paid + paid,
        balance: totals.balance + booking.totalPrice - paid,
      };
    },
    { total: 0, paid: 0, balance: 0 },
  );
  const dailySalesReport = dateKeysInRange(startDate, endDate).map((date) => {
    const dayBookings = reportBookings.filter((booking) => booking.date === date);
    const totals = dayBookings.reduce(
      (summary, booking) => {
        const paid = booking.depositAmount ?? (booking.status === 'completed' ? booking.totalPrice : 0);

        return {
          total: summary.total + booking.totalPrice,
          paid: summary.paid + paid,
          balance: summary.balance + booking.totalPrice - paid,
        };
      },
      { total: 0, paid: 0, balance: 0 },
    );

    return {
      date,
      bookings: dayBookings.length,
      ...totals,
    };
  });
  const handleExportReport = () => {
    const rows = [
      ['Watikolo Booking Sales Report'],
      ['Report Type', printReportLabel],
      ['Sales View', selectedSalesFilter.label],
      ['Date Range', rangeLabel],
      [],
      ['Daily Sales Summary'],
      ['Date', 'Bookings', 'Sales', 'Paid', 'Balance'],
      ...dailySalesReport.map((day) => [formatCompactDate(day.date), day.bookings, day.total, day.paid, day.balance]),
      [],
      ['Booking Details'],
      ['Reference', 'Customer', 'Contact', 'Date', 'Schedule', 'Venue', 'Sales Item', 'Event', 'Total', 'Paid', 'Balance'],
      ...reportBookings.map((booking) => {
        const paid = booking.depositAmount ?? (booking.status === 'completed' ? booking.totalPrice : 0);

        return [
          booking.reference,
          booking.customerName,
          booking.customerPhone ?? booking.customerEmail,
          formatCompactDate(booking.date),
          booking.timeSlotLabel,
          booking.venueName,
          booking.packageName ?? booking.venueName,
          booking.eventType,
          booking.totalPrice,
          paid,
          booking.totalPrice - paid,
        ];
      }),
      [],
      ['Totals', '', '', '', '', '', '', '', reportTotals.total, reportTotals.paid, reportTotals.balance],
    ];
    const csv = rows.map((row) => row.map(csvValue).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${startDate}-to-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyReportPreset = (nextPreset: ReportRange) => {
    const range = getPresetDateRange(nextPreset, todayKey());
    setReportPreset(nextPreset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  return (
    <div className="space-y-3">
      <section className="admin-report-toolbar rounded-[18px] border border-white/80 bg-white px-4 py-4 shadow-card sm:px-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Reports</p>
        <h1 className="mt-1 text-xl font-bold text-ink sm:text-2xl">Reports and insights</h1>
        <p className="mt-1 text-sm leading-5 text-slate-500">Review saved booking activity by date range in a printable table report.</p>
      </section>

      <section className="admin-report-toolbar rounded-[18px] border border-white/80 bg-white px-4 py-3 shadow-card">
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
          <div className="inline-flex w-full overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-auto">
            {(['day', 'week', 'month'] as ReportRange[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyReportPreset(preset)}
                className={`flex-1 px-3 py-2 text-xs font-bold capitalize transition sm:flex-none ${
                  reportPreset === preset ? 'bg-[#214f35] text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <label className="grid gap-1 text-xs font-bold text-slate-500 sm:flex sm:items-center sm:gap-2">
            From
            <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} className="interactive-ring h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-ink sm:w-auto" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-500 sm:flex sm:items-center sm:gap-2">
            To
            <input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} className="interactive-ring h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-ink sm:w-auto" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-500 sm:flex sm:items-center sm:gap-2">
            Sales view
            <select value={salesFilter} onChange={(event) => setSalesFilter(event.target.value)} className="interactive-ring h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-ink sm:w-auto sm:min-w-[260px]">
              {salesFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-500 sm:flex sm:items-center sm:gap-2">
            Report
            <select value={printReport} onChange={(event) => setPrintReport(event.target.value as PrintReport)} className="interactive-ring h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-ink sm:w-auto sm:min-w-[210px]">
              {printReportOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => window.print()} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 hover:bg-slate-200 sm:w-auto">
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
          <button type="button" onClick={handleExportReport} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#eaf4ef] px-3 text-xs font-bold text-[#214f35] hover:bg-[#dceee4] sm:w-auto">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </section>

      <section className="admin-print-report rounded-[16px] border border-white/80 bg-white p-4 shadow-card sm:p-5">
        <div className="admin-report-letterhead border-b border-slate-200 pb-5">
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <img src={logoImage} alt="Watikolo logo" className="h-16 w-16 rounded-full object-contain ring-1 ring-slate-200" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Watikolo Event Venue Rental</p>
                <h2 className="mt-1 text-2xl font-bold leading-tight text-ink">Official Booking Report</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">Purok 4 Upper Puntod Road, Tabalong, Dauis, Bohol</p>
                <p className="mt-2 text-xs font-semibold text-ink">As of: {rangeLabel}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-[12px] border border-slate-100 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Report Type</p>
              <p className="mt-1 text-sm font-bold text-ink">{printReportLabel}</p>
            </div>
            <div className="rounded-[12px] border border-slate-100 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Sales View</p>
              <p className="mt-1 text-sm font-bold text-ink">{selectedSalesFilter.label}</p>
            </div>
            <div className="rounded-[12px] border border-slate-100 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Bookings</p>
              <p className="mt-1 text-sm font-bold text-ink">{reportBookings.length}</p>
            </div>
            <div className="rounded-[12px] border border-slate-100 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Projected Revenue</p>
              <p className="mt-1 text-sm font-bold text-ink">{formatCurrency(rangedRevenue)}</p>
            </div>
          </div>

        </div>

        <div className="mt-5 overflow-hidden rounded-[12px] border border-slate-100">
          <div className="admin-print-table-wrap overflow-x-auto">
            <table className="admin-print-table min-w-[960px] w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Reference</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Schedule</th>
                  <th className="px-3 py-3">Sales item</th>
                  <th className="px-3 py-3">Event</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3 text-right">Paid</th>
                  <th className="px-3 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportBookings.map((booking) => {
                  const paid = booking.depositAmount ?? (booking.status === 'completed' ? booking.totalPrice : 0);
                  const balance = booking.totalPrice - paid;

                  return (
                    <tr key={booking.id} className="align-top text-slate-600">
                      <td className="px-3 py-3 font-semibold text-ink">
                        <p>{booking.reference}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">{booking.venueName}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-ink">{booking.customerName}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{booking.customerPhone ?? booking.customerEmail}</p>
                      </td>
                      <td className="px-3 py-3 font-medium text-ink">{formatCompactDate(booking.date)}</td>
                      <td className="px-3 py-3">{booking.timeSlotLabel}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-ink">{booking.packageName ?? booking.venueName}</p>
                        <p className="mt-0.5 text-[11px] capitalize text-slate-400">{isWalkInBooking(booking) ? 'Walk-in' : booking.bookingMode ?? 'venue'}</p>
                      </td>
                      <td className="px-3 py-3 capitalize">{booking.eventType}</td>
                      <td className="px-3 py-3 text-right font-semibold text-ink">{formatCurrency(booking.totalPrice)}</td>
                      <td className="px-3 py-3 text-right">{formatCurrency(paid)}</td>
                      <td className="px-3 py-3 text-right font-semibold text-ink">{formatCurrency(balance)}</td>
                    </tr>
                  );
                })}
                {reportBookings.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                      No bookings saved for this report yet.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-ink">
                <tr>
                  <td className="px-3 py-3" colSpan={6}>Totals</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(reportTotals.total)}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(reportTotals.paid)}</td>
                  <td className="px-3 py-3 text-right">{formatCurrency(reportTotals.balance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="admin-report-signatures mt-10 grid gap-8 pb-16 sm:grid-cols-2">
          <div>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Prepared by</p>
            <p className="admin-signature-name mt-12 text-sm font-semibold text-ink">Watikolo Admin Staff</p>
          </div>
          <div>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Approved by</p>
            <p className="admin-signature-name mt-12 text-sm font-semibold text-ink">Watikolo Management</p>
          </div>
        </div>
      </section>
    </div>
  );
}
