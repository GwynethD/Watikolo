import type { TimeSlot } from '@/types';

export const baseTimeSlots: TimeSlot[] = [
  {
    id: 'slot-morning',
    label: '8:00 AM - 12:00 PM',
    start: '08:00',
    end: '12:00',
    status: 'available',
  },
  {
    id: 'slot-afternoon',
    label: '1:00 PM - 5:00 PM',
    start: '13:00',
    end: '17:00',
    status: 'reserved',
  },
  {
    id: 'slot-evening',
    label: '6:00 PM - 10:00 PM',
    start: '18:00',
    end: '22:00',
    status: 'booked',
  },
];
