import { simulateRequest } from '@/services/api';
import { buildAdminStats, loadAppData } from '@/services/localDb';

export const reportService = {
  getSummary: async () => simulateRequest(buildAdminStats(loadAppData())),
};
