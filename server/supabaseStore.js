import { createClient } from '@supabase/supabase-js';
import { createSupabaseFetch } from './supabaseFetch.js';

const APP_DATA_ID = 'default';
const PAYMENT_PROOF_BUCKET = 'payment-proofs';
const PAYMENT_PROOF_MAX_BYTES = 10 * 1024 * 1024;
const paymentProofMimeToExtension = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

let client;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  return { url, key };
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

function getClient() {
  if (client) {
    return client;
  }

  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('Supabase is not configured.');
  }

  client = createClient(url, key, {
    global: { fetch: createSupabaseFetch() },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}

export async function readSupabaseAppData() {
  const client = getClient();
  const { data, error } = await client
    .from('app_data')
    .select('snapshot')
    .eq('id', APP_DATA_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const snapshot = data?.snapshot ?? null;
  if (!snapshot) {
    return null;
  }

  const [
    bookings,
    venues,
    reviews,
    packages,
    rooms,
    addOns,
    inventoryItems,
    inventoryTransactions,
    inventoryReports,
  ] = await Promise.all([
    readTable('bookings', 'created_at', false, toBooking),
    readTable('venues', 'name', true, toVenue),
    readTable('reviews', 'created_at', false, toReview),
    readTable('accommodation_packages', 'sort_order', true, toPackage),
    readTable('accommodation_rooms', 'sort_order', true, toRoom),
    readTable('additional_add_ons', 'sort_order', true, toAddOn),
    readTable('inventory_items', 'name', true, toInventoryItem),
    readTable('inventory_transactions', 'created_at', false, toInventoryTransaction),
    readTable('inventory_reports', 'report_date', false, toInventoryReport),
  ]);

  return {
    ...snapshot,
    bookings: bookings ?? snapshot.bookings,
    venues: venues ?? snapshot.venues,
    reviews: reviews ?? snapshot.reviews,
    packages: packages ?? snapshot.packages,
    rooms: rooms ?? snapshot.rooms,
    addOns: addOns ?? snapshot.addOns,
    inventoryItems: inventoryItems ?? snapshot.inventoryItems,
    inventoryTransactions: inventoryTransactions ?? snapshot.inventoryTransactions,
    inventoryReports: inventoryReports ?? snapshot.inventoryReports,
  };
}

export async function saveSupabaseAppData(snapshot) {
  const client = getClient();
  const { error } = await client
    .from('app_data')
    .upsert({
      id: APP_DATA_ID,
      snapshot,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    throw error;
  }

  await Promise.all([
    replaceRows('bookings', snapshot.bookings ?? [], toBookingRow),
    replaceRows('venues', snapshot.venues ?? [], toVenueRow),
    replaceRows('reviews', snapshot.reviews ?? [], toReviewRow),
    replaceRows('accommodation_packages', snapshot.packages ?? [], toPackageRow),
    replaceRows('accommodation_rooms', snapshot.rooms ?? [], toRoomRow),
    replaceRows('additional_add_ons', snapshot.addOns ?? [], toAddOnRow),
    saveSupabaseInventoryTables(snapshot.inventoryItems ?? [], snapshot.inventoryTransactions ?? []),
  ]);

  const inventoryReports = buildInventoryReports(snapshot.inventoryItems ?? []);
  try {
    await replaceRows('inventory_reports', inventoryReports, (report) => report);
  } catch (error) {
    // Older Supabase projects may not have the optional room_id report column yet.
    // Keep inventory persistence working until the migration is applied.
    if (error?.code !== 'PGRST204' || !String(error.message ?? '').includes("'room_id' column")) {
      throw error;
    }

    await replaceRows('inventory_reports', inventoryReports, (report) => {
      const { room_id: _legacyRoomId, ...legacyReport } = report;
      return legacyReport;
    });
  }
}

function toInventoryItemRow(item) {
  const availableQuantity = Math.max(0, Math.floor(Number(item.availableQuantity ?? item.quantity) || 0));
  const inUseQuantity = Math.max(0, Math.floor(Number(item.inUseQuantity) || 0));
  const damagedQuantity = Math.max(0, Math.floor(Number(item.damagedQuantity) || 0));
  const totalQuantity = Math.max(Math.floor(Number(item.totalQuantity) || 0), availableQuantity + inUseQuantity + damagedQuantity);

  return {
    id: item.id,
    room_id: item.room_id ?? '',
    name: item.name,
    category: item.category,
    item_type: item.itemType ?? 'reusable',
    total_quantity: totalQuantity,
    available_quantity: availableQuantity,
    in_use_quantity: inUseQuantity,
    damaged_quantity: damagedQuantity,
    unit: item.unit ?? 'pcs',
    reorder_level: Math.max(0, Math.floor(Number(item.reorderLevel) || 0)),
    location: item.location ?? '',
    under_maintenance: Boolean(item.underMaintenance),
    archived: Boolean(item.archived),
    archived_at: item.archivedAt ?? null,
    notes: item.notes ?? null,
    updated_at: item.updatedAt ?? new Date().toISOString().slice(0, 10),
  };
}

function toInventoryItem(row) {
  return {
    id: row.id,
    room_id: row.room_id ?? '',
    name: row.name,
    category: row.category,
    itemType: row.item_type,
    totalQuantity: row.total_quantity,
    availableQuantity: row.available_quantity,
    inUseQuantity: row.in_use_quantity,
    damagedQuantity: row.damaged_quantity,
    unit: row.unit,
    reorderLevel: row.reorder_level,
    location: row.location,
    underMaintenance: row.under_maintenance,
    archived: row.archived,
    archivedAt: row.archived_at ?? undefined,
    notes: row.notes ?? undefined,
    updatedAt: row.updated_at,
  };
}

function toInventoryTransactionRow(transaction) {
  return {
    id: transaction.id,
    item_id: transaction.itemId,
    item_name: transaction.itemName,
    type: transaction.type ?? 'stock-out',
    quantity: Math.max(1, Math.floor(Number(transaction.quantity) || 1)),
    previous_quantity: transaction.previousQuantity ?? null,
    new_quantity: transaction.newQuantity ?? null,
    booking_reference: transaction.bookingReference ?? null,
    reason: transaction.reason,
    notes: transaction.notes ?? null,
    performed_by: transaction.performedBy ?? null,
    created_at: transaction.createdAt ?? new Date().toISOString(),
  };
}

function toInventoryTransaction(row) {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    type: row.type,
    quantity: row.quantity,
    previousQuantity: row.previous_quantity ?? undefined,
    newQuantity: row.new_quantity ?? undefined,
    bookingReference: row.booking_reference ?? undefined,
    reason: row.reason,
    notes: row.notes ?? undefined,
    performedBy: row.performed_by ?? undefined,
    createdAt: row.created_at,
  };
}

function toBookingRow(booking) {
  return {
    id: booking.id,
    reference: booking.reference,
    venue_id: booking.venueId,
    venue_name: booking.venueName,
    booking_mode: booking.bookingMode ?? null,
    package_name: booking.packageName ?? null,
    package_index: Number.isFinite(Number(booking.packageIndex)) ? Number(booking.packageIndex) : null,
    room_add_ons: asArray(booking.roomAddOns),
    customer_name: booking.customerName,
    customer_email: booking.customerEmail,
    customer_phone: booking.customerPhone ?? null,
    date: booking.date,
    time_slot_id: booking.timeSlotId,
    time_slot_label: booking.timeSlotLabel,
    preferred_start_time: booking.preferredStartTime ?? null,
    guests: Math.max(0, Math.floor(asNumber(booking.guests))),
    event_type: booking.eventType,
    total_price: asNumber(booking.totalPrice),
    deposit_amount: Number.isFinite(Number(booking.depositAmount)) ? Number(booking.depositAmount) : null,
    payment_proof_name: booking.paymentProofName ?? null,
    payment_proof_url: booking.paymentProofUrl ?? null,
    payment_proof_path: booking.paymentProofPath ?? null,
    status: booking.status ?? 'pending',
    notes: booking.notes ?? null,
    email_log: asArray(booking.emailLog),
    created_at: booking.createdAt ?? new Date().toISOString().slice(0, 10),
  };
}

function toBooking(row) {
  return {
    id: row.id,
    reference: row.reference,
    venueId: row.venue_id,
    venueName: row.venue_name,
    bookingMode: row.booking_mode ?? undefined,
    packageName: row.package_name ?? undefined,
    packageIndex: row.package_index ?? undefined,
    roomAddOns: asArray(row.room_add_ons),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone ?? undefined,
    date: row.date,
    timeSlotId: row.time_slot_id,
    timeSlotLabel: row.time_slot_label,
    preferredStartTime: row.preferred_start_time ?? undefined,
    guests: row.guests,
    eventType: row.event_type,
    totalPrice: asNumber(row.total_price),
    depositAmount: row.deposit_amount === null ? undefined : asNumber(row.deposit_amount),
    paymentProofName: row.payment_proof_name ?? undefined,
    paymentProofUrl: row.payment_proof_url ?? undefined,
    paymentProofPath: row.payment_proof_path ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    notes: row.notes ?? undefined,
    emailLog: asArray(row.email_log),
  };
}

function toVenueRow(venue) {
  return {
    id: venue.id,
    name: venue.name,
    slug: venue.slug ?? slugify(venue.name),
    type: venue.type,
    location: venue.location,
    price: asNumber(venue.price),
    capacity: Math.max(0, Math.floor(asNumber(venue.capacity))),
    rating: asNumber(venue.rating, 4.8),
    short_description: venue.shortDescription ?? '',
    description: venue.description ?? '',
    amenities: asArray(venue.amenities),
    event_types: asArray(venue.eventTypes),
    hero_image: venue.heroImage ?? '',
    gallery: asArray(venue.gallery),
    featured: Boolean(venue.featured),
    availability_text: venue.availabilityText ?? '',
    availability: venue.availability ?? 'Open this week',
  };
}

function toVenue(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type,
    location: row.location,
    price: asNumber(row.price),
    capacity: row.capacity,
    rating: asNumber(row.rating, 4.8),
    shortDescription: row.short_description,
    description: row.description,
    amenities: asArray(row.amenities),
    eventTypes: asArray(row.event_types),
    heroImage: row.hero_image,
    gallery: asArray(row.gallery),
    featured: row.featured,
    availabilityText: row.availability_text,
    availability: row.availability,
  };
}

function toReviewRow(review) {
  return {
    id: review.id,
    name: review.name,
    rating: Math.min(5, Math.max(1, Math.floor(asNumber(review.rating, 5)))),
    provider: review.provider ?? 'direct',
    status: review.status ?? 'pending',
    quote: review.quote,
    created_at: review.createdAt ?? new Date().toISOString().slice(0, 10),
  };
}

function toReview(row) {
  return {
    id: row.id,
    name: row.name,
    rating: row.rating,
    provider: row.provider,
    status: row.status,
    createdAt: row.created_at,
    quote: row.quote,
  };
}

function toPackageRow(item, index) {
  return {
    id: item.id ?? `package-${slugify(item.name)}-${index + 1}`,
    name: item.name,
    price: asNumber(item.price),
    min_guests: Math.max(0, Math.floor(asNumber(item.minGuests))),
    guest_label: item.guestLabel ?? '',
    is_exclusive: Boolean(item.isExclusive),
    inclusions: asArray(item.inclusions),
    sort_order: index,
  };
}

function toPackage(row) {
  return {
    name: row.name,
    price: asNumber(row.price),
    minGuests: row.min_guests,
    guestLabel: row.guest_label,
    isExclusive: row.is_exclusive,
    inclusions: asArray(row.inclusions),
  };
}

function toRoomRow(item, index) {
  return {
    id: item.id ?? `room-${slugify(item.name)}-${index + 1}`,
    name: item.name,
    image: item.image ?? '',
    capacity: item.capacity ?? '',
    price: asNumber(item.price),
    inclusions: asArray(item.inclusions),
    sort_order: index,
  };
}

function toRoom(row) {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    capacity: row.capacity,
    price: asNumber(row.price),
    inclusions: asArray(row.inclusions),
  };
}

