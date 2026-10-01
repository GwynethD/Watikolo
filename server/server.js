import { createServer } from 'node:http';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { defaultAppData } from './defaultData.js';
import { sendBookingEmail } from './emailService.js';
import { serveWebsite } from './website.js';
import {
  createSupabasePaymentProofSignedUrl,
  isSupabaseConfigured,
  readSupabaseAdminSessions,
  readSupabaseAdminUsers,
  readSupabaseAppData,
  readSupabaseInquiries,
  saveSupabaseAdminSessions,
  saveSupabaseAdminUsers,
  saveSupabaseAppData,
  saveSupabaseInquiries,
  uploadSupabasePaymentProof,
} from './supabaseStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function loadEnvFile() {
  try {
    const contents = readFileSync(path.join(rootDir, '.env'), 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split('=');
      if (!process.env[key]) {
        process.env[key] = valueParts.join('=').trim();
      }
    }
  } catch {
    // Local development can run without a .env file; email sending will be skipped.
  }
}

loadEnvFile();

const isProduction = process.env.NODE_ENV === 'production';
const host = process.env.HOST ?? (isProduction ? '0.0.0.0' : '127.0.0.1');
const port = Number(process.env.PORT ?? 3001);
const useSupabase = isSupabaseConfigured();
if (isProduction && !useSupabase) {
  throw new Error('Production requires Supabase persistence. Configure SUPABASE_URL and SUPABASE_SECRET_KEY.');
}
if (isProduction && (!process.env.ADMIN_PASSWORD || ['admin123', 'change_this_before_production'].includes(process.env.ADMIN_PASSWORD))) {
  throw new Error('Set a unique ADMIN_PASSWORD before starting production.');
}
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://watikolo.com:5173',
  'http://watikolo.localhost:5173',
]);
const dataDir = path.join(__dirname, 'data');
const inquiriesPath = path.join(dataDir, 'contact-inquiries.json');
const appDataPath = path.join(dataDir, 'app-data.json');
const adminUsersPath = path.join(dataDir, 'admin-users.json');
const adminSessionsPath = path.join(dataDir, 'admin-sessions.json');
const scrypt = promisify(scryptCallback);
const baseTimeSlots = [
  { id: 'slot-daytime', label: 'Daytime Use (8 Hours)' },
  { id: 'slot-nighttime', label: 'Night Use (5 Hours)' },
];

const aboutPageContent = {
  heroImage: '/src/pictures/villa.png',
  sections: [
    {
      id: 'sanctuary',
      title: 'Welcome to Your Sanctuary: Why Choose Watikolo for Your Next Stay?',
      paragraphs: [
        'Watikolo is a uniquely coined name, created to sound warm, tropical, and unforgettable. Though it has no official dictionary meaning, its rhythm gently echoes the calm of flowing water and the serenity of an island breeze. Because it is an invented name, Watikolo holds the freedom to define its own story - a story of comfort, connection, and meaningful escapes.',
        'It represents a sanctuary where moments slow down and life feels lighter - a place where laughter fills open spaces, celebrations become timeless memories, and quiet mornings bring a sense of renewal. At Watikolo, every stay is designed to feel personal and sincere, blending privacy, nature, and thoughtful hospitality into one harmonious experience.',
        'More than just a destination, it is a feeling - one that welcomes you, embraces you, and invites you to return again and again. We warmly invite you to experience Watikolo - to celebrate, unwind, and simply feel at home. Your unforgettable stay awaits.',
      ],
    },
    {
      id: 'peaceful-private',
      title: 'Peaceful & Private',
      paragraphs: [
        'Thoughtfully set away from the busy crowds and city noise, Watikolo offers an exclusive space where your celebrations can unfold in comfort and privacy. Surrounded by open skies, tropical greenery, and a serene atmosphere, our venue creates the perfect backdrop for intimate gatherings and unforgettable occasions.',
        "We take pride in creating an environment where you can feel completely at ease. Our attentive staff is always on hand to ensure your needs are met while respecting your privacy. Whether you're here for a romantic escape, a family vacation, or a solo retreat, Watikolo offers the perfect blend of comfort and seclusion for an unforgettable stay.",
      ],
    },
    {
      id: 'celebration-space',
      title: 'Your Exclusive Celebration Space',
      paragraphs: [
        'Watikolo offers beautifully curated spaces where guests can gather, celebrate, and relax. Each area provides private dining, comfortable lounges, and modern amenities, creating the perfect setting for memorable occasions.',
      ],
    },
    {
      id: 'designed-spaces',
      title: 'Thoughtfully Designed Spaces',
      paragraphs: [
        'Watikolo is more than just a venue - it is a place where moments become lasting memories. From intimate gatherings to grand celebrations, every corner is thoughtfully designed to bring people together in a beautiful and relaxing setting.',
        "Whether you're celebrating milestones or simply enjoying time with loved ones, Watikolo provides a space where every experience feels special, meaningful, and unforgettable.",
      ],
    },
    {
      id: 'service',
      title: 'Hospitable & Attentive Service',
      paragraphs: [
        'At Watikolo, our team takes pride in creating a welcoming and seamless experience for every event. Our attentive staff are always ready to assist, ensuring that every detail is carefully prepared so you can focus on celebrating and enjoying your special occasion.',
        "From personalized event planning to on-site support, we are dedicated to making your experience at Watikolo truly unforgettable. Whether you're hosting an intimate gathering or a grand celebration, our hospitable service is designed to make you and your guests feel cared for and valued throughout your stay.",
      ],
    },
  ],
  bookingPolicy: [
    'Advance booking is highly recommended to secure your preferred date.',
    'Reservations are confirmed once payment or required deposit is completed.',
    'Guests receive booking confirmation and stay details after approval.',
    'Rebooking is subject to availability.',
  ],
  walkInPolicy: [
    'Walk-ins are welcome depending on availability.',
    'Guests must register at the entrance before accessing the venue.',
    'Rates and access may vary during peak dates and special events.',
    'Management reserves the right to decline entry if capacity is full.',
  ],
};

