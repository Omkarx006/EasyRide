-- ============================================================================
-- SahPravas — Migration 0005: creator "Manage Ride" (private bookings + delete)
--
-- There are no accounts, so a ride's creator is identified by a SECRET token
-- generated when the ride is published and shown to them once (a "manage link").
--
--   * manage_token is NEVER exposed to public reads — anon's SELECT privilege is
--     narrowed to the non-secret columns only. The token is set by the client at
--     insert time (it generates the uuid), so it never needs to be read back.
--   * Bookings stay private: anon still can't read the bookings table. The
--     creator views them through get_ride_bookings(ride_id, token) which checks
--     the token (SECURITY DEFINER).
--   * delete_ride(ride_id, token) removes the ride only if the token matches;
--     bookings cascade away with it.
-- ============================================================================

-- Secret per-ride token (client supplies it; default is a safety net).
alter table public.rides
  add column if not exists manage_token uuid not null default gen_random_uuid();

-- Hide manage_token from public reads: drop the table-wide SELECT and re-grant
-- SELECT on the non-secret columns only. (Clients must select explicit columns,
-- not "*", which the app already does.)
revoke select on public.rides from anon, authenticated;
grant select (
  id, pickup_city, pickup_area, destination_city, destination_area,
  journey_date, journey_time, available_seats, booked_seats,
  driver_name, phone_number, created_at
) on public.rides to anon, authenticated;

-- --- view bookings for a ride, only with the correct manage token ------------
create or replace function public.get_ride_bookings(
  p_ride_id uuid,
  p_manage_token uuid
)
returns table (passenger_name text, passenger_phone text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.rides
    where id = p_ride_id and manage_token = p_manage_token
  ) then
    return; -- wrong token => no rows
  end if;

  return query
    select b.passenger_name, b.passenger_phone, b.created_at
    from public.bookings b
    where b.ride_id = p_ride_id
    order by b.created_at;
end;
$$;

grant execute on function public.get_ride_bookings(uuid, uuid) to anon, authenticated;

-- --- delete a ride, only with the correct manage token -----------------------
create or replace function public.delete_ride(
  p_ride_id uuid,
  p_manage_token uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  delete from public.rides
  where id = p_ride_id and manage_token = p_manage_token;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    return json_build_object('success', false, 'error', 'not_found_or_bad_token');
  end if;
  return json_build_object('success', true);
end;
$$;

grant execute on function public.delete_ride(uuid, uuid) to anon, authenticated;

-- Refresh PostgREST's schema cache so the new column + RPCs are usable at once.
notify pgrst, 'reload schema';
