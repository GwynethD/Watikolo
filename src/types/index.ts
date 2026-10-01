export type VenueType = 'Ballroom' | 'Garden' | 'Conference Hall' | 'Rooftop' | 'Private Hall';
export type SlotStatus = 'available' | 'reserved' | 'booked';
export type BookingStatus = 'pending' | 'approved' | 'completed' | 'cancelled' | 'rejected';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type ReviewProvider = 'google' | 'facebook' | 'tripadvisor' | 'direct';
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
  bookingMode?: 'package' | 'room';
  packageName?: string;
  packageIndex?: number;
  roomAddOns?: string[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  timeSlotId: string;
  timeSlotLabel: string;
  preferredStartTime?: string;
  guests: number;
  eventType: EventType;
  totalPrice: number;
  depositAmount?: number;
  paymentReferenceNumber?: string;
  bookingPolicyAccepted?: boolean;
  paymentProofName?: string;
  paymentProofUrl?: string;
  paymentProofPath?: string;
  status: BookingStatus;
  createdAt: string;
  notes?: string;
}

export type InventoryStatus = 'available' | 'low-stock' | 'out-of-stock' | 'under-maintenance';
export type InventoryItemType = 'consumable' | 'reusable';
export type StockOutReason = 'Booking/Event' | 'Room Use' | 'Cleaning' | 'Damaged' | 'Other';
export type InventoryTransactionType = 'stock-in' | 'stock-out' | 'issue' | 'return' | 'damaged' | 'adjustment';
export type InventoryTransactionReason = StockOutReason | 'Restock' | 'Supplier Delivery' | 'Correction' | 'Returned' | 'Maintenance Return' | 'Adjustment' | 'Archived';

export interface InventoryItem {
  id: string;
  room_id: string;
  name: string;
  category: string;
  itemType?: InventoryItemType;
  totalQuantity: number;
  availableQuantity: number;
  inUseQuantity: number;
  damagedQuantity: number;
  quantity?: number;
  unit: string;
  reorderLevel: number;
  location: string;
  underMaintenance?: boolean;
  archived?: boolean;
  archivedAt?: string;
  notes?: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: InventoryTransactionType;
  quantity: number;
  previousQuantity?: number;
  newQuantity?: number;
  bookingReference?: string;
  performedBy?: string;
  reason: InventoryTransactionReason;
  notes?: string;
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  type: 'booking';
  title: string;
  message: string;
  bookingId?: string;
  createdAt: string;
  readAt?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  provider: ReviewProvider;
  status: ReviewStatus;
  createdAt: string;
  quote: string;
}

export interface StatCardItem {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface AboutPageContent {
  heroImage: string;
  sections: Array<{
    id: string;
    title: string;
    paragraphs: string[];
  }>;
  bookingPolicy: string[];
  walkInPolicy: string[];
}

export interface HomePageContent {
  sections: Array<{
    id: string;
    title: string;
    subtitle?: string;
    paragraphs: string[];
    eventItems?: string[];
    stayItems?: string[];
  }>;
  venueCards: Array<{
    title: string;
    price: string;
    description: string;
  }>;
  roomCards: Array<{
    title: string;
    price: string;
    description: string;
  }>;
  reviews: Array<{
    name: string;
    avatar: string;
    rating: string;
    quote: string;
  }>;
  contact: {
    address: string;
    phone: string;
    mapUrl: string;
  };
}

export type ContactInquiryStatus = 'new' | 'read' | 'resolved';

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: ContactInquiryStatus;
  createdAt: string;
}

export interface ContactInquiryFormValues {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
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
  preferredStartTime?: string;
  eventType: EventType;
  guests: number;
  bookingMode?: 'package' | 'room';
  packageName?: string;
  packageIndex?: number;
  roomAddOns?: string[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  totalPrice?: number;
  depositAmount?: number;
  paymentReferenceNumber?: string;
  bookingPolicyAccepted?: boolean;
  paymentProofName?: string;
  paymentProofUrl?: string;
  paymentProofPath?: string;
}