const homePageContent = {
  sections: [
    {
      id: 'about',
      title: "Watikolo Event Venue - The Perfect Place for Life's Finest Celebrations",
      paragraphs: [
        "Watikolo Event Venue Rental, located in Purok 4 Upper Puntod Road, Tabalong, Dauis, Bohol, is a charming and exclusive event space designed to host life's most meaningful celebrations. A private destination where unforgettable moments come to life, inspired by elegance, warmth, and the joy of gathering together.",
        'With the comfort of a thoughtfully designed venue, the beauty of a serene and intimate setting, and a dedicated team ready to assist you - families, friends, and colleagues can celebrate with ease and confidence. From birthdays and corporate gatherings to weddings and special milestones, Watikolo offers the perfect space to create lasting memories.',
      ],
    },
    {
      id: 'location',
      title: 'Location',
      paragraphs: [
        'Nestled in a quiet, all-natural setting at Purok 4 Upper Puntod Road, Tabalong, Dauis, Bohol, Watikolo Event Venue offers a peaceful and private environment. Its serene location makes it perfect for meaningful gatherings, special milestones, and memorable events.',
        'The venue is easy to reach for both local and out-of-town guests, making it a convenient choice for birthdays, weddings, corporate events, or family reunions. Watikolo provides a tranquil escape where you can create unforgettable memories with your loved ones.',
      ],
    },
    {
      id: 'things-to-do',
      title: 'Things To Do',
      subtitle: 'Choose the activity you need, then check the available booking options.',
      paragraphs: [],
      eventItems: [
        'Book a birthday, wedding, reunion, or private event',
        'Choose a package based on guest count',
        'Check available dates and time slots',
      ],
      stayItems: [
        'Reserve rooms for overnight stays',
        'Use the swimming pool for day or night use',
        'Add rooms or pool access to your event plans',
      ],
    },
    {
      id: 'facilities',
      title: 'Facilities',
      paragraphs: [
        'At Watikolo Event Venue Rental, we offer a complete and comfortable setting designed to make every celebration seamless, enjoyable, and unforgettable.',
      ],
    },
    {
      id: 'accommodations',
      title: 'Accommodations',
      paragraphs: [
        'Within the spacious grounds of Watikolo Event Venue Rental, guests can enjoy comfortable on-site accommodations designed to suit different group sizes and event needs. Whether for intimate gatherings or larger celebrations, our flexible room arrangements allow guests to stay conveniently within the venue.',
        "The property features three fully furnished bedrooms - two located upstairs and one on the ground floor - ideal for families, bridal parties, event organizers, or groups who wish to extend their stay. Guests also have access to the venue's amenities, including the L-shaped swimming pool, kitchen and grill area, and indoor entertainment spaces, ensuring both comfort and enjoyment throughout their visit.",
        'For exclusive bookings, the entire compound offers expansive open grounds with flexible event space, allowing you to host gatherings of various sizes. Whether for birthdays, wedding receptions, reunions, corporate outings, or private celebrations, Watikolo can accommodate large groups comfortably, depending on your event setup and requirements.',
      ],
    },
    {
      id: 'book-venue',
      title: 'Book Your Venue',
      subtitle: 'Spacious. Private. Perfect for Every Occasion.',
      paragraphs: [],
    },
    {
      id: 'book-room',
      title: 'Book Your Room',
      subtitle: 'A Peaceful Stay Within Your Celebration.',
      paragraphs: [],
    },
    {
      id: 'guest-reviews',
      title: 'Guest Review',
      paragraphs: [],
    },
  ],
  venueCards: [
    { title: 'ESSENTIAL PACKAGE', price: 'PHP 5,000.00', description: 'maximum of 30 PAX' },
    { title: 'CLASSIC PACKAGE', price: 'PHP 10,000.00', description: 'maximum of 120 PAX' },
  ],
  roomCards: [
    { title: 'WATIKOLO LUXE STAY', price: 'PHP 1,999.00', description: 'per night' },
    { title: 'WATIKOLO GRAND ROOM', price: 'PHP 2,499.00', description: 'per night' },
  ],
  reviews: [
    {
      name: 'Lyds Rod',
      avatar: 'https://i.pravatar.cc/40?img=1',
      rating: '*****',
      quote: 'We found Watikolo through our research online. Frankly, I was cautiously optimistic, but everything exceeded expectations. The place is truly amazing and peaceful...',
    },
    {
      name: 'Neil Pickford',
      avatar: 'https://i.pravatar.cc/40?img=2',
      rating: '*****',
      quote: 'Stayed here with a group and the place is tucked away nicely but still accessible. The villa is new, clean, and perfect for big groups...',
    },
    {
      name: 'Jeselle Maris Buenafe',
      avatar: 'https://i.pravatar.cc/40?img=3',
      rating: '*****',
      quote: '100/10! Everything about this place is superb. Booking was easy and the team is very responsive and accommodating...',
    },
  ],
  contact: {
    address: 'P4 Upper Puntod Road Tabalong, Dauis, Philippines',
    phone: '+63 915 874 8529',
    mapUrl: 'https://maps.app.goo.gl/ZQLSrCn1nNPaKFSW9',
  },
};

function createId() {
  return `inquiry-${Math.random().toString(36).slice(2, 10)}`;
}

function createRecordId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function dateKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function publicAdminSession(user, token, loggedInAt = new Date().toISOString()) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    loggedInAt,
    token,
  };
}

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const key = await scrypt(String(password), salt, 64);
  return {
    salt,
    passwordHash: Buffer.from(key).toString('hex'),
  };
}

async function verifyPassword(password, salt, passwordHash) {
  const key = await scrypt(String(password), salt, 64);
  const stored = Buffer.from(String(passwordHash), 'hex');
  const candidate = Buffer.from(key);

  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
}

