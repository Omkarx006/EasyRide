-- ============================================================================
-- SahPravas — Migration 0006: multi-seat bookings + passenger-owned edits
--
-- Adds, WITHOUT introducing accounts/auth:
--   * bookings.seats         — how many seats one booking reserves (was implicitly 1)
--   * bookings.booking_token — a per-booking SECRET the passenger keeps in their
--       browser. It is the passenger's proof of ownership, exactly like a ride's
--       manage_token is the creator's proof. anon has NO direct access to the
--       bookings table, so the token is never exposed by a public read, and it is
--       never handed to the ride creator. Therefore ONLY the person who made a
--       booking can edit it — the creator cannot touch passenger name/phone/seats.
--
--   * book_seat()      now reserves p_seats seats atomically and returns the new
--                      booking's id + token + seats_left.
--   * get_booking()    returns one booking's details (+ ride summary), token-gated,
--                      so the "My Booking" view reads the real booking record.
--   * update_booking() lets the passenger edit name/phone/seats (token-gated) and
--                      keeps rides.booked_seats correct when the seat count changes
--                      (growing a booking re-checks availability first).
--   * get_ride_bookings() also returns seats now (creator's manage page totals).
--
-- Safe to re-run (idempotent). Existing bookings default to seats = 1 and get a
-- fresh booking_token (harmless — nobody was tracking those old bookings anyway).
-- ============================================================================

alter table public.bookings
  add column if not exists seats         int  not null default 1 check (seats > 0),
  add column if not exists booking_token uuid not null default gen_random_uuid();

-- --- book_seat: reserve p_seats atomically; return booking id + token ---------
drop function if exists public.book_seat(uuid, text, text);
create or replace function public.book_seat(
  p_ride_id         uuid,
  p_passenger_name  text,
  p_passenger_phone text,
  p_seats           int default 1
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride    public.rides;
  v_booking public.bookings;
  v_name    text := trim(coalesce(p_passenger_name, ''));
  v_seats   int  := coalesce(p_seats, 1);
begin
  if v_name = '' then
    return json_build_object('success', false, 'error', 'invalid_name');
  end if;
  if p_passenger_phone !~ '^[0-9]{10}$' then
    return json_build_object('success', false, 'error', 'invalid_phone');
  end if;
  if v_seats < 1 then
    return json_build_object('success', false, 'error', 'invalid_seats');
  end if;

  select * into v_ride from public.rides where id = p_ride_id for update;

  if not found then
    return json_build_object('success', false, 'error', 'ride_not_found');
  end if;
  if v_ride.journey_date < public.sah_today() then
    return json_build_object('success', false, 'error', 'ride_expired');
  end if;
  if v_ride.booked_seats + v_seats > v_ride.available_seats then
    return json_build_object('success', false, 'error', 'no_seats');
  end if;

  insert into public.bookings (ride_id, passenger_name, passenger_phone, seats)
  values (p_ride_id, v_name, p_passenger_phone, v_seats)
  returning * into v_booking;

  update public.rides set booked_seats = booked_seats + v_seats where id = p_ride_id;

  return json_build_object(
    'success', true,
    'booking_id', v_booking.id,
    'booking_token', v_booking.booking_token,
    'seats', v_seats,
    'seats_left', v_ride.available_seats - (v_ride.booked_seats + v_seats)
  );
end;
$$;
grant execute on function public.book_seat(uuid, text, text, int) to anon, authenticated;

-- --- get_booking: passenger reads their own booking (+ ride), token-gated -----
create or replace function public.get_booking(p_booking_id uuid, p_booking_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_b public.bookings;
  v_r public.rides;
begin
  select * into v_b from public.bookings
    where id = p_booking_id and booking_token = p_booking_token;
  if not found then
    return json_build_object('success', false, 'error', 'not_found_or_bad_token');
  end if;
  select * into v_r from public.rides where id = v_b.ride_id;
  return json_build_object(
    'success', true,
    'booking_id', v_b.id,
    'passenger_name', v_b.passenger_name,
    'passenger_phone', v_b.passenger_phone,
    'seats', v_b.seats,
    'ride', json_build_object(
      'id', v_r.id,
      'pickup_city', v_r.pickup_city,
      'pickup_area', v_r.pickup_area,
      'destination_city', v_r.destination_city,
      'destination_area', v_r.destination_area,
      'journey_date', v_r.journey_date,
      'journey_time', v_r.journey_time,
      'available_seats', v_r.available_seats,
      'booked_seats', v_r.booked_seats,
      'seats_left', v_r.available_seats - v_r.booked_seats
    )
  );
end;
$$;
grant execute on function public.get_booking(uuid, uuid) to anon, authenticated;

-- --- update_booking: passenger edits their booking (token-gated) --------------
create or replace function public.update_booking(
  p_booking_id      uuid,
  p_booking_token   uuid,
  p_passenger_name  text,
  p_passenger_phone text,
  p_seats           int
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_b     public.bookings;
  v_ride  public.rides;
  v_name  text := trim(coalesce(p_passenger_name, ''));
  v_seats int  := coalesce(p_seats, 1);
  v_delta int;
begin
  if v_name = '' then
    return json_build_object('success', false, 'error', 'invalid_name');
  end if;
  if p_passenger_phone !~ '^[0-9]{10}$' then
    return json_build_object('success', false, 'error', 'invalid_phone');
  end if;
  if v_seats < 1 then
    return json_build_object('success', false, 'error', 'invalid_seats');
  end if;

  -- Lock the booking, verifying ownership via the secret token. A caller without
  -- the exact token (e.g. the ride creator) matches no row and is rejected.
  select * into v_b from public.bookings
    where id = p_booking_id and booking_token = p_booking_token
    for update;
  if not found then
    return json_build_object('success', false, 'error', 'not_found_or_bad_token');
  end if;

  select * into v_ride from public.rides where id = v_b.ride_id for update;
  if not found then
    return json_build_object('success', false, 'error', 'ride_not_found');
  end if;

  v_delta := v_seats - v_b.seats;
  -- Only re-check availability when growing the booking.
  if v_delta > 0 and v_ride.booked_seats + v_delta > v_ride.available_seats then
    return json_build_object('success', false, 'error', 'no_seats');
  end if;

  update public.bookings
    set passenger_name  = v_name,
        passenger_phone = p_passenger_phone,
        seats           = v_seats
    where id = p_booking_id;

  if v_delta <> 0 then
    update public.rides set booked_seats = booked_seats + v_delta where id = v_ride.id;
  end if;

  return json_build_object(
    'success', true,
    'booking_id', v_b.id,
    'seats', v_seats,
    'seats_left', v_ride.available_seats - (v_ride.booked_seats + v_delta)
  );
end;
$$;
grant execute on function public.update_booking(uuid, uuid, text, text, int) to anon, authenticated;

-- --- get_ride_bookings: include seats for the creator's manage page -----------
drop function if exists public.get_ride_bookings(uuid, uuid);
create or replace function public.get_ride_bookings(p_ride_id uuid, p_manage_token uuid)
returns table (passenger_name text, passenger_phone text, seats int, created_at timestamptz)
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.rides where id = p_ride_id and manage_token = p_manage_token
  ) then
    return; -- wrong token => no rows
  end if;
  return query
    select b.passenger_name, b.passenger_phone, b.seats, b.created_at
    from public.bookings b where b.ride_id = p_ride_id order by b.created_at;
end;
$$;
grant execute on function public.get_ride_bookings(uuid, uuid) to anon, authenticated;

-- Refresh PostgREST's schema cache so the new columns + RPCs are usable at once.
notify pgrst, 'reload schema';
