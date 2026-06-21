-- ============================================================================
-- SahPravas — Migration 0003: atomic seat booking RPC
--
-- book_seat() is the ONLY way a booking is written. It:
--   1. Locks the ride row (FOR UPDATE) so concurrent calls serialize.
--   2. Rejects expired rides and full rides.
--   3. Inserts the booking and increments booked_seats in the same transaction.
--
-- Because it is SECURITY DEFINER and owned by the migration runner (the
-- table owner), it bypasses RLS on `bookings` — which is exactly why anon has
-- no direct insert rights there. Overbooking is impossible even under load.
--
-- Returns JSON: { success, error?, booking_id?, seats_left? }
-- ============================================================================

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
  -- --- validation ----------------------------------------------------------
  if v_name = '' then
    return json_build_object('success', false, 'error', 'invalid_name');
  end if;

  if p_passenger_phone !~ '^[0-9]{10}$' then
    return json_build_object('success', false, 'error', 'invalid_phone');
  end if;

  -- --- lock the ride so two passengers can't grab the last seat ------------
  select * into v_ride
  from public.rides
  where id = p_ride_id
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'ride_not_found');
  end if;

  if v_ride.journey_date < current_date then
    return json_build_object('success', false, 'error', 'ride_expired');
  end if;

  if v_ride.booked_seats >= v_ride.available_seats then
    return json_build_object('success', false, 'error', 'no_seats');
  end if;

  -- --- write booking + bump the counter atomically -------------------------
  insert into public.bookings (ride_id, passenger_name, passenger_phone)
  values (p_ride_id, v_name, p_passenger_phone)
  returning id into v_booking_id;

  update public.rides
  set booked_seats = booked_seats + 1
  where id = p_ride_id;

  return json_build_object(
    'success',    true,
    'booking_id', v_booking_id,
    'seats_left', v_ride.available_seats - (v_ride.booked_seats + 1)
  );
end;
$$;

-- Let the public site call it.
grant execute on function public.book_seat(uuid, text, text) to anon, authenticated;
