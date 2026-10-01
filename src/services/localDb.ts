import { baseTimeSlots } from '@/mock/timeSlots';
import { bookings as seedBookings } from '@/mock/bookings';
import { reviews as seedReviews } from '@/mock/reviews';
import { venues as seedVenues } from '@/mock/venues';
import { accommodationPackages as seedPackages, type AccommodationPackage } from '@/mock/accommodationPackages';
import { accommodationRooms as seedRooms, type AccommodationRoom } from '@/mock/accommodationRooms';
import { additionalAddOns as seedAddOns, type AdditionalAddOn } from '@/mock/additionalAddOns';
import { inventoryItems as seedInventoryItems } from '@/mock/inventoryItems';
import type { AdminNotification, Booking, BookingFormValues, InventoryItem, InventoryTransaction, Review, ReviewStatus, SlotStatus, StatCardItem, Venue, VenueDraft } from '@/types';
import { startOfToday, toDateKey } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

export interface AppDataSnapshot {
  bookings: Booking[];
  notifications: AdminNotification[];
  reviews: Review[];
  venues: Venue[];
  packages: AccommodationPackage[];
  rooms: AccommodationRoom[];
  addOns: AdditionalAddOn[];
  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
}

const STORAGE_KEY = 'watikolo-app-data-v2';
const LEGACY_STORAGE_KEY = 'watikolo-app-data-v1';

const initialSnapshot: AppDataSnapshot = {
  bookings: seedBookings,
  notifications: [],
  reviews: seedReviews,
  venues: seedVenues,
  packages: seedPackages,
  rooms: seedRooms,
  addOns: seedAddOns,
  inventoryItems: seedInventoryItems,
  inventoryTransactions: [],
};

function cloneSnapshot(snapshot: AppDataSnapshot): AppDataSnapshot {
  return {
    bookings: snapshot.bookings.map((booking) => ({ ...booking })),
    notifications: snapshot.notifications.map((notification) => ({ ...notification })),
    reviews: snapshot.reviews.map((review) => ({ ...review })),
    venues: snapshot.venues.map((venue) => ({
      ...venue,
      amenities: [...venue.amenities],
      eventTypes: [...venue.eventTypes],
      gallery: [...venue.gallery],
    })),
    packages: snapshot.packages.map((item) => ({
      ...item,
      inclusions: [...item.inclusions],
    })),
    rooms: snapshot.rooms.map((item) => ({
      ...item,
      inclusions: [...item.inclusions],
    })),
    addOns: snapshot.addOns.map((item) => ({ ...item })),
    inventoryItems: snapshot.inventoryItems.map((item) => ({ ...item })),
    inventoryTransactions: snapshot.inventoryTransactions.map((item) => ({ ...item })),
  };
}

function refreshSeedBookingDates(bookings: Booking[]) {
  return bookings.map((booking) => {
    const currentSeed = seedBookings.find((seedBooking) => seedBooking.id === booking.id);

    if (!currentSeed) {
      return booking;
    }

    return {
      ...booking,
      date: currentSeed.date,
      createdAt: currentSeed.createdAt,
      timeSlotId: currentSeed.timeSlotId,
      timeSlotLabel: currentSeed.timeSlotLabel,
    };
  });
}

function mergeSeedVenues(venues: Venue[]) {
  const venueIds = new Set(venues.map((venue) => venue.id));
  const missingSeedVenues = seedVenues.filter((venue) => !venueIds.has(venue.id));

  return [...venues, ...cloneSnapshot({ bookings: [], notifications: [], reviews: [], venues: missingSeedVenues, packages: [], rooms: [], addOns: [], inventoryItems: [], inventoryTransactions: [] }).venues];
}

function mergeSeedInventoryItems(inventoryItems: InventoryItem[]) {
  const currentItems = removeLegacyRoomInventoryItems(inventoryItems);
  const inventoryItemIds = new Set(currentItems.map((item) => item.id));
  const missingSeedItems = seedInventoryItems.filter((item) => !inventoryItemIds.has(item.id));

  return [...currentItems, ...missingSeedItems.map((item) => ({ ...item }))];
}

export function removeLegacyRoomInventoryItems(inventoryItems: InventoryItem[]) {
  return inventoryItems.filter((item) => !item.id.startsWith('inventory-room-') && !item.id.startsWith('inventory-big-room-'));
}

