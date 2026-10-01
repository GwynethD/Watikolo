import { appDataService } from '@/services/appDataService';
import type { BookingFormValues } from '@/types';

export const bookingService = {
  getAll: async () => (await appDataService.getSnapshot()).bookings,
  create: async (payload: BookingFormValues) => (await appDataService.createBooking(payload)).booking,
};
