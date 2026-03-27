import { simulateRequest } from '@/services/api';
import { loadAppData } from '@/services/localDb';

export const venueService = {
  getAll: async () => simulateRequest(loadAppData().venues),
  getById: async (id: string) => simulateRequest(loadAppData().venues.find((venue) => venue.id === id) ?? null),
};