function toAddOnRow(item, index) {
  return {
    id: item.id ?? `add-on-${slugify(item.name)}-${index + 1}`,
    name: item.name,
    price: asNumber(item.price),
    description: item.description ?? '',
    sort_order: index,
  };
}

function toAddOn(row) {
  return {
    name: row.name,
    price: asNumber(row.price),
    description: row.description,
  };
}

function toInventoryReport(row) {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    category: row.category,
    totalQuantity: row.total_quantity,
    availableQuantity: row.available_quantity,
    usedQuantity: row.used_quantity,
    damagedQuantity: row.damaged_quantity,
    reorderLevel: row.reorder_level,
    status: row.status,
    reportDate: row.report_date,
    createdAt: row.created_at,
  };
}

function inventoryStatus(item) {
  if (item.underMaintenance) return 'under-maintenance';
  if (asNumber(item.availableQuantity) <= 0) return 'out-of-stock';
  if (asNumber(item.availableQuantity) <= asNumber(item.reorderLevel)) return 'low-stock';
  return 'available';
}

function buildInventoryReports(inventoryItems) {
  const reportDate = new Date().toISOString().slice(0, 10);
  return inventoryItems.map((item) => ({
    id: `${reportDate}-${item.id}`,
    item_id: item.id,
    room_id: item.room_id ?? '',
    item_name: item.name,
    category: item.category,
    total_quantity: Math.max(0, Math.floor(asNumber(item.totalQuantity))),
    available_quantity: Math.max(0, Math.floor(asNumber(item.availableQuantity ?? item.quantity))),
    used_quantity: Math.max(0, Math.floor(asNumber(item.inUseQuantity))),
    damaged_quantity: Math.max(0, Math.floor(asNumber(item.damagedQuantity))),
    reorder_level: Math.max(0, Math.floor(asNumber(item.reorderLevel))),
    status: inventoryStatus(item),
    report_date: reportDate,
    created_at: new Date().toISOString(),
  }));
}

