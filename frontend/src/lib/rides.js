import { supabase } from './supabase';
import { todayISO, isRideActive } from './format';

// All ride/booking data access lives here so components stay declarative and the
// backend contract is in one place.

// True when an error is a transport-level failure (DNS/offline/host unreachable)
// rather than a Postgrest/DB error. Fetch rejections surface as a TypeError with
// a "Failed to fetch"-style message and carry no Postgrest `code`; real DB errors
// (RLS, constraints, …) always have a `code`. Used to show a clearer
// "service unavailable" message instead of a generic retry loop.
export function isNetworkError(err) {
  if (!err) return false;
  if (err.code) return false; // Postgrest/DB error, not a transport failure.
  const msg = String(err.message || err).toLowerCase();
  return (
    err.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed')
  );
}

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
  // Hide rides that are already 1h past their departure time. (RLS hides whole
  // past DATES; this also drops today's rides whose time has come and gone.)
  // Fully-booked rides stay visible (shown as "Fully booked") until they expire.
  return (data ?? []).filter((ride) => isRideActive(ride));
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

// Book `seats` seats via the atomic SECURITY DEFINER RPC. Returns the parsed result:
//   { success: true, booking_id, booking_token, seats, seats_left }
//   | { success: false, error: <code> }
// booking_token is the passenger's private proof of ownership — store it locally
// (see myBookings.js); it is the only way to later edit this booking.
export async function bookSeat({ rideId, passengerName, passengerPhone, seats = 1 }) {
  const { data, error } = await supabase.rpc('book_seat', {
    p_ride_id: rideId,
    p_passenger_name: passengerName.trim(),
    p_passenger_phone: passengerPhone.trim(),
    p_seats: Number(seats) || 1,
  });
  if (error) throw error;
  return data;
}

// Passenger-only: edit an existing booking, gated by its secret booking_token.
// Adjusts the ride's seat count atomically (and re-checks availability when the
// seat count grows). Returns { success, seats, seats_left } | { success:false, error }.
export async function updateBooking({
  bookingId,
  bookingToken,
  passengerName,
  passengerPhone,
  seats,
}) {
  const { data, error } = await supabase.rpc('update_booking', {
    p_booking_id: bookingId,
    p_booking_token: bookingToken,
    p_passenger_name: passengerName.trim(),
    p_passenger_phone: passengerPhone.trim(),
    p_seats: Number(seats) || 1,
  });
  if (error) throw error;
  return data;
}

// Passenger-only: fetch one booking's authoritative details (+ ride summary),
// gated by its secret booking_token.
export async function getBooking(bookingId, bookingToken) {
  const { data, error } = await supabase.rpc('get_booking', {
    p_booking_id: bookingId,
    p_booking_token: bookingToken,
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
