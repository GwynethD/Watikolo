import { apiRequest } from '@/services/api';
import type { HomePageContent } from '@/types';

export const homePageService = {
  getContent: async () => apiRequest<HomePageContent>('/api/home'),
};
