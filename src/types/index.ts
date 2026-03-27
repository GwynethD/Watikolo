export type VenueType = 'Ballroom' | 'Garden' | 'Conference Hall' | 'Rooftop' | 'Private Hall';
export type SlotStatus = 'available' | 'reserved' | 'booked';
export type BookingStatus = 'pending' | 'approved' | 'completed' | 'cancelled' | 'rejected';
export type EventType = 'Wedding' | 'Corporate' | 'Birthday' | 'Debut' | 'Conference' | 'Other';

export interface TimeSlot {
  id: string;
  label: string;
  start: string;
  end: string;
  status: SlotStatus;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  type: VenueType;
  location: string;
  price: number;
  capacity: number;
  rating: number;
  shortDescription: string;
  description: string;
  amenities: string[];
  eventTypes: EventType[];
  heroImage: string;
  gallery: string[];
  featured?: boolean;
  availabilityText: string;
  availability: 'Open this week' | 'Limited availability' | 'Peak season';
}

export interface VenueDraft {
  name: string;
  type: VenueType;
  location: string;
  price: number;
  capacity: number;
  shortDescription: string;
  description: string;
  amenities: string[];
  eventTypes: EventType[];
  heroImage: string;
  gallery: string[];
  featured?: boolean;
  availabilityText: string;
  availability: Venue['availability'];
  rating?: number;
}

export interface Booking {
  id: string;
  reference: string;
  venueId: string;
  venueName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  timeSlotId: string;
  timeSlotLabel: string;
  guests: number;
  eventType: EventType;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  notes?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
}

export interface StatCardItem {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
}

export interface SearchFilters {
  query: string;
  venueType: string;
  availability: string;
  sortBy: string;
  minCapacity: string;
  maxPrice: string;
}

export interface BookingFormValues {
  venueId: string;
  date: string;
  timeSlotId: string;
  eventType: EventType;
  guests: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
}
