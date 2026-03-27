import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEMO_CUSTOMER } from '@/constants/demo';
import { simulateRequest } from '@/services/api';
import {
  buildAdminStats,
  buildCustomerStats,
  createBooking as createBookingRecord,
  getSlotStatus as getSlotStatusFromSnapshot,
  loadAppData,
  saveAppData,
  upsertVenue,
} from '@/services/localDb';
import type { Booking, BookingFormValues, BookingStatus, SlotStatus, StatCardItem, Venue, VenueDraft } from '@/types';

interface AppDataContextValue {
  bookings: Booking[];
  venues: Venue[];
  adminStats: StatCardItem[];
  customerStats: StatCardItem[];
  createBooking: (payload: BookingFormValues) => Promise<Booking>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<Booking | null>;
  removeVenue: (venueId: string) => Promise<void>;
  saveVenue: (draft: VenueDraft, venueId?: string) => Promise<Venue>;
  getSlotStatus: (venueId: string, date: string, slotId: string) => SlotStatus;
  resetData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState(loadAppData);

  useEffect(() => {
    saveAppData(snapshot);
  }, [snapshot]);

  const value = useMemo<AppDataContextValue>(() => ({
    bookings: snapshot.bookings,
    venues: snapshot.venues,
    adminStats: buildAdminStats(snapshot),
    customerStats: buildCustomerStats(snapshot, DEMO_CUSTOMER.email),
    createBooking: async (payload) => {
      const booking = createBookingRecord(snapshot, payload);
      setSnapshot((current) => ({ ...current, bookings: [booking, ...current.bookings] }));
      return simulateRequest(booking);
    },
    updateBookingStatus: async (bookingId, status) => {
      let updatedBooking: Booking | null = null;
      setSnapshot((current) => ({
        ...current,
        bookings: current.bookings.map((booking) => {
          if (booking.id !== bookingId) {
            return booking;
          }

          updatedBooking = { ...booking, status };
          return updatedBooking;
        }),
      }));
      return simulateRequest(updatedBooking);
    },
    removeVenue: async (venueId) => {
      setSnapshot((current) => ({
        ...current,
        venues: current.venues.filter((venue) => venue.id !== venueId),
      }));
      await simulateRequest(undefined);
    },
    saveVenue: async (draft, venueId) => {
      const venue = upsertVenue(snapshot, draft, venueId);
      setSnapshot((current) => ({
        ...current,
        venues: current.venues.some((item) => item.id === venue.id)
          ? current.venues.map((item) => (item.id === venue.id ? venue : item))
          : [venue, ...current.venues],
      }));
      return simulateRequest(venue);
    },
    getSlotStatus: (venueId, date, slotId) => getSlotStatusFromSnapshot(snapshot, venueId, date, slotId),
    resetData: () => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('watikolo-app-data-v1');
      }
      setSnapshot(loadAppData());
    },
  }), [snapshot]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }

  return context;
}
