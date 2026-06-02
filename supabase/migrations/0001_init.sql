-- Applied to the hosted project (ref ynemvghxsimezmsdewkh) via Supabase MCP on 2026-06-02.
-- Kept here for source control. All money columns are integer cents. Currency EUR.
create extension if not exists "pgcrypto";

create type deposit_mode as enum ('percent', 'flat');
create type block_reason as enum ('booked', 'maintenance', 'hold');
create type booking_status as enum ('pending_payment', 'confirmed', 'cancelled', 'expired');

create table yachts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  description text,
  hero_image text,
  gallery text[] default '{}',
  base_price integer not null default 0,
  included_guests integer not null default 1,
  extra_guest_price integer not null default 0,
  max_guests integer not null default 12,
  min_nights integer not null default 1,
  max_nights integer not null default 30,
  deposit_mode deposit_mode not null default 'percent',
  deposit_value integer not null default 20,
  season_start date,
  season_end date,
  currency text not null default 'EUR',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table service_options (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  name text not null,
  price integer not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table yacht_services (
  id uuid primary key default gen_random_uuid(),
  yacht_id uuid not null references yachts(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  price_override integer,
  is_active boolean not null default true,
  unique (yacht_id, service_id)
);

create table availability_blocks (
  id uuid primary key default gen_random_uuid(),
  yacht_id uuid not null references yachts(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason block_reason not null default 'hold',
  note text,
  created_at timestamptz not null default now()
);

create table booking_drafts (
  id uuid primary key default gen_random_uuid(),
  yacht_id uuid not null references yachts(id) on delete cascade,
  start_date date,
  end_date date,
  guests integer not null default 1,
  selected_options jsonb not null default '[]',
  computed_total integer not null default 0,
  computed_deposit integer not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '60 minutes')
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references booking_drafts(id),
  yacht_id uuid not null references yachts(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  start_date date not null,
  end_date date not null,
  guests integer not null,
  line_items jsonb not null default '[]',
  total integer not null,
  deposit integer not null,
  currency text not null default 'EUR',
  stripe_session_id text,
  stripe_payment_intent text,
  status booking_status not null default 'pending_payment',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index on availability_blocks (yacht_id, start_date, end_date);
create index on bookings (yacht_id, status);
create index on booking_drafts (expires_at);
