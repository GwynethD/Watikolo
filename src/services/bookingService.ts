import { simulateRequest } from '@/services/api';
import { createBooking as createBookingRecord, loadAppData } from '@/services/localDb';
import type { BookingFormValues } from '@/types';

export const bookingService = {
  getAll: async () => simulateRequest(loadAppData().bookings),
  create: async (payload: BookingFormValues) => simulateRequest(createBookingRecord(loadAppData(), payload)),
};