async function readAdminUsers() {
  if (useSupabase) {
    const users = await readSupabaseAdminUsers();
    if (users.length > 0) {
      return users.map((user) => ({ ...user, email: normalizeEmail(user.email) }));
    }
  }

  try {
    const parsed = JSON.parse(await readFile(adminUsersPath, 'utf8'));
    if (Array.isArray(parsed) && parsed.length > 0) {
      const users = parsed.map((user) => ({ ...user, email: normalizeEmail(user.email) }));
      if (useSupabase) {
        await saveSupabaseAdminUsers(users);
      }
      return users;
    }
  } catch {
    // Seed below when the admin user file does not exist yet.
  }

  const email = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@watikolo.com');
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const { salt, passwordHash } = await hashPassword(password);
  const seededUsers = [
    {
      id: 'admin-1',
      name: process.env.ADMIN_NAME || 'Watikolo Super Admin',
      email,
      role: 'Super Admin',
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    },
  ];

  if (useSupabase) {
    await saveSupabaseAdminUsers(seededUsers);
    return seededUsers;
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(adminUsersPath, JSON.stringify(seededUsers, null, 2));
  return seededUsers;
}

async function readAdminSessions() {
  if (useSupabase) {
    return readSupabaseAdminSessions();
  }

  try {
    const parsed = JSON.parse(await readFile(adminSessionsPath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAdminSessions(sessions) {
  if (useSupabase) {
    await saveSupabaseAdminSessions(sessions);
    return;
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(adminSessionsPath, JSON.stringify(sessions, null, 2));
}

function getBearerToken(request) {
  const header = request.headers.authorization ?? '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? '';
}

async function getAuthenticatedAdmin(request) {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const [users, sessions] = await Promise.all([readAdminUsers(), readAdminSessions()]);
  const session = sessions.find((item) => item.token === token);
  if (!session) {
    return null;
  }

  const user = users.find((item) => item.id === session.adminId);
  return user ? { user, session } : null;
}

async function requireAdmin(request, response) {
  const auth = await getAuthenticatedAdmin(request);
  if (!auth) {
    sendJson(request, response, 401, { message: 'Admin sign-in required.' });
    return null;
  }

  return auth;
}

function createReference(bookings) {
  const numericParts = bookings
    .map((booking) => Number(String(booking.reference ?? '').split('-').pop()))
    .filter((value) => Number.isFinite(value));
  const nextNumber = (numericParts.length > 0 ? Math.max(...numericParts) : 0) + 1;
  return `WTK-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`;
}

function normalizeAppData(value) {
  const inventoryItems = (Array.isArray(value?.inventoryItems) ? value.inventoryItems : [])
    .filter((item) => !item.id?.startsWith('inventory-room-') && !item.id?.startsWith('inventory-big-room-'));
  const inventoryItemIds = new Set(inventoryItems.map((item) => item.id));
  const inventoryTransactions = (Array.isArray(value?.inventoryTransactions) ? value.inventoryTransactions : [])
    .filter((transaction) => inventoryItemIds.has(transaction.itemId));
  const missingInventoryItems = clone(defaultAppData.inventoryItems).filter((item) => !inventoryItemIds.has(item.id));
  const rooms = Array.isArray(value?.rooms)
    ? value.rooms.map((room, index) => ({
        ...room,
        id: room.id ?? defaultAppData.rooms[index]?.id ?? `room-${index + 1}`,
      }))
    : clone(defaultAppData.rooms);

  return {
    bookings: Array.isArray(value?.bookings) ? value.bookings : [],
    notifications: Array.isArray(value?.notifications) ? value.notifications : [],
    reviews: Array.isArray(value?.reviews) ? value.reviews : clone(defaultAppData.reviews),
    venues: Array.isArray(value?.venues) ? value.venues : clone(defaultAppData.venues),
    packages: Array.isArray(value?.packages) ? value.packages : clone(defaultAppData.packages),
    rooms,
    addOns: Array.isArray(value?.addOns) ? value.addOns : clone(defaultAppData.addOns),
    inventoryItems: [...inventoryItems, ...missingInventoryItems],
    inventoryTransactions,
  };
}

async function readAppData() {
  if (useSupabase) {
    const storedSnapshot = await readSupabaseAppData();
    if (storedSnapshot) {
      return normalizeAppData(storedSnapshot);
    }

    const seeded = clone(defaultAppData);
    await saveAppData(seeded);
    return seeded;
  }

  try {
    const contents = await readFile(appDataPath, 'utf8');
    return normalizeAppData(JSON.parse(contents));
  } catch {
    const seeded = clone(defaultAppData);
    await saveAppData(seeded);
    return seeded;
  }
}

async function saveAppData(snapshot) {
  if (useSupabase) {
    await saveSupabaseAppData(normalizeAppData(snapshot));
    return;
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(appDataPath, JSON.stringify(normalizeAppData(snapshot), null, 2));
}

function normalizeCustomerName(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function validateBookingPayload(payload, { isAdminBooking = false } = {}) {
  if (!(
    payload &&
    typeof payload.venueId === 'string' && payload.venueId.trim() &&
    typeof payload.date === 'string' && payload.date.trim() &&
    typeof payload.timeSlotId === 'string' && payload.timeSlotId.trim() &&
    typeof payload.customerName === 'string' && payload.customerName.trim() &&
    typeof payload.customerEmail === 'string' &&
    /^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(payload.customerEmail.trim()) &&
    typeof payload.customerPhone === 'string' && payload.customerPhone.trim() &&
    typeof payload.eventType === 'string' && payload.eventType.trim() &&
    Number.isFinite(Number(payload.guests)) && Number(payload.guests) > 0
  )) {
    return 'Venue, date, time slot, customer details, Gmail address, event type, and guest count are required.';
  }

  // Walk-in bookings are created by an authenticated admin and use a different
  // payment workflow. Public bookings must satisfy all customer payment rules.
  if (isAdminBooking) {
    return null;
  }

  const totalPrice = Number(payload.totalPrice);
  const depositAmount = Number(payload.depositAmount);
  if (!Number.isFinite(totalPrice) || totalPrice <= 0 || !Number.isFinite(depositAmount)) {
    return 'A valid booking total and payment amount are required.';
  }
  if (depositAmount < totalPrice * 0.3) {
    return 'Payment must be at least 30% of the total booking amount.';
  }
  if (typeof payload.paymentReferenceNumber !== 'string' || !payload.paymentReferenceNumber.trim()) {
    return 'Payment reference number is required.';
  }
  if (
    typeof payload.paymentProofName !== 'string' || !payload.paymentProofName.trim() ||
    typeof payload.paymentProofUrl !== 'string' || !payload.paymentProofUrl.startsWith('data:image/')
  ) {
    return 'Payment proof image is required.';
  }
  if (payload.bookingPolicyAccepted !== true) {
    return 'Booking policy acceptance is required.';
  }

  return null;
}

function isActiveBooking(booking) {
  return booking.status !== 'cancelled' && booking.status !== 'rejected';
}

function isWholePropertyPackage(booking) {
  return booking.bookingMode === 'package' && (
    booking.packageIndex === 3 ||
    booking.packageIndex === 4 ||
    booking.packageIndex === 5 ||
    booking.packageName === 'Deluxe' ||
    booking.packageName === 'Grand' ||
    booking.packageName === 'Ultimate'
  );
}

function bookingRequiresWholeProperty(payload) {
  return payload.bookingMode === 'package' && (
    Number(payload.packageIndex) >= 3 ||
    ['Deluxe', 'Grand', 'Ultimate'].includes(String(payload.packageName ?? ''))
  );
}

function selectedRoomNames(payload) {
  const rooms = Array.isArray(payload.roomAddOns) ? payload.roomAddOns : [];
  if (payload.bookingMode === 'room' && payload.packageName) {
    return [payload.packageName, ...rooms];
  }

  return rooms;
}

function addDaysToDateKey(value, days) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function bookingDateRange(booking) {
  const start = booking.date;
  if (booking.bookingMode !== 'room') {
    return { start, end: addDaysToDateKey(start, 1) };
  }

  const explicitCheckOut = booking.checkOutDate;
  const noteCheckOut = String(booking.notes ?? '').match(/check-out\s+(\d{4}-\d{2}-\d{2})/i)?.[1];
  const end = explicitCheckOut || noteCheckOut;
  return {
    start,
    end: end && end > start ? end : addDaysToDateKey(start, 1),
  };
}

function dateRangesOverlap(first, second) {
  return first.start < second.end && second.start < first.end;
}

function validateBookingAvailability(snapshot, payload) {
  const normalizedName = normalizeCustomerName(payload.customerName);
  const duplicateBooking = snapshot.bookings.find((booking) =>
    (booking.status === 'pending' || booking.status === 'approved') &&
    normalizeCustomerName(booking.customerName) === normalizedName,
  );

  if (normalizedName && duplicateBooking) {
    return `This guest name already has an active booking request (${duplicateBooking.reference}).`;
  }

  const requestedRange = bookingDateRange(payload);
  const activeBookingsDuringStay = snapshot.bookings.filter(
    (booking) => isActiveBooking(booking) && dateRangesOverlap(requestedRange, bookingDateRange(booking)),
  );

  if (bookingRequiresWholeProperty(payload) && activeBookingsDuringStay.length > 0) {
    return 'This whole-property package is unavailable because there is already a booking during the requested dates.';
  }

  if (activeBookingsDuringStay.some(isWholePropertyPackage)) {
    return 'The requested date range is unavailable because a whole-property package is already booked or reserved.';
  }

  if (payload.bookingMode === 'package') {
    const slotConflict = activeBookingsDuringStay.some(
      (booking) =>
        booking.venueId === payload.venueId &&
        booking.timeSlotId === payload.timeSlotId,
    );

    if (slotConflict) {
      return 'This time slot is unavailable for the selected venue and date.';
    }
  }

  const requestedRooms = selectedRoomNames(payload);
  const unavailableRoom = requestedRooms.find((roomName) =>
    activeBookingsDuringStay.some((booking) =>
      (booking.bookingMode === 'room' && booking.packageName === roomName) ||
      (Array.isArray(booking.roomAddOns) && booking.roomAddOns.includes(roomName)) ||
      String(booking.notes ?? '').includes(`${roomName} Room Add-on`),
    ),
  );

  if (unavailableRoom) {
    return `${unavailableRoom} is unavailable because it is already booked or included in another booking during the requested dates.`;
  }

  return null;
}

function createBooking(snapshot, payload) {
  const venue = snapshot.venues.find((item) => item.id === payload.venueId) ?? snapshot.venues[0];
  const slot = baseTimeSlots.find((item) => item.id === payload.timeSlotId);
  const timeSlotLabel = payload.timeSlotLabel ?? slot?.label ?? payload.timeSlotId;
  const totalPrice = Number.isFinite(Number(payload.totalPrice))
    ? Number(payload.totalPrice)
    : Number(venue?.price ?? 0);

  return {
    id: createRecordId('booking'),
    reference: createReference(snapshot.bookings),
    venueId: venue?.id ?? payload.venueId,
    venueName: venue?.name ?? 'Selected venue',
    bookingMode: payload.bookingMode,
    packageName: payload.packageName,
    packageIndex: payload.packageIndex,
    roomAddOns: Array.isArray(payload.roomAddOns) ? payload.roomAddOns : [],
    customerName: payload.customerName.trim(),
    customerEmail: payload.customerEmail.trim(),
    customerPhone: payload.customerPhone.trim(),
    date: payload.date,
    timeSlotId: payload.timeSlotId,
    timeSlotLabel,
    preferredStartTime: typeof payload.preferredStartTime === 'string' ? payload.preferredStartTime : undefined,
    guests: Number(payload.guests),
    eventType: payload.eventType,
    totalPrice,
    depositAmount: Number.isFinite(Number(payload.depositAmount)) ? Number(payload.depositAmount) : undefined,
    paymentReferenceNumber: typeof payload.paymentReferenceNumber === 'string' ? payload.paymentReferenceNumber.trim() : undefined,
    bookingPolicyAccepted: payload.bookingPolicyAccepted === true,
    paymentProofName: payload.paymentProofName,
    paymentProofUrl: payload.paymentProofUrl,
    paymentProofPath: payload.paymentProofPath,
    status: 'pending',
    createdAt: dateKey(),
    notes: typeof payload.notes === 'string' ? payload.notes : '',
  };
}

function createBookingNotification(booking) {
  const bookingType = booking.bookingMode === 'room' ? 'room booking' : booking.packageName === 'Pool use only' ? 'pool walk-in' : 'booking';

  return {
    id: createRecordId('notification'),
    type: 'booking',
    title: 'New booking received',
    message: `${booking.customerName} submitted ${booking.reference} for ${bookingType}.`,
    bookingId: booking.id,
    createdAt: new Date().toISOString(),
  };
}

function roomBookingInventoryQuantity(item) {
  const itemName = String(item.name ?? '').trim().toLowerCase();

  if (itemName === 'bath towels' || itemName === 'towels') {
    return 2;
  }

  return 1;
}

const sharedRoomInventoryNames = new Set([
  'air conditioner',
  'bed',
  'beds',
  'bath towels',
  'pillows',
  'soap',
  'tissues',
  'towels',
  'tv',
]);

function getRoomInventoryItems(snapshot, booking) {
  if (booking.bookingMode !== 'room' || !booking.packageName) {
    return [];
  }

  const room = snapshot.rooms.find((candidate) => candidate.name === booking.packageName);
  if (!room) {
    return [];
  }

  return snapshot.inventoryItems.filter((item) => {
    if (item.archived) {
      return false;
    }

    const itemName = String(item.name ?? '').trim().toLowerCase();
    return item.room_id === room.id || (!item.room_id && sharedRoomInventoryNames.has(itemName));
  });
}

function applyRoomBookingInventoryUsage(snapshot, booking) {
  const roomItems = getRoomInventoryItems(snapshot, booking);
  if (roomItems.length === 0 || !booking.reference) {
    return;
  }

  const transactions = Array.isArray(snapshot.inventoryTransactions) ? snapshot.inventoryTransactions : [];
  const usedItems = [];

  roomItems.forEach((item) => {
    if (transactions.some((transaction) => transaction.id === `room-use-${booking.id}-${item.id}`)) {
      return;
    }

    const availableQuantity = Math.max(0, Math.floor(Number(item.availableQuantity ?? item.quantity) || 0));
    const issuedQuantity = Math.min(roomBookingInventoryQuantity(item), availableQuantity);
    if (issuedQuantity <= 0) {
      return;
    }

    item.availableQuantity = availableQuantity - issuedQuantity;
    item.inUseQuantity = Math.max(0, Math.floor(Number(item.inUseQuantity) || 0)) + issuedQuantity;
    item.updatedAt = dateKey();
    usedItems.push(`${issuedQuantity} ${item.name}`);

    transactions.unshift({
      id: `room-use-${booking.id}-${item.id}`,
      itemId: item.id,
      itemName: item.name,
      type: 'issue',
      quantity: issuedQuantity,
      previousQuantity: availableQuantity,
      newQuantity: item.availableQuantity,
      bookingReference: booking.reference,
      performedBy: 'Automatic room booking deduction',
      reason: 'Room Use',
      notes: `Automatically issued for approved room booking ${booking.reference}.`,
      createdAt: new Date().toISOString(),
    });
  });

  if (usedItems.length > 0) {
    snapshot.inventoryTransactions = transactions;
    booking.notes = [booking.notes, `Automatic inventory deduction: ${usedItems.join(', ')}.`].filter(Boolean).join('\n');
  }
}

function returnRoomBookingInventoryUsage(snapshot, booking) {
  const transactions = Array.isArray(snapshot.inventoryTransactions) ? snapshot.inventoryTransactions : [];
  const issuedTransactions = transactions.filter(
    (transaction) => transaction.bookingReference === booking.reference
      && transaction.id.startsWith(`room-use-${booking.id}-`)
      && transaction.performedBy === 'Automatic room booking deduction',
  );

  issuedTransactions.forEach((transaction) => {
    const item = snapshot.inventoryItems.find((candidate) => candidate.id === transaction.itemId);
    if (!item || transactions.some((candidate) => candidate.id === `room-return-${booking.id}-${item.id}`)) {
      return;
    }

    if (item.itemType === 'consumable') {
      return;
    }

    const returnedQuantity = Math.min(transaction.quantity, Math.max(0, Math.floor(Number(item.inUseQuantity) || 0)));
    if (returnedQuantity <= 0) {
      return;
    }

    item.inUseQuantity -= returnedQuantity;
    item.availableQuantity = Math.min(item.totalQuantity, item.availableQuantity + returnedQuantity);
    item.updatedAt = dateKey();
    transactions.unshift({
      id: `room-return-${booking.id}-${item.id}`,
      itemId: item.id,
      itemName: item.name,
      type: 'return',
      quantity: returnedQuantity,
      previousQuantity: item.availableQuantity - returnedQuantity,
      newQuantity: item.availableQuantity,
      bookingReference: booking.reference,
      performedBy: 'Automatic room booking return',
      reason: 'Returned',
      notes: `Automatically returned after room booking ${booking.reference} was ${booking.status}.`,
      createdAt: new Date().toISOString(),
    });
  });

  snapshot.inventoryTransactions = transactions;
}

const packageInventoryDefaults = new Map([
  ['tables', 7],
  ['guest chairs', 50],
  ['chairs', 50],
]);
const poolWalkInInventoryDefaults = new Map([
  ['tables', 1],
  ['guest chairs', 5],
  ['chairs', 5],
]);
const roomConsumableNames = new Set(['soap', 'tissues']);

function getBookingInventoryItems(snapshot, booking) {
  const itemName = (item) => String(item.name ?? '').trim().toLowerCase();
  const isPoolWalkIn = booking.bookingMode === 'package'
    && booking.packageName === 'Pool use only'
    && String(booking.notes ?? '').includes('Table fee:');

  if (booking.bookingMode === 'package') {
    const defaults = isPoolWalkIn ? poolWalkInInventoryDefaults : packageInventoryDefaults;
    return snapshot.inventoryItems.filter((item) => !item.archived && defaults.has(itemName(item)) && item.itemType !== 'consumable');
  }

  if (booking.bookingMode !== 'room' || !booking.packageName) return [];
  const room = snapshot.rooms.find((candidate) => candidate.name === booking.packageName);
  if (!room) return [];

  return snapshot.inventoryItems.filter((item) => {
    if (item.archived) return false;
    const name = itemName(item);
    return item.room_id === room.id
      || (!item.room_id && item.itemType !== 'consumable' && sharedRoomInventoryNames.has(name))
      || (item.itemType === 'consumable' && roomConsumableNames.has(name));
  });
}

function bookingInventoryQuantity(item, booking) {
  const name = String(item.name ?? '').trim().toLowerCase();
  const isPoolWalkIn = booking.bookingMode === 'package'
    && booking.packageName === 'Pool use only'
    && String(booking.notes ?? '').includes('Table fee:');
  const defaults = isPoolWalkIn ? poolWalkInInventoryDefaults : packageInventoryDefaults;
  return booking.bookingMode === 'package' ? (defaults.get(name) ?? 0) : 1;
}

function applyBookingInventoryUsage(snapshot, booking) {
  const items = getBookingInventoryItems(snapshot, booking);
  const transactions = Array.isArray(snapshot.inventoryTransactions) ? snapshot.inventoryTransactions : [];
  const usedItems = [];

  items.forEach((item) => {
    const transactionId = `booking-use-${booking.id}-${item.id}`;
    if (transactions.some((transaction) => transaction.id === transactionId)) return;

    const availableQuantity = Math.max(0, Math.floor(Number(item.availableQuantity ?? item.quantity) || 0));
    const issuedQuantity = Math.min(bookingInventoryQuantity(item, booking), availableQuantity);
    if (issuedQuantity <= 0) return;

    const isConsumable = item.itemType === 'consumable';
    item.availableQuantity = availableQuantity - issuedQuantity;
    item.totalQuantity = isConsumable ? Math.max(0, Math.floor(Number(item.totalQuantity) || 0) - issuedQuantity) : item.totalQuantity;
    item.inUseQuantity = isConsumable ? item.inUseQuantity : Math.max(0, Math.floor(Number(item.inUseQuantity) || 0)) + issuedQuantity;
    item.updatedAt = dateKey();
    usedItems.push(`${issuedQuantity} ${item.name}`);

    transactions.unshift({
      id: transactionId,
      itemId: item.id,
      itemName: item.name,
      type: 'issue',
      quantity: issuedQuantity,
      previousQuantity: availableQuantity,
      newQuantity: item.availableQuantity,
      bookingReference: booking.reference,
      performedBy: 'Automatic booking inventory deduction',
      reason: 'Booking/Event',
      notes: `Automatically deducted for approved booking ${booking.reference}.`,
      createdAt: new Date().toISOString(),
    });
  });

  if (usedItems.length > 0) {
    snapshot.inventoryTransactions = transactions;
    booking.notes = [booking.notes, `Automatic inventory deduction: ${usedItems.join(', ')}.`].filter(Boolean).join('\n');
  }
}

function returnBookingInventoryUsage(snapshot, booking) {
  const transactions = Array.isArray(snapshot.inventoryTransactions) ? snapshot.inventoryTransactions : [];
  const issuedTransactions = transactions.filter((transaction) => (
    transaction.bookingReference === booking.reference
      && transaction.id === `booking-use-${booking.id}-${transaction.itemId}`
  ));

  issuedTransactions.forEach((transaction) => {
    const item = snapshot.inventoryItems.find((candidate) => candidate.id === transaction.itemId);
    if (!item || item.itemType === 'consumable' || transactions.some((candidate) => candidate.id === `booking-return-${booking.id}-${item.id}`)) return;

    const returnedQuantity = Math.min(transaction.quantity, Math.max(0, Math.floor(Number(item.inUseQuantity) || 0)));
    if (returnedQuantity <= 0) return;
    item.inUseQuantity -= returnedQuantity;
    item.availableQuantity += returnedQuantity;
    item.updatedAt = dateKey();
    transactions.unshift({
      id: `booking-return-${booking.id}-${item.id}`,
      itemId: item.id,
      itemName: item.name,
      type: 'return',
      quantity: returnedQuantity,
      previousQuantity: item.availableQuantity - returnedQuantity,
      newQuantity: item.availableQuantity,
      bookingReference: booking.reference,
      performedBy: 'Automatic booking inventory return',
      reason: 'Returned',
      notes: `Automatically returned after booking ${booking.reference} was ${booking.status}.`,
      createdAt: new Date().toISOString(),
    });
  });

  snapshot.inventoryTransactions = transactions;
}

async function sendAndLogBookingEmail(status, booking) {
  try {
    const result = await sendBookingEmail(status, booking);
    booking.emailLog = [
      ...(Array.isArray(booking.emailLog) ? booking.emailLog : []),
      {
        status,
        sent: result.sent,
        reason: result.reason,
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response,
        sentAt: new Date().toISOString(),
      },
    ];
  } catch (error) {
    booking.emailLog = [
      ...(Array.isArray(booking.emailLog) ? booking.emailLog : []),
      {
        status,
        sent: false,
        reason: error instanceof Error ? error.message : 'Unable to send email.',
        sentAt: new Date().toISOString(),
      },
    ];
    console.error(`Email failed for ${booking.reference}:`, error);
  }
}

function validateVenueDraft(payload) {
  return Boolean(
    payload &&
    typeof payload.name === 'string' &&
    typeof payload.type === 'string' &&
    typeof payload.location === 'string' &&
    Number.isFinite(Number(payload.price)) &&
    Number.isFinite(Number(payload.capacity)),
  );
}

function toVenue(payload, existingVenue) {
  const name = payload.name.trim();
  return {
    ...payload,
    id: existingVenue?.id ?? createRecordId('venue'),
    slug: existingVenue?.slug ?? slugify(name),
    name,
    price: Number(payload.price),
    capacity: Number(payload.capacity),
    rating: Number.isFinite(Number(payload.rating)) ? Number(payload.rating) : existingVenue?.rating ?? 4.8,
    amenities: Array.isArray(payload.amenities) ? payload.amenities : [],
    eventTypes: Array.isArray(payload.eventTypes) ? payload.eventTypes : [],
    gallery: Array.isArray(payload.gallery) && payload.gallery.length > 0 ? payload.gallery : [payload.heroImage].filter(Boolean),
    featured: Boolean(payload.featured),
  };
}

function validateReviewPayload(payload) {
  return Boolean(
    payload &&
    typeof payload.name === 'string' &&
    typeof payload.quote === 'string' &&
    Number.isFinite(Number(payload.rating)),
  );
}

function responseHeaders(request) {
  const origin = request.headers.origin;
  const headers = {
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };

  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }

  return headers;
}

function sendJson(request, response, statusCode, payload) {
  response.writeHead(statusCode, responseHeaders(request));
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 15_000_000) {
        request.destroy();
        reject(new Error('Request body too large'));
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

async function readInquiries() {
  if (useSupabase) {
    return readSupabaseInquiries();
  }

  try {
    const contents = await readFile(inquiriesPath, 'utf8');
    const parsed = JSON.parse(contents);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveInquiries(inquiries) {
  if (useSupabase) {
    await saveSupabaseInquiries(inquiries);
    return;
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(inquiriesPath, JSON.stringify(inquiries, null, 2));
}

function validateInquiry(payload) {
  const requiredFields = ['name', 'email', 'phone', 'subject', 'message'];
  return requiredFields.every((field) => typeof payload[field] === 'string' && payload[field].trim().length > 0);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    sendJson(request, response, 204, {});
    return;
  }

  try {
    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(request, response, 200, { ok: true });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/login') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const email = normalizeEmail(payload.email);
      const password = String(payload.password ?? '');
      const users = await readAdminUsers();
      const user = users.find((item) => item.email === email);

      if (!user || !(await verifyPassword(password, user.salt, user.passwordHash))) {
        sendJson(request, response, 401, { message: 'Invalid admin email or password.' });
        return;
      }

      const token = randomBytes(32).toString('hex');
      const loggedInAt = new Date().toISOString();
      const sessions = await readAdminSessions();
      await saveAdminSessions([
        ...sessions.filter((item) => item.adminId !== user.id),
        {
          token,
          adminId: user.id,
          createdAt: loggedInAt,
        },
      ]);
      sendJson(request, response, 200, publicAdminSession(user, token, loggedInAt));
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/admin/session') {
      const auth = await requireAdmin(request, response);
      if (!auth) {
        return;
      }

      sendJson(request, response, 200, publicAdminSession(auth.user, auth.session.token, auth.session.createdAt));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/logout') {
      const token = getBearerToken(request);
      if (token) {
        const sessions = await readAdminSessions();
        await saveAdminSessions(sessions.filter((item) => item.token !== token));
      }

      sendJson(request, response, 200, { ok: true });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/about') {
      sendJson(request, response, 200, aboutPageContent);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/home') {
      sendJson(request, response, 200, homePageContent);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/app-data') {
      sendJson(request, response, 200, await readAppData());
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/payment-proofs/signed-url') {
      if (!(await requireAdmin(request, response))) {
        return;
      }

      const paymentProofPath = url.searchParams.get('path') ?? '';
      if (!paymentProofPath) {
        sendJson(request, response, 400, { message: 'Payment proof path is required.' });
        return;
      }

      const signedUrl = await createSupabasePaymentProofSignedUrl(paymentProofPath);
      sendJson(request, response, 200, { signedUrl });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/app-data/sync-local') {
      if (!(await requireAdmin(request, response))) {
        return;
      }

      const payload = normalizeAppData(JSON.parse((await readBody(request)) || '{}'));
      const snapshot = await readAppData();
      const bookingIds = new Set(snapshot.bookings.map((booking) => booking.id));
      const notificationIds = new Set(snapshot.notifications.map((notification) => notification.id));
      const reviewIds = new Set(snapshot.reviews.map((review) => review.id));
      const inventoryItemIds = new Set(snapshot.inventoryItems.map((item) => item.id));
      const inventoryTransactionIds = new Set(snapshot.inventoryTransactions.map((item) => item.id));

      snapshot.bookings = [
        ...payload.bookings.filter((booking) => !bookingIds.has(booking.id)),
        ...snapshot.bookings,
      ];
      snapshot.notifications = [
        ...payload.notifications.filter((notification) => !notificationIds.has(notification.id)),
        ...snapshot.notifications,
      ];
      snapshot.reviews = [
        ...payload.reviews.filter((review) => !reviewIds.has(review.id)),
        ...snapshot.reviews,
      ];
      snapshot.inventoryItems = [
        ...payload.inventoryItems.filter((item) => !inventoryItemIds.has(item.id)),
        ...snapshot.inventoryItems,
      ];
      snapshot.inventoryTransactions = [
        ...payload.inventoryTransactions.filter((item) => !inventoryTransactionIds.has(item.id)),
        ...snapshot.inventoryTransactions,
      ];

      await saveAppData(snapshot);
      sendJson(request, response, 200, snapshot);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/bookings') {
      const payload = JSON.parse((await readBody(request)) || '{}');
      const isAdminBooking = Boolean(await getAuthenticatedAdmin(request));

      const validationError = validateBookingPayload(payload, { isAdminBooking });
      if (validationError) {
        sendJson(request, response, 400, { message: validationError });
        return;
      }

      const snapshot = await readAppData();
      const availabilityError = validateBookingAvailability(snapshot, payload);
      if (availabilityError) {
        sendJson(request, response, 409, { message: availabilityError });
        return;
      }

      const booking = createBooking(snapshot, payload);
      if (useSupabase && typeof payload.paymentProofUrl === 'string' && payload.paymentProofUrl.startsWith('data:')) {
        const proof = await uploadSupabasePaymentProof({
          dataUrl: payload.paymentProofUrl,
          fileName: payload.paymentProofName,
          bookingReference: booking.reference,
        });
        booking.paymentProofPath = proof.path;
        booking.paymentProofUrl = '';
      }

      const notification = createBookingNotification(booking);
      await sendAndLogBookingEmail('pending', booking);
      snapshot.bookings = [booking, ...snapshot.bookings];
      snapshot.notifications = [notification, ...snapshot.notifications];
      await saveAppData(snapshot);
      sendJson(request, response, 201, { booking, notification });
      return;
    }

    const bookingMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)$/);
    if (request.method === 'PATCH' && bookingMatch) {
      if (!(await requireAdmin(request, response))) {
        return;
      }

      const bookingId = decodeURIComponent(bookingMatch[1]);
      const payload = JSON.parse((await readBody(request)) || '{}');
      const snapshot = await readAppData();
      const booking = snapshot.bookings.find((item) => item.id === bookingId);

      if (!booking) {
        sendJson(request, response, 404, { message: 'Booking not found.' });
        return;
      }

      const previousStatus = booking.status;

      if (typeof payload.status === 'string') {
        booking.status = payload.status;
      }

      if (payload.status === 'approved' && previousStatus !== 'approved') {
        applyBookingInventoryUsage(snapshot, booking);
      }

      if (previousStatus === 'approved' && ['completed', 'cancelled', 'rejected'].includes(payload.status)) {
        returnBookingInventoryUsage(snapshot, booking);
      }

      if (Number.isFinite(Number(payload.depositAmount))) {
        booking.depositAmount = Number(payload.depositAmount);
      }

      if (payload.status === 'completed') {
        booking.depositAmount = Number(booking.totalPrice) || 0;
      }

      if (
        typeof payload.status === 'string' &&
        payload.status !== previousStatus &&
        ['approved', 'rejected', 'cancelled'].includes(payload.status)
      ) {
        await sendAndLogBookingEmail(payload.status, booking);
      }

      await saveAppData(snapshot);
      sendJson(request, response, 200, booking);
      return;
    }

    const bookingEmailMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)\/email$/);
    if (request.method === 'POST' && bookingEmailMatch) {
      if (!(await requireAdmin(request, response))) {
        return;
      }

      const bookingId = decodeURIComponent(bookingEmailMatch[1]);
      const payload = JSON.parse((await readBody(request)) || '{}');
      const snapshot = await readAppData();
      const booking = snapshot.bookings.find((item) => item.id === bookingId);

      if (!booking) {
        sendJson(request, response, 404, { message: 'Booking not found.' });
        return;
      }

      const emailStatus = typeof payload.status === 'string' ? payload.status : booking.status;
      await sendAndLogBookingEmail(emailStatus, booking);
      await saveAppData(snapshot);
      sendJson(request, response, 200, booking);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/reviews') {
      const payload = JSON.parse((await readBody(request)) || '{}');

      if (!validateReviewPayload(payload)) {
        sendJson(request, response, 400, { message: 'Name, rating, and review text are required.' });
        return;
      }

      const review = {
        id: createRecordId('review'),
        name: payload.name.trim(),
        rating: Number(payload.rating),
        provider: payload.provider ?? 'direct',
        status: 'pending',
        createdAt: dateKey(),
        quote: payload.quote.trim(),
      };
      const snapshot = await readAppData();
      snapshot.reviews = [review, ...snapshot.reviews];
      await saveAppData(snapshot);
      sendJson(request, response, 201, review);
      return;
    }

    const reviewMatch = url.pathname.match(/^\/api\/reviews\/([^/]+)$/);
    if (reviewMatch) {
      const reviewId = decodeURIComponent(reviewMatch[1]);
      const snapshot = await readAppData();
      const review = snapshot.reviews.find((item) => item.id === reviewId);

      if (!review) {
        sendJson(request, response, 404, { message: 'Review not found.' });
        return;
      }

      if (request.method === 'PATCH') {
        if (!(await requireAdmin(request, response))) {
          return;
        }

        const payload = JSON.parse((await readBody(request)) || '{}');
        if (typeof payload.status === 'string') {
          review.status = payload.status;
        }
        await saveAppData(snapshot);
        sendJson(request, response, 200, review);
        return;
      }

      if (request.method === 'DELETE') {
        if (!(await requireAdmin(request, response))) {
          return;
        }

        snapshot.reviews = snapshot.reviews.filter((item) => item.id !== reviewId);
        await saveAppData(snapshot);
        sendJson(request, response, 200, { ok: true });
        return;
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/venues') {
      if (!(await requireAdmin(request, response))) {
        return;
      }

      const payload = JSON.parse((await readBody(request)) || '{}');

      if (!validateVenueDraft(payload)) {
        sendJson(request, response, 400, { message: 'Venue name, type, location, price, and capacity are required.' });
        return;
      }

      const snapshot = await readAppData();
      const venue = toVenue(payload);
      snapshot.venues = [venue, ...snapshot.venues];
      await saveAppData(snapshot);
      sendJson(request, response, 201, venue);
      return;
    }

    const venueMatch = url.pathname.match(/^\/api\/venues\/([^/]+)$/);
    if (venueMatch) {
      const venueId = decodeURIComponent(venueMatch[1]);
      const snapshot = await readAppData();
      const existingVenue = snapshot.venues.find((item) => item.id === venueId);

      if (!existingVenue) {
        sendJson(request, response, 404, { message: 'Venue not found.' });
        return;
      }

      if (request.method === 'PUT') {
        if (!(await requireAdmin(request, response))) {
          return;
        }

        const payload = JSON.parse((await readBody(request)) || '{}');

        if (!validateVenueDraft(payload)) {
          sendJson(request, response, 400, { message: 'Venue name, type, location, price, and capacity are required.' });
          return;
        }

        const venue = toVenue(payload, existingVenue);
        snapshot.venues = snapshot.venues.map((item) => item.id === venueId ? venue : item);
        await saveAppData(snapshot);
        sendJson(request, response, 200, venue);
        return;
      }

      if (request.method === 'DELETE') {
        if (!(await requireAdmin(request, response))) {
          return;
        }

        snapshot.venues = snapshot.venues.filter((item) => item.id !== venueId);
        await saveAppData(snapshot);
        sendJson(request, response, 200, { ok: true });
        return;
      }
    }

    if (request.method === 'PUT' && url.pathname === '/api/packages') {
      if (!(await requireAdmin(request, response))) {
        return;
      }

      const payload = JSON.parse((await readBody(request)) || '[]');

      if (!Array.isArray(payload)) {
        sendJson(request, response, 400, { message: 'Packages payload must be an array.' });
        return;
      }

      const snapshot = await readAppData();
      snapshot.packages = payload;
      await saveAppData(snapshot);
      sendJson(request, response, 200, snapshot.packages);
      return;
    }

    if (request.method === 'PUT' && url.pathname === '/api/rooms') {
      if (!(await requireAdmin(request, response))) {
        return;
      }

      const payload = JSON.parse((await readBody(request)) || '[]');

      if (!Array.isArray(payload)) {
        sendJson(request, response, 400, { message: 'Rooms payload must be an array.' });
        return;
      }

      const snapshot = await readAppData();
      snapshot.rooms = payload;
      await saveAppData(snapshot);
      sendJson(request, response, 200, snapshot.rooms);
      return;
    }

    if (request.method === 'PUT' && url.pathname === '/api/add-ons') {
      if (!(await requireAdmin(request, response))) {
        return;
      }

      const payload = JSON.parse((await readBody(request)) || '[]');

      if (!Array.isArray(payload)) {
        sendJson(request, response, 400, { message: 'Add-ons payload must be an array.' });
        return;
      }

      const snapshot = await readAppData();
      snapshot.addOns = payload;
      await saveAppData(snapshot);
      sendJson(request, response, 200, snapshot.addOns);
      return;
    }

    if (request.method === 'PUT' && url.pathname === '/api/inventory') {
      if (!(await requireAdmin(request, response))) {
        return;
      }

      const payload = JSON.parse((await readBody(request)) || '[]');

      if (!Array.isArray(payload)) {
        sendJson(request, response, 400, { message: 'Inventory payload must be an array.' });
        return;
      }

      const snapshot = await readAppData();
      snapshot.inventoryItems = payload;
      await saveAppData(snapshot);
      sendJson(request, response, 200, snapshot.inventoryItems);
      return;
    }

    if (request.method === 'PUT' && url.pathname === '/api/inventory-state') {
      if (!(await requireAdmin(request, response))) {
        return;
      }

      const payload = JSON.parse((await readBody(request)) || '{}');

      if (!Array.isArray(payload.inventoryItems) || !Array.isArray(payload.inventoryTransactions)) {
        sendJson(request, response, 400, { message: 'Inventory state must include inventory items and transactions.' });
        return;
      }

      const snapshot = await readAppData();
      snapshot.inventoryItems = payload.inventoryItems;
      snapshot.inventoryTransactions = payload.inventoryTransactions;
      await saveAppData(snapshot);
      sendJson(request, response, 200, snapshot);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/notifications/mark-read') {
      if (!(await requireAdmin(request, response))) {
        return;
      }

      const snapshot = await readAppData();
      const readAt = new Date().toISOString();
      snapshot.notifications = snapshot.notifications.map((notification) => (
        notification.readAt ? notification : { ...notification, readAt }
      ));
      await saveAppData(snapshot);
      sendJson(request, response, 200, snapshot.notifications);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/reset-data') {
      if (!(await requireAdmin(request, response))) {
        return;
      }

      const seeded = clone(defaultAppData);
      await saveAppData(seeded);
      sendJson(request, response, 200, seeded);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/contact-inquiries') {
      const payload = JSON.parse((await readBody(request)) || '{}');

      if (!validateInquiry(payload)) {
        sendJson(request, response, 400, { message: 'Name, email, phone, subject, and message are required.' });
        return;
      }

      const inquiry = {
        id: createId(),
        name: payload.name.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        subject: payload.subject.trim(),
        message: payload.message.trim(),
        status: 'new',
        createdAt: new Date().toISOString(),
      };
      const inquiries = await readInquiries();
      await saveInquiries([inquiry, ...inquiries]);
      sendJson(request, response, 201, inquiry);
      return;
    }

    if (await serveWebsite(request, response, url.pathname, rootDir)) {
      return;
    }
    sendJson(request, response, 404, { message: 'Route not found.' });
  } catch (error) {
    console.error('API request failed.', error);
    sendJson(request, response, 500, { message: error instanceof Error ? error.message : 'Unexpected server error.' });
  }
});

server.listen(port, host, () => {
  console.log(`Watikolo backend running at http://${host}:${port}`);
  console.log(`Persistence: ${useSupabase ? 'Supabase' : 'local JSON files'}`);
});
