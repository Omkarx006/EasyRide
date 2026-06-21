-- ============================================================================
-- SahPravas — Migration 0004: anchor ride expiry to India Standard Time
--
-- Postgres `current_date` evaluates in UTC. For a Maharashtra app that means a
-- ride dated "today" only expires at 05:30 IST (UTC midnight), so yesterday's
-- departed rides linger every morning. We switch the expiry boundary to IST so
-- rides disappear exactly at IST midnight — matching what users expect and what
-- the frontend (local-date) already filters on.
--
-- sah_today() centralises the IST "today" so the SELECT policy, the INSERT
-- policy, and the booking RPC all agree.
-- ============================================================================

create or replace function public.sah_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Kolkata')::date;
$$;

grant execute on function public.sah_today() to anon, authenticated;

-- --- rides: read only rides that haven't passed (IST) ------------------------
drop policy if exists rides_select_active on public.rides;
create policy rides_select_active
  on public.rides for select to anon, authenticated
  using (journey_date >= public.sah_today());

-- --- rides: publish only today-or-future rides (IST) -------------------------
drop policy if exists rides_insert_public on public.rides;
create policy rides_insert_public
  on public.rides for insert to anon, authenticated
  with check (booked_seats = 0 and journey_date >= public.sah_today() and available_seats > 0);

-- --- book_seat: reject expired rides using the IST boundary ------------------
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