async function readTable(tableName, orderColumn, ascending, mapper) {
  const { data, error } = await getClient()
    .from(tableName)
    .select('*')
    .order(orderColumn, { ascending });

  if (error) {
    if (error.code === '42P01' || error.code === '42703') {
      return null;
    }

    throw error;
  }

  return Array.isArray(data) && data.length > 0 ? data.map(mapper) : null;
}

async function replaceRows(tableName, items, mapper) {
  const client = getClient();
  const { error: deleteError } = await client
    .from(tableName)
    .delete()
    .neq('id', '');

  if (deleteError) {
    throw deleteError;
  }

  if (items.length === 0) {
    return;
  }

  const rows = items.map(mapper);
  const { error: insertError } = await client
    .from(tableName)
    .insert(rows);

  if (insertError) {
    throw insertError;
  }
}

async function saveSupabaseInventoryTables(inventoryItems, inventoryTransactions) {
  const client = getClient();
  const { error: deleteTransactionsError } = await client
    .from('inventory_transactions')
    .delete()
    .neq('id', '');

  if (deleteTransactionsError) {
    throw deleteTransactionsError;
  }

  const { error: deleteItemsError } = await client
    .from('inventory_items')
    .delete()
    .neq('id', '');

  if (deleteItemsError) {
    throw deleteItemsError;
  }

  if (inventoryItems.length > 0) {
    const { error: itemError } = await client
      .from('inventory_items')
      .insert(inventoryItems.map(toInventoryItemRow));

    if (itemError) {
      throw itemError;
    }
  }

  if (inventoryTransactions.length > 0) {
    const rows = inventoryTransactions.map(toInventoryTransactionRow);
    const { error: transactionError } = await client
      .from('inventory_transactions')
      .insert(rows);

    if (transactionError) {
      throw transactionError;
    }
  }
}

