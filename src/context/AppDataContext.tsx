import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEMO_CUSTOMER } from '@/constants/demo';
import { appDataService } from '@/services/appDataService';
import { isSupabaseRealtimeConfigured, subscribeToAppDataSnapshot } from '@/services/supabaseRealtime';
import {
  buildAdminStats,
  buildCustomerStats,
  getSlotStatus as getSlotStatusFromSnapshot,
  loadAppData,
  removeLegacyRoomInventoryItems,
  saveAppData,
} from '@/services/localDb';
import type { AccommodationPackage } from '@/mock/accommodationPackages';
import type { AccommodationRoom } from '@/mock/accommodationRooms';
import type { AdditionalAddOn } from '@/mock/additionalAddOns';
import type { AdminNotification, Booking, BookingFormValues, BookingStatus, InventoryItem, InventoryTransaction, Review, ReviewStatus, SlotStatus, StatCardItem, Venue, VenueDraft } from '@/types';

const AUTO_ROOM_INVENTORY_NOTE = 'Automatic room booking allocation.';
const AUTO_ROOM_INVENTORY_RETURN_NOTE = 'Automatic room booking release.';
const AUTO_ROOM_CONSUMABLES = new Set(['soap', 'tissues']);
const AUTO_PACKAGE_REUSABLE_DEFAULTS = new Map([
  ['tables', 7],
  ['guest chairs', 50],
  ['chairs', 50],
]);
const AUTO_POOL_WALK_IN_REUSABLE_DEFAULTS = new Map([
  ['tables', 1],
  ['guest chairs', 5],
  ['chairs', 5],
]);

function isInventoryOccupyingBooking(status: BookingStatus) {
  return status === 'approved';
}

