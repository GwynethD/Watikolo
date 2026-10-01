import { ArrowRight, CircleCheckBig, PackageCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAppData } from '@/context/AppDataContext';
import type { Booking } from '@/types';
import { formatCapacityLabel, formatCompactDate, formatCurrency, formatRoomCapacityLabel } from '@/utils/format';

interface SuccessState {
  booking?: Booking;
  total?: number;
}

function formatTimeLabel(value?: string) {
  const match = value?.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return undefined;
  }

  const hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

export function BookingSuccessPage() {
  const location = useLocation();
  const { bookings, packages, rooms } = useAppData();
  const state = (location.state as SuccessState | null) ?? {};
  const booking = state.booking ?? bookings[0];
  const isRoomBooking = booking?.bookingMode === 'room';
  const selectedRoom = isRoomBooking ? rooms.find((room) => room.name === booking?.packageName) : undefined;
  const selectedPackage = !isRoomBooking ? packages.find((pkg) => pkg.name === booking?.packageName) : undefined;
  const roomStayMatch = booking?.notes?.match(/Room stay: check-in ([\d-]+).*?check-out ([\d-]+)/);
  const checkInDate = roomStayMatch?.[1] ?? booking?.date;
  const checkOutDate = roomStayMatch?.[2];
  const bookingItemLabel = (isRoomBooking && booking?.roomAddOns?.length ? booking.roomAddOns.join(', ') : booking?.packageName) ?? booking?.venueName ?? (isRoomBooking ? 'Watikolo Room' : 'Watikolo Package');
  const bookingTypeLabel = isRoomBooking ? 'Room booking' : 'Package booking';
  const scheduleLabel = isRoomBooking ? 'Stay dates' : 'Event date & time';
  const scheduleValue = isRoomBooking
    ? `${checkInDate ? formatCompactDate(checkInDate) : 'Check-in pending'}${checkOutDate ? ` - ${formatCompactDate(checkOutDate)}` : ''}`
    : `${booking?.date ? formatCompactDate(booking.date) : 'Apr 18, 2026'} - ${booking?.timeSlotLabel ?? '8:00 AM - 12:00 PM'}${booking?.preferredStartTime ? `, starts ${formatTimeLabel(booking.preferredStartTime)}` : ''}`;
  const includedItems = selectedRoom?.inclusions ?? selectedPackage?.inclusions ?? [];

  return (
    <div className="container-shell py-4 sm:py-5">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white px-8 py-4 shadow-soft sm:px-10 sm:py-5">
        <div className="flex justify-center">
          <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
            <CircleCheckBig className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold-600">Booking submitted</p>
          <h1 className="mt-1 text-4xl font-semibold text-ink">Your {isRoomBooking ? 'room stay' : 'package request'} is now saved in the system</h1>
          <p className="mt-2 text-sm leading-5 text-slate-600">
            Your request is ready for admin approval and schedule review.
          </p>
        </div>

        <div className="mt-3 rounded-[2rem] bg-slate-50 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Reference number</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{booking?.reference ?? 'WTK-2026-0000'}</p>
            </div>
            <StatusBadge status={booking?.status ?? 'pending'} />
          </div>
          <div className="mt-2 grid gap-x-4 gap-y-2 text-sm text-slate-600 sm:grid-cols-2 [&>div]:py-2 [&>div>p]:mt-1 [&>div>p:first-child]:mt-0">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-slate-400">{bookingTypeLabel}</p>
              <p className="mt-2 font-medium text-ink">{bookingItemLabel}</p>
              <p className="mt-1 text-xs text-slate-500">
                {isRoomBooking
                  ? selectedRoom ? formatRoomCapacityLabel(selectedRoom.name, selectedRoom.capacity) : 'Room stay'
                  : selectedPackage ? formatCapacityLabel(selectedPackage.guestLabel) : booking?.venueName}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-slate-400">{scheduleLabel}</p>
              <p className="mt-2 font-medium text-ink">{scheduleValue}</p>
            </div>
            {!isRoomBooking ? (
              <div className="rounded-2xl bg-white p-4">
                <p className="text-slate-400">Venue</p>
                <p className="mt-2 font-medium text-ink">{booking?.venueName ?? 'Watikolo Venue'}</p>
              </div>
            ) : null}
            {booking?.roomAddOns && booking.roomAddOns.length > 0 ? (
              <div className="rounded-2xl bg-white p-4">
                <p className="text-slate-400">{isRoomBooking ? 'Selected rooms' : 'Room add-ons'}</p>
                <p className="mt-2 font-medium text-ink">{booking.roomAddOns.join(', ')}</p>
              </div>
            ) : null}
            <div className="rounded-2xl bg-white p-4"><p className="text-slate-400">Total amount to pay</p><p className="mt-2 font-medium text-ink">{formatCurrency(state.total ?? booking?.totalPrice ?? 91000)}</p></div>
            <div className="rounded-2xl bg-white p-4"><p className="text-slate-400">Current status</p><p className="mt-2 font-medium text-ink">Awaiting admin review</p></div>
          </div>
          {includedItems.length > 0 ? (
            <div className="mt-2 rounded-2xl bg-white px-4 py-2 text-sm text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <PackageCheck className="h-4 w-4 text-gold-500" />
                {isRoomBooking ? 'Room inclusions' : 'Package inclusions'}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {includedItems.map((item) => (
                  <span key={item} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-100">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-4">
          <Link to="/booking" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Make another booking
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/venues" className="inline-flex items-center rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Browse more venues
          </Link>
        </div>
      </div>
    </div>
  );
}



