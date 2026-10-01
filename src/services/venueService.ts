import { appDataService } from '@/services/appDataService';

export const venueService = {
  getAll: async () => (await appDataService.getSnapshot()).venues,
  getById: async (id: string) => (await appDataService.getSnapshot()).venues.find((venue) => venue.id === id) ?? null,
};
