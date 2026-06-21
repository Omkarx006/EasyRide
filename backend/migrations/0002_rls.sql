-- ============================================================================
-- SahPravas — Migration 0002: Row Level Security
--
-- No user auth exists. The public site uses the Supabase `anon` key, so every
-- policy below targets the `anon` (and `authenticated`, for completeness) role.
--
-- Design:
--   * rides   : anyone may READ active rides and PUBLISH a ride.
--               Expired rides (journey_date < today) are invisible — this is the
--               whole "expired rides disappear automatically" feature, enforced
--               at the database layer so no query can leak them and no cron is
--               needed.
--   * bookings: NO direct anon access. Seats are booked only through the
--               book_seat() SECURITY DEFINER function (migration 0003), which
--               runs as the table owner and therefore bypasses RLS safely.
-- ============================================================================

-- Base privileges (RLS still gates every row on top of these grants).
grant usage on schema public to anon, authenticated;
grant select, insert on public.rides to anon, authenticated;

alter table public.rides    enable row level security;
alter table public.bookings enable row level security;

-- --- rides: read only the active (non-expired) ones -------------------------
drop policy if exists rides_select_active on public.rides;
create policy rides_select_active
  on public.rides
  for select
  to anon, authenticated
  using (journey_date >= current_date);

-- --- rides: anyone may publish; cannot pre-seed booked seats ----------------
drop policy if exists rides_insert_public on public.rides;
create policy rides_insert_public
  on public.rides
  for insert
  to anon, authenticated
  with check (
    booked_seats = 0
    and journey_date >= current_date
    and available_seats > 0
  );

-- No UPDATE / DELETE policies => anon can neither edit nor remove rides.
-- Seat counts change only through book_seat() (definer-owned, bypasses RLS).

-- bookings has RLS enabled with NO policies => fully locked to anon.
