import type { Booking } from '@/types';
import { addDays, toDateKey } from './date';

export function unavailableRooms(bookings: Booking[], roomNames: string[], checkIn: string, checkOut: string) {
  return new Set(roomNames.filter((name) => bookings.some((booking) => {
    if (booking.status === 'cancelled' || booking.status === 'rejected') return false;
    const checkout = (booking as Booking & { checkOutDate?: string }).checkOutDate
      || booking.notes?.match(/check-out\s+(\d{4}-\d{2}-\d{2})/i)?.[1];
    const end = booking.bookingMode === 'room' && checkout && checkout > booking.date
      ? checkout : toDateKey(addDays(new Date(`${booking.date}T00:00:00`), 1));
    if (!(checkIn < end && booking.date < checkOut)) return false;
    const wholeProperty = booking.bookingMode === 'package' && (
      (booking.packageIndex ?? -1) >= 3 || ['Deluxe', 'Grand', 'Ultimate'].includes(booking.packageName ?? '')
    );
    return wholeProperty || (booking.bookingMode === 'room' && booking.packageName === name)
      || Boolean(booking.roomAddOns?.includes(name)) || Boolean(booking.notes?.includes(`${name} Room Add-on`));
  })));
}
