import type { NavItem } from '@/types';

export const publicNavItems: NavItem[] = [
  { label: 'HOME', path: '/' },
  { label: 'ABOUT', path: '/about' },
  { label: 'ACCOMMODATIONS', path: '/venues' },
  { label: 'THINGS TO DO', path: '/things-to-do' },
  { label: 'GALLERY', path: '/gallery' },
  { label: 'GUEST REVIEWS', path: '/guest-reviews' },
  { label: 'CONTACT', path: '/contact' },
];

export const adminSidebarItems: NavItem[] = [
  { label: 'Overview', path: '/admin' },
  { label: 'Venues', path: '/admin/venues' },
  { label: 'Bookings', path: '/admin/bookings' },
  { label: 'Inventory', path: '/admin/inventory' },
  { label: 'Inventory Reports', path: '/admin/inventory-reports' },
  { label: 'Reviews', path: '/admin/reviews' },
  { label: 'Schedule', path: '/admin/schedule' },
  { label: 'Reports', path: '/admin/reports' },
];

export const bookingSteps = ['Event details', 'Schedule', 'Contact', 'Review'];
