import type { Booking, StatCardItem } from '@/types';

export const bookings: Booking[] = [];

export const customerStats: StatCardItem[] = [
  { id: 'c1', label: 'Active bookings', value: '3', change: '+1 this month', trend: 'up' },
  { id: 'c2', label: 'Upcoming events', value: '2', change: 'Next in 18 days', trend: 'neutral' },
  { id: 'c3', label: 'Past bookings', value: '7', change: 'Reliable booking history', trend: 'up' },
];

export const adminStats: StatCardItem[] = [
  { id: 'a1', label: 'Total bookings', value: '126', change: '+18.4% vs last month', trend: 'up' },
  { id: 'a2', label: 'Venue utilization', value: '84%', change: '+6% this week', trend: 'up' },
  { id: 'a3', label: 'Pending approvals', value: '09', change: 'Needs attention today', trend: 'neutral' },
  { id: 'a4', label: 'Projected revenue', value: 'PHP 1.24M', change: '+12% trend', trend: 'up' },
];
