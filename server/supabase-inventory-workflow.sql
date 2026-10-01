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

create index if not exists inventory_items_archived_idx
  on public.inventory_items(archived);

create index if not exists inventory_items_room_id_idx
  on public.inventory_items(room_id);

create index if not exists inventory_reports_room_id_idx
  on public.inventory_reports(room_id);

create index if not exists inventory_transactions_booking_reference_idx
  on public.inventory_transactions(booking_reference);
