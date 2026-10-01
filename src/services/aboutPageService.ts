import { apiRequest } from '@/services/api';
import type { AboutPageContent } from '@/types';

export const aboutPageService = {
  getContent: async () => apiRequest<AboutPageContent>('/api/about'),
};
