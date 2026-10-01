import { apiRequest } from '@/services/api';
import type { AccommodationPackage } from '@/mock/accommodationPackages';
import type { AccommodationRoom } from '@/mock/accommodationRooms';
import type { AdditionalAddOn } from '@/mock/additionalAddOns';
import type {
  AdminNotification,
  Booking,
  BookingFormValues,
  BookingStatus,
  InventoryItem,
  InventoryTransaction,
  Review,
  ReviewStatus,
  Venue,
  VenueDraft,
} from '@/types';
import type { AppDataSnapshot } from '@/services/localDb';

export const appDataService = {
  getSnapshot: () => apiRequest<AppDataSnapshot>('/api/app-data'),
  syncLocalSnapshot: (snapshot: AppDataSnapshot) => apiRequest<AppDataSnapshot>('/api/app-data/sync-local', {
    method: 'POST',
    body: JSON.stringify(snapshot),
  }),
  createBooking: (payload: BookingFormValues) => apiRequest<{ booking: Booking; notification: AdminNotification }>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getPaymentProofSignedUrl: (paymentProofPath: string) => apiRequest<{ signedUrl: string }>(`/api/payment-proofs/signed-url?path=${encodeURIComponent(paymentProofPath)}`),
  updateBooking: (bookingId: string, payload: Partial<Pick<Booking, 'depositAmount' | 'status'>>) => apiRequest<Booking>(`/api/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  createReview: (payload: Pick<Review, 'name' | 'rating' | 'quote'>) => apiRequest<Review>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateReviewStatus: (reviewId: string, status: ReviewStatus) => apiRequest<Review>(`/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  deleteReview: (reviewId: string) => apiRequest<{ ok: boolean }>(`/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
  }),
  saveVenue: (draft: VenueDraft, venueId?: string) => apiRequest<Venue>(venueId ? `/api/venues/${encodeURIComponent(venueId)}` : '/api/venues', {
    method: venueId ? 'PUT' : 'POST',
    body: JSON.stringify(draft),
  }),
  deleteVenue: (venueId: string) => apiRequest<{ ok: boolean }>(`/api/venues/${encodeURIComponent(venueId)}`, {
    method: 'DELETE',
  }),
  savePackages: (packages: AccommodationPackage[]) => apiRequest<AccommodationPackage[]>('/api/packages', {
    method: 'PUT',
    body: JSON.stringify(packages),
  }),
  saveRooms: (rooms: AccommodationRoom[]) => apiRequest<AccommodationRoom[]>('/api/rooms', {
    method: 'PUT',
    body: JSON.stringify(rooms),
  }),
  saveAddOns: (addOns: AdditionalAddOn[]) => apiRequest<AdditionalAddOn[]>('/api/add-ons', {
    method: 'PUT',
    body: JSON.stringify(addOns),
  }),
  saveInventoryItems: (inventoryItems: InventoryItem[]) => apiRequest<InventoryItem[]>('/api/inventory', {
    method: 'PUT',
    body: JSON.stringify(inventoryItems),
  }),
  saveInventoryState: (inventoryItems: InventoryItem[], inventoryTransactions: InventoryTransaction[]) => apiRequest<AppDataSnapshot>('/api/inventory-state', {
    method: 'PUT',
    body: JSON.stringify({ inventoryItems, inventoryTransactions }),
  }),
  markNotificationsRead: () => apiRequest<AdminNotification[]>('/api/notifications/mark-read', {
    method: 'POST',
  }),
  resetData: () => apiRequest<AppDataSnapshot>('/api/reset-data', {
    method: 'POST',
  }),
};
