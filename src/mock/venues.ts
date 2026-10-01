import type { Testimonial, Venue } from '@/types';

const roomOneImage = new URL('../pictures/room1.jpg', import.meta.url).href;
const roomTwoImage = new URL('../pictures/room2.jpg', import.meta.url).href;
const roomThreeImage = new URL('../pictures/room3.jpg', import.meta.url).href;
const villaImage = new URL('../pictures/villa.png', import.meta.url).href;
const poolImage = new URL('../pictures/w-pool.png', import.meta.url).href;
const mainImage = new URL('../pictures/watikolo-main.png', import.meta.url).href;
const homeImage = new URL('../pictures/watikolo-home.png', import.meta.url).href;
const functionImage = new URL('../pictures/watikolo-function.png', import.meta.url).href;
const longPoolImage = new URL('../pictures/watikolo-lpool.png', import.meta.url).href;
const exteriorImage = new URL('../pictures/outside.png', import.meta.url).href;
const exteriorOneImage = new URL('../pictures/outside1.png', import.meta.url).href;
const exteriorTwoImage = new URL('../pictures/outside2.png', import.meta.url).href;
const gardenImage = new URL('../pictures/nature.jpg', import.meta.url).href;
const gardenAltImage = new URL('../pictures/nature1.jpg', import.meta.url).href;
const spaceImage = new URL('../pictures/space.jpg', import.meta.url).href;
const balconyImage = new URL('../pictures/balcony.jpg', import.meta.url).href;
const eventImage = new URL('../pictures/function.png', import.meta.url).href;
const eventAltImage = new URL('../pictures/function1.png', import.meta.url).href;
const highlightImage = new URL('../pictures/watikolo-2.png', import.meta.url).href;

