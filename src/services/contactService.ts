import { apiRequest } from '@/services/api';
import type { ContactInquiry, ContactInquiryFormValues } from '@/types';

export const contactService = {
  create: async (payload: ContactInquiryFormValues) => apiRequest<ContactInquiry>('/api/contact-inquiries', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};