function updateRoomInventoryForBooking(
  rooms: AccommodationRoom[],
  inventoryItems: InventoryItem[],
  inventoryTransactions: InventoryTransaction[],
  previousBooking: Booking,
  updatedBooking: Booking,
) {
  if (previousBooking.status === updatedBooking.status || previousBooking.bookingMode !== updatedBooking.bookingMode) {
    return { inventoryItems, inventoryTransactions };
  }

  const isRoomBooking = updatedBooking.bookingMode === 'room';
  const isPoolWalkIn = updatedBooking.bookingMode === 'package'
    && updatedBooking.packageName === 'Pool use only'
    && Boolean(updatedBooking.notes?.includes('Table fee:'));
  const isPackageBooking = updatedBooking.bookingMode === 'package' && !isPoolWalkIn;
  const room = isRoomBooking ? rooms.find((item) => item.name === updatedBooking.packageName) : undefined;
  if (isRoomBooking && !room) return { inventoryItems, inventoryTransactions };

  const wasOccupying = isInventoryOccupyingBooking(previousBooking.status);
  const isOccupying = isInventoryOccupyingBooking(updatedBooking.status);
  if (wasOccupying === isOccupying) return { inventoryItems, inventoryTransactions };

  const nextItems = inventoryItems.map((item) => ({ ...item }));
  const nextTransactions = [...inventoryTransactions];
  const now = new Date().toISOString();

  nextItems.forEach((item, index) => {
    const isAutoManagedConsumable = item.itemType === 'consumable' && AUTO_ROOM_CONSUMABLES.has(item.name.trim().toLowerCase());
    const packageDefaults = isPoolWalkIn ? AUTO_POOL_WALK_IN_REUSABLE_DEFAULTS : AUTO_PACKAGE_REUSABLE_DEFAULTS;
    const packageDefaultQuantity = packageDefaults.get(item.name.trim().toLowerCase()) ?? 0;
    const isSharedReusable = isRoomBooking && item.itemType !== 'consumable' && !item.room_id;
    const isPackageItem = (isPackageBooking || isPoolWalkIn) && item.itemType !== 'consumable' && packageDefaultQuantity > 0;
    const isRoomConsumable = isRoomBooking && isAutoManagedConsumable;
    if ((!isRoomConsumable && !isSharedReusable && !isPackageItem) || item.archived) return;

    if (isOccupying) {
      const quantity = isPackageItem
        ? Math.min(packageDefaultQuantity, Math.max(0, item.availableQuantity))
        : isAutoManagedConsumable || !item.room_id
        ? Math.min(1, Math.max(0, item.availableQuantity))
        : Math.max(0, item.availableQuantity);
      if (quantity === 0) return;

      nextItems[index] = {
        ...item,
        availableQuantity: item.availableQuantity - quantity,
        totalQuantity: isAutoManagedConsumable ? Math.max(0, item.totalQuantity - quantity) : item.totalQuantity,
        inUseQuantity: isAutoManagedConsumable ? item.inUseQuantity : item.inUseQuantity + quantity,
        updatedAt: now.slice(0, 10),
      };
      nextTransactions.unshift({
        id: `booking-issue-${updatedBooking.id}-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        type: 'issue',
        quantity,
        previousQuantity: item.availableQuantity,
        newQuantity: item.availableQuantity - quantity,
        bookingReference: updatedBooking.reference,
        performedBy: 'Watikolo Booking System',
        reason: 'Booking/Event',
        notes: AUTO_ROOM_INVENTORY_NOTE,
        createdAt: now,
      });
      return;
    }

    if (item.itemType === 'consumable') return;

    const allocation = nextTransactions.find(
      (transaction) => transaction.itemId === item.id
        && transaction.bookingReference === updatedBooking.reference
        && transaction.notes === AUTO_ROOM_INVENTORY_NOTE,
    );
    const quantity = Math.min(item.inUseQuantity, allocation?.quantity ?? 0);
    if (quantity === 0) return;

    nextItems[index] = {
      ...item,
      availableQuantity: item.availableQuantity + quantity,
      inUseQuantity: item.inUseQuantity - quantity,
      updatedAt: now.slice(0, 10),
    };
    nextTransactions.unshift({
      id: `booking-return-${updatedBooking.id}-${item.id}`,
      itemId: item.id,
      itemName: item.name,
      type: 'return',
      quantity,
      previousQuantity: item.availableQuantity,
      newQuantity: item.availableQuantity + quantity,
      bookingReference: updatedBooking.reference,
      performedBy: 'Watikolo Booking System',
      reason: 'Returned',
      notes: AUTO_ROOM_INVENTORY_RETURN_NOTE,
      createdAt: now,
    });
  });

  return { inventoryItems: nextItems, inventoryTransactions: nextTransactions };
}

interface AppDataContextValue {
  bookings: Booking[];
  notifications: AdminNotification[];
  reviews: Review[];
  venues: Venue[];
  packages: AccommodationPackage[];
  rooms: AccommodationRoom[];
  addOns: AdditionalAddOn[];
  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  adminStats: StatCardItem[];
  customerStats: StatCardItem[];
  createBooking: (payload: BookingFormValues) => Promise<Booking>;
  markAdminNotificationsRead: () => void;
  createReview: (payload: Pick<Review, 'name' | 'rating' | 'quote'>) => Promise<Review>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<Booking | null>;
  updateBookingDeposit: (bookingId: string, depositAmount: number) => Promise<Booking | null>;
  updateReviewStatus: (reviewId: string, status: ReviewStatus) => Promise<Review | null>;
  deleteReview: (reviewId: string) => Promise<void>;
  removeVenue: (venueId: string) => Promise<void>;
  saveVenue: (draft: VenueDraft, venueId?: string) => Promise<Venue>;
  savePackages: (packages: AccommodationPackage[]) => Promise<void>;
  saveRooms: (rooms: AccommodationRoom[]) => Promise<void>;
  saveAddOns: (addOns: AdditionalAddOn[]) => Promise<void>;
  saveInventoryItems: (inventoryItems: InventoryItem[]) => Promise<void>;
  saveInventoryState: (inventoryItems: InventoryItem[], inventoryTransactions: InventoryTransaction[]) => Promise<void>;
  getSlotStatus: (venueId: string, date: string, slotId: string, requiresWholeProperty?: boolean) => SlotStatus;
  resetData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState(() => {
    const initialData = loadAppData();
    return { ...initialData, inventoryItems: removeLegacyRoomInventoryItems(initialData.inventoryItems) };
  });

  useEffect(() => {
    saveAppData(snapshot);
  }, [snapshot]);

  useEffect(() => {
    let isMounted = true;

    appDataService.getSnapshot()
      .then((serverSnapshot) => {
        if (isMounted) {
          const localSnapshot = loadAppData();
          const hasUnsyncedLocalBookings = localSnapshot.bookings.some(
            (booking) => !serverSnapshot.bookings.some((serverBooking) => serverBooking.id === booking.id),
          );
          const hasUnsyncedLocalInventory = localSnapshot.inventoryItems.some(
            (item) => !serverSnapshot.inventoryItems.some((serverItem) => serverItem.id === item.id),
          );

          if (hasUnsyncedLocalBookings || hasUnsyncedLocalInventory) {
            void appDataService.syncLocalSnapshot(localSnapshot)
              .then((syncedSnapshot) => {
                if (isMounted) {
                  setSnapshot({ ...syncedSnapshot, inventoryItems: removeLegacyRoomInventoryItems(syncedSnapshot.inventoryItems) });
                }
              })
              .catch((error) => {
                console.warn('Unable to sync local booking data to the backend.', error);
                if (isMounted) {
                  setSnapshot({ ...serverSnapshot, inventoryItems: removeLegacyRoomInventoryItems(serverSnapshot.inventoryItems) });
                }
              });
            return;
          }

          setSnapshot({ ...serverSnapshot, inventoryItems: removeLegacyRoomInventoryItems(serverSnapshot.inventoryItems) });
        }
      })
      .catch((error) => {
        console.warn('Using local fallback data because the backend is unavailable.', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseRealtimeConfigured()) {
      return undefined;
    }

    return subscribeToAppDataSnapshot((nextSnapshot) => {
      setSnapshot({ ...nextSnapshot, inventoryItems: removeLegacyRoomInventoryItems(nextSnapshot.inventoryItems) });
    });
  }, []);

  const value = useMemo<AppDataContextValue>(() => ({
    bookings: snapshot.bookings,
    notifications: snapshot.notifications,
    reviews: snapshot.reviews,
    venues: snapshot.venues,
    packages: snapshot.packages,
    rooms: snapshot.rooms,
    addOns: snapshot.addOns,
    inventoryItems: snapshot.inventoryItems,
    inventoryTransactions: snapshot.inventoryTransactions,
    adminStats: buildAdminStats(snapshot),
    customerStats: buildCustomerStats(snapshot, DEMO_CUSTOMER.email),
    createBooking: async (payload) => {
      const { booking, notification } = await appDataService.createBooking(payload);
      setSnapshot((current) => ({
        ...current,
        bookings: [booking, ...current.bookings],
        notifications: [notification, ...current.notifications],
      }));
      return booking;
    },
    markAdminNotificationsRead: () => {
      const readAt = new Date().toISOString();
      setSnapshot((current) => ({
        ...current,
        notifications: current.notifications.map((notification) => (
          notification.readAt ? notification : { ...notification, readAt }
        )),
      }));
      void appDataService.markNotificationsRead()
        .then((notifications) => setSnapshot((current) => ({ ...current, notifications })))
        .catch((error) => console.warn('Unable to persist notification read state.', error));
    },
    createReview: async (payload) => {
      const review = await appDataService.createReview(payload);
      setSnapshot((current) => ({ ...current, reviews: [review, ...current.reviews] }));
      return review;
    },
    updateBookingStatus: async (bookingId, status) => {
      const currentBooking = snapshot.bookings.find((booking) => booking.id === bookingId);
      if (currentBooking && currentBooking.status !== status) {
        setSnapshot((current) => ({
          ...current,
          bookings: current.bookings.map((booking) => (
            booking.id === bookingId ? { ...booking, status } : booking
          )),
        }));
      }
      let updatedBooking: Booking;
      try {
        updatedBooking = await appDataService.updateBooking(bookingId, { status });
      } catch (error) {
        await appDataService.syncLocalSnapshot(loadAppData());
        updatedBooking = await appDataService.updateBooking(bookingId, { status });
      }
      try {
        const refreshedSnapshot = await appDataService.getSnapshot();
        setSnapshot({ ...refreshedSnapshot, inventoryItems: removeLegacyRoomInventoryItems(refreshedSnapshot.inventoryItems) });
      } catch (error) {
        console.warn('Booking status saved, but the latest inventory snapshot could not be loaded.', error);
        setSnapshot((current) => ({
          ...current,
          bookings: current.bookings.map((booking) => (booking.id === bookingId ? updatedBooking : booking)),
        }));
      }
      return updatedBooking;
    },
    updateBookingDeposit: async (bookingId, depositAmount) => {
      const updatedBooking = await appDataService.updateBooking(bookingId, { depositAmount });
      setSnapshot((current) => ({
        ...current,
        bookings: current.bookings.map((booking) => (booking.id === bookingId ? updatedBooking : booking)),
      }));
      return updatedBooking;
    },
    updateReviewStatus: async (reviewId, status) => {
      const updatedReview = await appDataService.updateReviewStatus(reviewId, status);
      setSnapshot((current) => ({
        ...current,
        reviews: current.reviews.map((review) => (review.id === reviewId ? updatedReview : review)),
      }));
      return updatedReview;
    },
    deleteReview: async (reviewId) => {
      await appDataService.deleteReview(reviewId);
      setSnapshot((current) => ({
        ...current,
        reviews: current.reviews.filter((review) => review.id !== reviewId),
      }));
    },
    removeVenue: async (venueId) => {
      await appDataService.deleteVenue(venueId);
      setSnapshot((current) => ({
        ...current,
        venues: current.venues.filter((venue) => venue.id !== venueId),
      }));
    },
    saveVenue: async (draft, venueId) => {
      const venue = await appDataService.saveVenue(draft, venueId);
      setSnapshot((current) => ({
        ...current,
        venues: current.venues.some((item) => item.id === venue.id)
          ? current.venues.map((item) => (item.id === venue.id ? venue : item))
          : [venue, ...current.venues],
      }));
      return venue;
    },
    savePackages: async (packages) => {
      const savedPackages = await appDataService.savePackages(packages);
      setSnapshot((current) => ({ ...current, packages: savedPackages }));
    },
    saveRooms: async (rooms) => {
      const savedRooms = await appDataService.saveRooms(rooms);
      setSnapshot((current) => ({ ...current, rooms: savedRooms }));
    },
    saveAddOns: async (addOns) => {
      const savedAddOns = await appDataService.saveAddOns(addOns);
      setSnapshot((current) => ({ ...current, addOns: savedAddOns }));
    },
    saveInventoryItems: async (inventoryItems) => {
      try {
        const savedInventoryItems = await appDataService.saveInventoryItems(inventoryItems);
        setSnapshot((current) => ({ ...current, inventoryItems: savedInventoryItems }));
      } catch (error) {
        console.warn('Unable to persist inventory items to the backend. Saving locally instead.', error);
        setSnapshot((current) => ({ ...current, inventoryItems }));
      }
    },
    saveInventoryState: async (inventoryItems, inventoryTransactions) => {
      try {
        const savedSnapshot = await appDataService.saveInventoryState(inventoryItems, inventoryTransactions);
        setSnapshot((current) => ({
          ...current,
          inventoryItems: savedSnapshot.inventoryItems,
          inventoryTransactions: savedSnapshot.inventoryTransactions,
        }));
      } catch (error) {
        console.warn('Unable to persist inventory stock out to the backend. Saving locally instead.', error);
        setSnapshot((current) => ({
          ...current,
          inventoryItems,
          inventoryTransactions,
        }));
      }
    },
    getSlotStatus: (venueId, date, slotId, requiresWholeProperty) => getSlotStatusFromSnapshot(snapshot, venueId, date, slotId, requiresWholeProperty),
    resetData: () => {
      void appDataService.resetData()
        .then(setSnapshot)
        .catch((error) => console.warn('Unable to reset backend data.', error));
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
