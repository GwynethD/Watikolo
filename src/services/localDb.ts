import { baseTimeSlots } from '@/mock/timeSlots';
import { bookings as seedBookings } from '@/mock/bookings';
import { venues as seedVenues } from '@/mock/venues';
import type { Booking, BookingFormValues, SlotStatus, StatCardItem, Venue, VenueDraft } from '@/types';
import { formatCurrency } from '@/utils/format';

export interface AppDataSnapshot {
  bookings: Booking[];
  venues: Venue[];
}

const STORAGE_KEY = 'watikolo-app-data-v1';

const initialSnapshot: AppDataSnapshot = {
  bookings: seedBookings,
  venues: seedVenues,
};

function cloneSnapshot(snapshot: AppDataSnapshot): AppDataSnapshot {
  return {
    bookings: snapshot.bookings.map((booking) => ({ ...booking })),
    venues: snapshot.venues.map((venue) => ({
      ...venue,
      amenities: [...venue.amenities],
      eventTypes: [...venue.eventTypes],
      gallery: [...venue.gallery],
    })),
  };
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadAppData(): AppDataSnapshot {
  if (!canUseStorage()) {
    return cloneSnapshot(initialSnapshot);
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return cloneSnapshot(initialSnapshot);
  }

  try {
    const parsed = JSON.parse(stored) as AppDataSnapshot;
    if (!parsed || !Array.isArray(parsed.bookings) || !Array.isArray(parsed.venues)) {
      return cloneSnapshot(initialSnapshot);
    }

    return {
      bookings: parsed.bookings,
      venues: parsed.venues,
    };
  } catch {
    return cloneSnapshot(initialSnapshot);
  }
}

export function saveAppData(snapshot: AppDataSnapshot) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function calculateBookingTotal(venuePrice: number, guests: number) {
  return venuePrice + 4500 + (guests > 150 ? 7000 : guests > 100 ? 3500 : 1500);
}

function createReference(bookings: Booking[]) {
  const numericParts = bookings
    .map((booking) => Number(booking.reference.split('-').pop()))
    .filter((value) => Number.isFinite(value));
  const nextNumber = (numericParts.length > 0 ? Math.max(...numericParts) : 0) + 1;
  return `WTK-2026-${String(nextNumber).padStart(4, '0')}`;
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function getSlotStatus(snapshot: AppDataSnapshot, venueId: string, date: string, slotId: string): SlotStatus {
  const matchingBookings = snapshot.bookings.filter(
    (booking) =>
      booking.venueId === venueId &&
      booking.date === date &&
      booking.timeSlotId === slotId &&
      booking.status !== 'cancelled' &&
      booking.status !== 'rejected',
  );

  if (matchingBookings.some((booking) => booking.status === 'approved' || booking.status === 'completed')) {
    return 'booked';
  }

  if (matchingBookings.some((booking) => booking.status === 'pending')) {
    return 'reserved';
  }

  return 'available';
}

export function createBooking(snapshot: AppDataSnapshot, payload: BookingFormValues): Booking {
  const venue = snapshot.venues.find((item) => item.id === payload.venueId) ?? snapshot.venues[0];
  const slot = baseTimeSlots.find((item) => item.id === payload.timeSlotId) ?? baseTimeSlots[0];

  return {
    id: createId('booking'),
    reference: createReference(snapshot.bookings),
    venueId: venue.id,
    venueName: venue.name,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    date: payload.date,
    timeSlotId: slot.id,
    timeSlotLabel: slot.label,
    guests: payload.guests,
    eventType: payload.eventType,
    totalPrice: calculateBookingTotal(venue.price, payload.guests),
    status: 'pending',
    createdAt: todayIso(),
    notes: payload.notes,
  };
}

export function upsertVenue(snapshot: AppDataSnapshot, draft: VenueDraft, venueId?: string): Venue {
  const existingVenue = snapshot.venues.find((venue) => venue.id === venueId);
  const nameSlug = slugify(draft.name);

  return {
    ...draft,
    id: existingVenue?.id ?? createId('venue'),
    slug: existingVenue?.slug ?? nameSlug,
    rating: draft.rating ?? existingVenue?.rating ?? 4.8,
    gallery: draft.gallery.length > 0 ? draft.gallery : existingVenue?.gallery ?? [draft.heroImage],
    featured: draft.featured ?? existingVenue?.featured ?? false,
  };
}

export function buildAdminStats(snapshot: AppDataSnapshot): StatCardItem[] {
  const approvedCount = snapshot.bookings.filter((booking) => booking.status === 'approved').length;
  const pendingCount = snapshot.bookings.filter((booking) => booking.status === 'pending').length;
  const approvedRevenue = snapshot.bookings
    .filter((booking) => booking.status === 'approved' || booking.status === 'completed')
    .reduce((sum, booking) => sum + booking.totalPrice, 0);
  const occupancyAverage = Math.round(
    snapshot.venues.reduce((sum, venue) => {
      const activeCount = snapshot.bookings.filter(
        (booking) => booking.venueId === venue.id && booking.status !== 'cancelled' && booking.status !== 'rejected',
      ).length;
      return sum + Math.min(100, 35 + activeCount * 18);
    }, 0) / Math.max(snapshot.venues.length, 1),
  );

  return [
    { id: 'a1', label: 'Total bookings', value: String(snapshot.bookings.length).padStart(2, '0'), change: `${approvedCount} approved this cycle`, trend: 'up' },
    { id: 'a2', label: 'Venue utilization', value: `${occupancyAverage}%`, change: 'Live from current venue load', trend: 'up' },
    { id: 'a3', label: 'Pending approvals', value: String(pendingCount).padStart(2, '0'), change: pendingCount > 0 ? 'Needs attention today' : 'Queue is clear', trend: pendingCount > 0 ? 'neutral' : 'up' },
    { id: 'a4', label: 'Projected revenue', value: formatCurrency(approvedRevenue), change: 'Approved and completed bookings', trend: 'up' },
  ];
}

export function buildCustomerStats(snapshot: AppDataSnapshot, customerEmail: string): StatCardItem[] {
  const customerBookings = snapshot.bookings.filter((booking) => booking.customerEmail === customerEmail);
  const activeBookings = customerBookings.filter((booking) => booking.status === 'pending' || booking.status === 'approved');
  const upcomingBookings = customerBookings.filter((booking) => booking.status === 'approved');
  const historyBookings = customerBookings.filter((booking) => booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected');

  return [
    { id: 'c1', label: 'Active bookings', value: String(activeBookings.length), change: activeBookings.length > 0 ? 'Requests currently in motion' : 'No active requests yet', trend: activeBookings.length > 0 ? 'up' : 'neutral' },
    { id: 'c2', label: 'Upcoming events', value: String(upcomingBookings.length), change: upcomingBookings[0] ? `Next on ${upcomingBookings[0].date}` : 'Awaiting approval', trend: upcomingBookings.length > 0 ? 'up' : 'neutral' },
    { id: 'c3', label: 'Past bookings', value: String(historyBookings.length), change: historyBookings.length > 0 ? 'Stored in your reservation history' : 'History will appear here', trend: historyBookings.length > 0 ? 'up' : 'neutral' },
  ];
}
