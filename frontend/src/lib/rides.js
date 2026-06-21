import { supabase } from './supabase';
import { todayISO } from './format';

// All ride/booking data access lives here so components stay declarative and the
// backend contract is in one place.

// Non-secret ride columns. We never select "*" because the secret manage_token
// column is not readable by the anon role (see migration 0005).
const RIDE_COLUMNS =
  'id,pickup_city,pickup_area,destination_city,destination_area,' +
  'journey_date,journey_time,available_seats,booked_seats,driver_name,phone_number,created_at';

// Fetch active rides (RLS already hides expired ones; we also filter defensively
// and order by soonest departure). Optional search narrows by city / date.
export async function fetchRides({ from, to, date } = {}) {
  let query = supabase
    .from('rides')
    .select(RIDE_COLUMNS)
    .gte('journey_date', todayISO())
    .order('journey_date', { ascending: true })
    .order('journey_time', { ascending: true });

  if (from) query = query.ilike('pickup_city', from.trim());
  if (to) query = query.ilike('destination_city', to.trim());
  if (date) query = query.eq('journey_date', date);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// Fetch a single ride by id (non-secret columns). Returns null if not found /
// not visible (e.g. expired).
export async function fetchRideById(id) {
  const { data, error } = await supabase
    .from('rides')
    .select(RIDE_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Insert a new ride. The client generates the secret manage_token so it never
// has to be read back from the server; it's returned here so the UI can build
// the creator's private "manage" link.
export async function createRide(ride) {
  const manageToken =
    (globalThis.crypto && globalThis.crypto.randomUUID && globalThis.crypto.randomUUID()) ||
    // Fallback for very old browsers (not cryptographically strong, rarely used).
    `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;

  const { data, error } = await supabase
    .from('rides')
    .insert({
      pickup_city: ride.pickup_city.trim(),
      pickup_area: ride.pickup_area.trim(),
      destination_city: ride.destination_city.trim(),
      destination_area: ride.destination_area.trim(),
      journey_date: ride.journey_date,
      journey_time: ride.journey_time,
      available_seats: Number(ride.available_seats),
      driver_name: ride.driver_name.trim(),
      phone_number: ride.phone_number.trim(),
      manage_token: manageToken,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: data.id, manage_token: manageToken };
}

// Book one seat via the atomic SECURITY DEFINER RPC. Returns the parsed result:
//   { success: true, booking_id, seats_left } | { success: false, error: <code> }
export async function bookSeat({ rideId, passengerName, passengerPhone }) {
  const { data, error } = await supabase.rpc('book_seat', {
    p_ride_id: rideId,
    p_passenger_name: passengerName.trim(),
    p_passenger_phone: passengerPhone.trim(),
  });
  if (error) throw error;
  return data;
}

// Creator-only: list passengers who booked a ride, gated by the manage token.
export async function getRideBookings(rideId, manageToken) {
  const { data, error } = await supabase.rpc('get_ride_bookings', {
    p_ride_id: rideId,
    p_manage_token: manageToken,
  });
  if (error) throw error;
  return data ?? [];
}

// Creator-only: delete a ride, gated by the manage token.
export async function deleteRide(rideId, manageToken) {
  const { data, error } = await supabase.rpc('delete_ride', {
    p_ride_id: rideId,
    p_manage_token: manageToken,
  });
  if (error) throw error;
  return data;
}