function normalizeRooms(rooms: AccommodationRoom[]) {
  return rooms.map((room, index) => ({
    ...room,
    id: room.id ?? seedRooms[index]?.id ?? `room-${index + 1}`,
  }));
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadAppData(): AppDataSnapshot {
  if (!canUseStorage()) {
    return cloneSnapshot(initialSnapshot);
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  const legacyStored = stored ? null : window.localStorage.getItem(LEGACY_STORAGE_KEY);
  const source = stored ?? legacyStored;
  if (!stored) {
    if (!legacyStored) {
      return cloneSnapshot(initialSnapshot);
    }
  }

  try {
    const parsed = JSON.parse(source as string) as AppDataSnapshot;
    if (!parsed || !Array.isArray(parsed.bookings) || !Array.isArray(parsed.venues)) {
      return cloneSnapshot(initialSnapshot);
    }

    const inventoryItems = mergeSeedInventoryItems(Array.isArray(parsed.inventoryItems) ? parsed.inventoryItems : []);
    const inventoryItemIds = new Set(inventoryItems.map((item) => item.id));

    return {
      bookings: refreshSeedBookingDates(parsed.bookings),
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : cloneSnapshot(initialSnapshot).reviews,
      venues: mergeSeedVenues(parsed.venues),
      packages: Array.isArray(parsed.packages) ? parsed.packages : cloneSnapshot(initialSnapshot).packages,
      rooms: Array.isArray(parsed.rooms) ? normalizeRooms(parsed.rooms) : cloneSnapshot(initialSnapshot).rooms,
      addOns: Array.isArray(parsed.addOns) ? parsed.addOns : cloneSnapshot(initialSnapshot).addOns,
      inventoryItems,
      inventoryTransactions: (Array.isArray(parsed.inventoryTransactions) ? parsed.inventoryTransactions : [])
        .filter((transaction) => inventoryItemIds.has(transaction.itemId)),
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
  return `WTK-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`;
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
  return toDateKey(startOfToday());
}

function nowIso() {
  return new Date().toISOString();
}

function isWholePropertyPackage(booking: Pick<Booking, 'bookingMode' | 'packageIndex' | 'packageName'>) {
  return booking.bookingMode === 'package' && (
    booking.packageIndex === 3 ||
    booking.packageIndex === 4 ||
    booking.packageIndex === 5 ||
    booking.packageName === 'Deluxe' ||
    booking.packageName === 'Grand' ||
    booking.packageName === 'Ultimate'
  );
}

export function getSlotStatus(snapshot: AppDataSnapshot, venueId: string, date: string, slotId: string, requiresWholeProperty = false): SlotStatus {
  const activeBookingsOnDate = snapshot.bookings.filter(
    (booking) =>
      booking.date === date &&
      booking.status !== 'cancelled' &&
      booking.status !== 'rejected',
  );
  const blockingWholePropertyBookings = activeBookingsOnDate.filter(isWholePropertyPackage);

  if (requiresWholeProperty) {
    if (activeBookingsOnDate.some((booking) => booking.status === 'approved' || booking.status === 'completed')) {
      return 'booked';
    }

    if (activeBookingsOnDate.some((booking) => booking.status === 'pending')) {
      return 'reserved';
    }
  }

  if (blockingWholePropertyBookings.some((booking) => booking.status === 'approved' || booking.status === 'completed')) {
    return 'booked';
  }

  if (blockingWholePropertyBookings.some((booking) => booking.status === 'pending')) {
    return 'reserved';
  }

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
    bookingMode: payload.bookingMode,
    packageName: payload.packageName,
    packageIndex: payload.packageIndex,
    roomAddOns: payload.roomAddOns,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    date: payload.date,
    timeSlotId: slot.id,
    timeSlotLabel: slot.label,
    preferredStartTime: payload.preferredStartTime,
    guests: payload.guests,
    eventType: payload.eventType,
    totalPrice: payload.totalPrice ?? calculateBookingTotal(venue.price, payload.guests),
    depositAmount: payload.depositAmount,
    paymentProofName: payload.paymentProofName,
    paymentProofUrl: payload.paymentProofUrl,
    paymentProofPath: payload.paymentProofPath,
    status: 'pending',
    createdAt: todayIso(),
    notes: payload.notes,
  };
}

export function createBookingNotification(booking: Booking): AdminNotification {
  const bookingType = booking.bookingMode === 'room' ? 'room booking' : booking.packageName === 'Pool use only' ? 'pool walk-in' : 'booking';

  return {
    id: createId('notification'),
    type: 'booking',
    title: 'New booking received',
    message: `${booking.customerName} submitted ${booking.reference} for ${bookingType}.`,
    bookingId: booking.id,
    createdAt: nowIso(),
  };
}

export function createReview(payload: Pick<Review, 'name' | 'rating' | 'quote'>): Review {
  return {
    id: createId('review'),
    name: payload.name,
    rating: payload.rating,
    provider: 'direct',
    status: 'pending',
    createdAt: todayIso(),
    quote: payload.quote,
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

export function updateReviewStatus(snapshot: AppDataSnapshot, reviewId: string, status: ReviewStatus): Review | null {
  return snapshot.reviews.find((review) => review.id === reviewId)
    ? { ...snapshot.reviews.find((review) => review.id === reviewId), status } as Review
    : null;
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