export const venues: Venue[] = [
  {
    id: 'venue-1',
    name: 'The Grand Atrium',
    slug: 'the-grand-atrium',
    type: 'Ballroom',
    location: 'Tagum City, Davao del Norte',
    price: 85000,
    capacity: 280,
    rating: 4.9,
    shortDescription: 'A refined ballroom for elegant weddings, galas, and milestone celebrations.',
    description:
      'The Grand Atrium pairs sweeping chandeliers with flexible floor planning, giving clients a premium setting for luxurious events without sacrificing convenience.',
    amenities: ['LED wall', 'Air-conditioned hall', 'VIP lounge', 'Bridal suite', 'Catering prep area'],
    eventTypes: ['Wedding', 'Debut', 'Birthday', 'Corporate'],
    heroImage: roomOneImage,
    gallery: [roomTwoImage, roomThreeImage, homeImage],
    featured: true,
    availabilityText: '3 premium slots left this week',
    availability: 'Limited availability',
  },
  {
    id: 'venue-2',
    name: 'Lakeside Pavilion',
    slug: 'lakeside-pavilion',
    type: 'Garden',
    location: 'Panabo City, Davao del Norte',
    price: 62000,
    capacity: 180,
    rating: 4.8,
    shortDescription: 'An open-air venue framed by lush greenery and soft evening lights.',
    description:
      'Lakeside Pavilion is built for intimate celebrations and romantic ceremonies, with a scenic garden aisle and flexible styling zones.',
    amenities: ['Garden aisle', 'Tent-ready lawn', 'Parking area', 'Sound-ready stage', 'Photo garden'],
    eventTypes: ['Wedding', 'Birthday', 'Debut', 'Other'],
    heroImage: poolImage,
    gallery: [gardenImage, gardenAltImage, longPoolImage],
    featured: true,
    availabilityText: 'Open for weekday reservations',
    availability: 'Open this week',
  },
  {
    id: 'venue-3',
    name: 'Skyline Terrace',
    slug: 'skyline-terrace',
    type: 'Rooftop',
    location: 'Davao City',
    price: 74000,
    capacity: 150,
    rating: 4.7,
    shortDescription: 'A rooftop venue with city lights, curated cocktails, and sunset-ready views.',
    description:
      'Skyline Terrace is tailored for stylish evening functions, engagement parties, corporate mixers, and intimate receptions.',
    amenities: ['Sunset deck', 'Bar counter', 'Photo wall', 'Ambient lighting', 'Projector setup'],
    eventTypes: ['Corporate', 'Birthday', 'Wedding', 'Other'],
    heroImage: villaImage,
    gallery: [mainImage, exteriorOneImage, exteriorTwoImage],
    featured: true,
    availabilityText: 'Peak season demand',
    availability: 'Peak season',
  },
  {
    id: 'venue-4',
    name: 'Crestview Hall',
    slug: 'crestview-hall',
    type: 'Conference Hall',
    location: 'Tagum City, Davao del Norte',
    price: 54000,
    capacity: 220,
    rating: 4.6,
    shortDescription: 'A polished venue for forums, seminars, launches, and company gatherings.',
    description:
      'Crestview Hall combines business-ready facilities with a warm guest experience, making it ideal for workshops and branded events.',
    amenities: ['Stage lighting', 'Built-in audio', 'Breakout room', 'Fiber internet', 'Registration foyer'],
    eventTypes: ['Corporate', 'Conference', 'Other'],
    heroImage: functionImage,
    gallery: [eventAltImage, spaceImage, balconyImage],
    availabilityText: 'Open for next week bookings',
    availability: 'Open this week',
  },
  {
    id: 'venue-5',
    name: 'Ivory Manor',
    slug: 'ivory-manor',
    type: 'Private Hall',
    location: 'Panabo City, Davao del Norte',
    price: 48000,
    capacity: 120,
    rating: 4.7,
    shortDescription: 'A boutique private hall designed for intimate milestones and curated gatherings.',
    description:
      'Ivory Manor offers warm interiors, elegant table layouts, and a private atmosphere perfect for bespoke events and family celebrations.',
    amenities: ['Private ingress', 'Prep kitchen', 'Lounge corner', 'Stage riser', 'Ambient lighting'],
    eventTypes: ['Birthday', 'Debut', 'Wedding', 'Other'],
    heroImage: homeImage,
    gallery: [highlightImage, exteriorImage, functionImage],
    availabilityText: 'Weekend slots filling up',
    availability: 'Limited availability',
  },
  {
    id: 'venue-6',
    name: 'Poolside Garden',
    slug: 'poolside-garden',
    type: 'Garden',
    location: 'Purok 4 Upper Puntod Road, Tabalong, Dauis, Bohol',
    price: 45000,
    capacity: 160,
    rating: 4.8,
    shortDescription: 'A relaxed poolside garden venue for birthdays, family gatherings, and intimate celebrations.',
    description:
      'Poolside Garden gives guests a bright outdoor setting beside the pool, with flexible table layouts and easy access to the main house amenities.',
    amenities: ['Poolside setup', 'Garden tables', 'Parking area', 'Photo spots', 'Outdoor lounge'],
    eventTypes: ['Birthday', 'Debut', 'Wedding', 'Other'],
    heroImage: longPoolImage,
    gallery: [poolImage, gardenImage, exteriorTwoImage],
    featured: true,
    availabilityText: 'Available for daytime use',
    availability: 'Open this week',
  },
];

export const testimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    name: 'Angela Mercado',
    role: 'Bride',
    quote: 'The time slot preview made planning easier. We knew exactly which schedule worked before even sending an inquiry.',
  },
  {
    id: 'testimonial-2',
    name: 'Marc Dela Cruz',
    role: 'Corporate Events Lead',
    quote: 'The venue cards felt premium and clear. It was easy to compare capacity, rates, and amenities in minutes.',
  },
  {
    id: 'testimonial-3',
    name: 'Jessa Aquino',
    role: 'Birthday Celebrant',
    quote: 'The booking flow looked polished and simple. For a demo, it already feels like a real booking platform.',
  },
];
