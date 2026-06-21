-- ============================================================================
-- SahPravas — Migration 0001: core schema
-- Tables: rides, bookings
-- Run order: 0001 -> 0002 -> 0003
-- ============================================================================

-- gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- rides: a published trip with available seats
-- ---------------------------------------------------------------------------
create table if not exists public.rides (
  id                uuid primary key default gen_random_uuid(),
  pickup_city       text        not null,
  pickup_area       text        not null,
  destination_city  text        not null,
  destination_area  text        not null,
  journey_date      date        not null,
  journey_time      time        not null,
  available_seats   integer     not null check (available_seats > 0),
  booked_seats      integer     not null default 0 check (booked_seats >= 0),
  driver_name       text        not null,
  phone_number      text        not null check (phone_number ~ '^[0-9]{10}$'),
  created_at        timestamptz not null default now(),

  -- A ride can never have more bookings than seats.
  constraint seats_within_capacity check (booked_seats <= available_seats)
);

comment on table public.rides is 'Published trips with available seats. Expired rides (journey_date < today) are hidden by RLS.';

create index if not exists rides_journey_date_idx on public.rides (journey_date);
create index if not exists rides_route_idx        on public.rides (pickup_city, destination_city);
create index if not exists rides_created_at_idx    on public.rides (created_at desc);

-- ---------------------------------------------------------------------------
-- bookings: one seat reserved on a ride by a passenger
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  ride_id         uuid        not null references public.rides(id) on delete cascade,
  passenger_name  text        not null,
  passenger_phone text        not null check (passenger_phone ~ '^[0-9]{10}$'),
  created_at      timestamptz not null default now()
);

comment on table public.bookings is 'Seat reservations. Created only via the book_seat() RPC to guarantee atomic, overbooking-safe writes.';

create index if not exists bookings_ride_id_idx on public.bookings (ride_id);
