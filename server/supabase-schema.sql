create table if not exists public.app_data (
  id text primary key,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_inquiries (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null,
  subject text not null,
  message text not null,
  status text not null default 'new',
  "createdAt" timestamptz not null default now()
);

create table if not exists public.bookings (
  id text primary key,
  reference text not null,
  venue_id text not null,
  venue_name text not null,
  booking_mode text,
  package_name text,
  package_index integer,
  room_add_ons jsonb not null default '[]'::jsonb,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  date date not null,
  time_slot_id text not null,
  time_slot_label text not null,
  preferred_start_time text,
  guests integer not null check (guests >= 0),
  event_type text not null,
  total_price numeric(12, 2) not null default 0,
  deposit_amount numeric(12, 2),
  payment_proof_name text,
  payment_proof_url text,
  payment_proof_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'completed', 'cancelled', 'rejected')),
  notes text,
  email_log jsonb not null default '[]'::jsonb,
  created_at date not null default current_date
);

alter table public.bookings
  drop constraint if exists bookings_reference_key;

create table if not exists public.venues (
  id text primary key,
  name text not null,
  slug text not null unique,
  type text not null,
  location text not null,
  price numeric(12, 2) not null default 0,
  capacity integer not null default 0 check (capacity >= 0),
  rating numeric(3, 2) not null default 4.80,
  short_description text not null default '',
  description text not null default '',
  amenities jsonb not null default '[]'::jsonb,
  event_types jsonb not null default '[]'::jsonb,
  hero_image text not null default '',
  gallery jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  availability_text text not null default '',
  availability text not null default 'Open this week'
);

create table if not exists public.reviews (
  id text primary key,
  name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  provider text not null default 'direct',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  quote text not null,
  created_at date not null default current_date
);

