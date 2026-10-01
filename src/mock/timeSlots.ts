import type { TimeSlot } from '@/types';

export const baseTimeSlots: TimeSlot[] = [
  {
    id: 'slot-daytime',
    label: 'Daytime Use (8 Hours)',
    start: '08:00',
    end: '16:00',
    status: 'available',
  },
  {
    id: 'slot-nighttime',
    label: 'Night Use (5 Hours)',
    start: '17:30',
    end: '22:30',
    status: 'reserved',
  },
];
