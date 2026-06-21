import { supabase } from './supabase';
import { todayISO } from './format';

// All ride/booking data access lives here so components stay declarative and the
// backend contract is in one place.

// Fetch active rides (RLS already hides expired ones; we also filter defensively
// and order by soonest departure). Optional search narrows by city / date.
export async function fetchRides({ from, to, date } = {}) {
  let query = supabase
    .from('rides')
    .select('*')
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

// Insert a new ride. booked_seats defaults to 0 (and the RLS insert policy
// requires it), so we never send it from the client.
export async function createRide(ride) {
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
    })
    .select()
    .single();

  if (error) throw error;
  return data;
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
