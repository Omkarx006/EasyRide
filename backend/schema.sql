-- ============================================================================
-- SahPravas — Full schema (convenience copy of migrations 0001–0003)
--
-- This single file is equivalent to running, in order:
--   migrations/0001_init.sql
--   migrations/0002_rls.sql
--   migrations/0003_book_seat.sql
--
-- Paste it into the Supabase SQL Editor and Run, or apply the migrations
-- individually. Safe to re-run (idempotent).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- rides -----
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
  constraint seats_within_capacity check (booked_seats <= available_seats)
);

create index if not exists rides_journey_date_idx on public.rides (journey_date);
create index if not exists rides_route_idx        on public.rides (pickup_city, destination_city);
create index if not exists rides_created_at_idx    on public.rides (created_at desc);

-- ------------------------------------------------------------- bookings -----
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  ride_id         uuid        not null references public.rides(id) on delete cascade,
  passenger_name  text        not null,
  passenger_phone text        not null check (passenger_phone ~ '^[0-9]{10}$'),
  created_at      timestamptz not null default now()
);

create index if not exists bookings_ride_id_idx on public.bookings (ride_id);

-- ------------------------------------------------------------------ RLS -----
grant usage on schema public to anon, authenticated;
grant select, insert on public.rides to anon, authenticated;

alter table public.rides    enable row level security;
alter table public.bookings enable row level security;

-- IST "today" — ride expiry is anchored to India Standard Time, not UTC.
create or replace function public.sah_today()
returns date language sql stable as $$
  select (now() at time zone 'Asia/Kolkata')::date;
$$;
grant execute on function public.sah_today() to anon, authenticated;

drop policy if exists rides_select_active on public.rides;
create policy rides_select_active
  on public.rides for select to anon, authenticated
  using (journey_date >= public.sah_today());

drop policy if exists rides_insert_public on public.rides;
create policy rides_insert_public
  on public.rides for insert to anon, authenticated
  with check (booked_seats = 0 and journey_date >= public.sah_today() and available_seats > 0);

-- -------------------------------------------------------- book_seat RPC -----
create or replace function public.book_seat(
  p_ride_id         uuid,
  p_passenger_name  text,
  p_passenger_phone text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride       public.rides;
  v_booking_id uuid;
  v_name       text := trim(coalesce(p_passenger_name, ''));
begin
  if v_name = '' then
    return json_build_object('success', false, 'error', 'invalid_name');
  end if;
  if p_passenger_phone !~ '^[0-9]{10}$' then
    return json_build_object('success', false, 'error', 'invalid_phone');
  end if;

  select * into v_ride from public.rides where id = p_ride_id for update;

  if not found then
    return json_build_object('success', false, 'error', 'ride_not_found');
  end if;
  if v_ride.journey_date < public.sah_today() then
    return json_build_object('success', false, 'error', 'ride_expired');
  end if;
  if v_ride.booked_seats >= v_ride.available_seats then
    return json_build_object('success', false, 'error', 'no_seats');
  end if;

  insert into public.bookings (ride_id, passenger_name, passenger_phone)
  values (p_ride_id, v_name, p_passenger_phone)
  returning id into v_booking_id;

  update public.rides set booked_seats = booked_seats + 1 where id = p_ride_id;

  return json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'seats_left', v_ride.available_seats - (v_ride.booked_seats + 1)
  );
end;
$$;

grant execute on function public.book_seat(uuid, text, text) to anon, authenticated;