export async function readSupabaseInquiries() {
  const { data, error } = await getClient()
    .from('contact_inquiries')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function saveSupabaseInquiries(inquiries) {
  const { error: deleteError } = await getClient()
    .from('contact_inquiries')
    .delete()
    .neq('id', '');

  if (deleteError) {
    throw deleteError;
  }

  if (inquiries.length === 0) {
    return;
  }

  const { error: insertError } = await getClient()
    .from('contact_inquiries')
    .insert(inquiries);

  if (insertError) {
    throw insertError;
  }
}

function toAdminUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    salt: row.salt,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

function toAdminUserRow(user) {
  return {
    id: user.id,
    name: user.name,
    email: String(user.email ?? '').trim().toLowerCase(),
    role: user.role ?? 'Admin',
    salt: user.salt,
    password_hash: user.passwordHash,
    created_at: user.createdAt ?? new Date().toISOString(),
  };
}

function toAdminSession(row) {
  return {
    token: row.token,
    adminId: row.admin_id,
    createdAt: row.created_at,
  };
}

function toAdminSessionRow(session) {
  return {
    token: session.token,
    admin_id: session.adminId,
    created_at: session.createdAt ?? new Date().toISOString(),
  };
}

export async function readSupabaseAdminUsers() {
  const { data, error } = await getClient()
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(toAdminUser);
}

export async function saveSupabaseAdminUsers(users) {
  if (!Array.isArray(users) || users.length === 0) {
    return;
  }

  const { error } = await getClient()
    .from('admin_users')
    .upsert(users.map(toAdminUserRow), { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

export async function readSupabaseAdminSessions() {
  const { data, error } = await getClient()
    .from('admin_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(toAdminSession);
}

export async function saveSupabaseAdminSessions(sessions) {
  const { error: deleteError } = await getClient()
    .from('admin_sessions')
    .delete()
    .neq('token', '');

  if (deleteError) {
    throw deleteError;
  }

  if (!Array.isArray(sessions) || sessions.length === 0) {
    return;
  }

  const { error: insertError } = await getClient()
    .from('admin_sessions')
    .insert(sessions.map(toAdminSessionRow));

  if (insertError) {
    throw insertError;
  }
}

function extensionFromFileName(fileName) {
  const extension = String(fileName ?? '').split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) ? extension.replace('jpeg', 'jpg') : '';
}

export async function uploadSupabasePaymentProof({ dataUrl, fileName, bookingReference }) {
  const match = String(dataUrl ?? '').match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Payment proof must be an image upload.');
  }

  const contentType = match[1].toLowerCase();
  const extension = extensionFromFileName(fileName) || paymentProofMimeToExtension[contentType];
  if (!extension || !paymentProofMimeToExtension[contentType]) {
    throw new Error('Payment proof must be a JPG, PNG, WEBP, or GIF image.');
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > PAYMENT_PROOF_MAX_BYTES) {
    throw new Error('Payment proof image must be 10MB or smaller.');
  }

  const safeReference = String(bookingReference ?? 'booking').replace(/[^a-zA-Z0-9-]+/g, '-');
  const safeFileName = String(fileName ?? `payment-proof.${extension}`)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `payment-proof.${extension}`;
  const path = `${safeReference}/${Date.now()}-${safeFileName}`;

  const { data, error } = await getClient()
    .storage
    .from(PAYMENT_PROOF_BUCKET)
    .upload(path, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return { path: data.path };
}

export async function createSupabasePaymentProofSignedUrl(path, expiresIn = 300) {
  const { data, error } = await getClient()
    .storage
    .from(PAYMENT_PROOF_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