create table if not exists public.accommodation_packages (
  id text primary key,
  name text not null,
  price numeric(12, 2) not null default 0,
  min_guests integer not null default 0 check (min_guests >= 0),
  guest_label text not null default '',
  is_exclusive boolean not null default false,
  inclusions jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

create table if not exists public.accommodation_rooms (
  id text primary key,
  name text not null,
  image text not null default '',
  capacity text not null default '',
  price numeric(12, 2) not null default 0,
  inclusions jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

create table if not exists public.additional_add_ons (
  id text primary key,
  name text not null,
  price numeric(12, 2) not null default 0,
  description text not null default '',
  sort_order integer not null default 0
);

create table if not exists public.inventory_items (
  id text primary key,
  room_id text not null default '',
  name text not null,
  category text not null,
  item_type text not null default 'reusable' check (item_type in ('consumable', 'reusable')),
  total_quantity integer not null default 0 check (total_quantity >= 0),
  available_quantity integer not null default 0 check (available_quantity >= 0),
  in_use_quantity integer not null default 0 check (in_use_quantity >= 0),
  damaged_quantity integer not null default 0 check (damaged_quantity >= 0),
  unit text not null default 'pcs',
  reorder_level integer not null default 0 check (reorder_level >= 0),
  location text not null default '',
  under_maintenance boolean not null default false,
  archived boolean not null default false,
  archived_at timestamptz,
  notes text,
  updated_at date not null default current_date,
  constraint inventory_items_quantity_balance check (total_quantity >= available_quantity + in_use_quantity + damaged_quantity)
);

create table if not exists public.inventory_transactions (
  id text primary key,
  item_id text not null references public.inventory_items(id) on delete cascade,
  item_name text not null,
  type text not null default 'stock-out' check (type in ('stock-in', 'stock-out', 'issue', 'return', 'damaged', 'adjustment')),
  quantity integer not null check (quantity > 0),
  previous_quantity integer,
  new_quantity integer,
  booking_reference text,
  reason text not null check (reason in ('Booking/Event', 'Room Use', 'Cleaning', 'Damaged', 'Other', 'Restock', 'Supplier Delivery', 'Correction', 'Returned', 'Maintenance Return', 'Adjustment', 'Archived')),
  notes text,
  performed_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_reports (
  id text primary key,
  item_id text not null,
  room_id text not null default '',
  item_name text not null,
  category text not null,
  total_quantity integer not null default 0,
  available_quantity integer not null default 0,
  used_quantity integer not null default 0,
  damaged_quantity integer not null default 0,
  reorder_level integer not null default 0,
  status text not null default 'available',
  report_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null default 'Admin',
  salt text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  token text primary key,
  admin_id text not null references public.admin_users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.inventory_items
  add column if not exists room_id text not null default '',
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;

alter table public.inventory_transactions
  add column if not exists previous_quantity integer,
  add column if not exists new_quantity integer,
  add column if not exists booking_reference text,
  add column if not exists performed_by text;

alter table public.inventory_reports
  add column if not exists room_id text not null default '';

alter table public.inventory_transactions
  drop constraint if exists inventory_transactions_type_check;

alter table public.inventory_transactions
  add constraint inventory_transactions_type_check
  check (type in ('stock-in', 'stock-out', 'issue', 'return', 'damaged', 'adjustment'));

alter table public.inventory_transactions
  drop constraint if exists inventory_transactions_reason_check;

alter table public.inventory_transactions
  add constraint inventory_transactions_reason_check
  check (reason in ('Booking/Event', 'Room Use', 'Cleaning', 'Damaged', 'Other', 'Restock', 'Supplier Delivery', 'Correction', 'Returned', 'Maintenance Return', 'Adjustment', 'Archived'));

create index if not exists inventory_items_category_idx on public.inventory_items(category);
create index if not exists inventory_items_room_id_idx on public.inventory_items(room_id);
create index if not exists inventory_items_archived_idx on public.inventory_items(archived);
create index if not exists inventory_transactions_item_id_idx on public.inventory_transactions(item_id);
create index if not exists inventory_transactions_created_at_idx on public.inventory_transactions(created_at desc);
create index if not exists inventory_transactions_booking_reference_idx on public.inventory_transactions(booking_reference);
create index if not exists bookings_date_idx on public.bookings(date);
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists bookings_customer_email_idx on public.bookings(customer_email);
create index if not exists venues_slug_idx on public.venues(slug);
create index if not exists reviews_status_idx on public.reviews(status);
create index if not exists inventory_reports_report_date_idx on public.inventory_reports(report_date desc);
create index if not exists inventory_reports_item_id_idx on public.inventory_reports(item_id);
create index if not exists inventory_reports_room_id_idx on public.inventory_reports(room_id);
create index if not exists admin_users_email_idx on public.admin_users(email);
create index if not exists admin_sessions_admin_id_idx on public.admin_sessions(admin_id);
create index if not exists admin_sessions_created_at_idx on public.admin_sessions(created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.app_data enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.bookings enable row level security;
alter table public.venues enable row level security;
alter table public.reviews enable row level security;
alter table public.accommodation_packages enable row level security;
alter table public.accommodation_rooms enable row level security;
alter table public.additional_add_ons enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.inventory_reports enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_sessions enable row level security;

grant select on public.app_data to anon, authenticated;

drop policy if exists "Server key can manage app data" on public.app_data;
create policy "Server key can manage app data"
  on public.app_data
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Public can read app data" on public.app_data;
create policy "Public can read app data"
  on public.app_data
  for select
  to anon, authenticated
  using (id = 'default');

drop policy if exists "Server key can manage contact inquiries" on public.contact_inquiries;
create policy "Server key can manage contact inquiries"
  on public.contact_inquiries
  for all
  to service_role
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

drop policy if exists "Server key can manage bookings" on public.bookings;
create policy "Server key can manage bookings"
  on public.bookings
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Server key can manage venues" on public.venues;
create policy "Server key can manage venues"
  on public.venues
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Server key can manage reviews" on public.reviews;
create policy "Server key can manage reviews"
  on public.reviews
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Server key can manage accommodation packages" on public.accommodation_packages;
create policy "Server key can manage accommodation packages"
  on public.accommodation_packages
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Server key can manage accommodation rooms" on public.accommodation_rooms;
create policy "Server key can manage accommodation rooms"
  on public.accommodation_rooms
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Server key can manage additional add-ons" on public.additional_add_ons;
create policy "Server key can manage additional add-ons"
  on public.additional_add_ons
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Server key can manage inventory items" on public.inventory_items;
create policy "Server key can manage inventory items"
  on public.inventory_items
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Server key can manage inventory transactions" on public.inventory_transactions;
create policy "Server key can manage inventory transactions"
  on public.inventory_transactions
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Server key can manage inventory reports" on public.inventory_reports;
create policy "Server key can manage inventory reports"
  on public.inventory_reports
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Server key can manage admin users" on public.admin_users;
create policy "Server key can manage admin users"
  on public.admin_users
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Server key can manage admin sessions" on public.admin_sessions;
create policy "Server key can manage admin sessions"
  on public.admin_sessions
  for all
  to service_role
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_data'
  ) then
    alter publication supabase_realtime add table public.app_data;
  end if;
end $$;
