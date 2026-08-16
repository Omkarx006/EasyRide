// "My Rides" — a local record (this browser only, since there are no accounts) of
// the rides published from this device, so the creator can return to the secret
// manage page anytime to see bookings or delete the ride.
//
// Entry shape:
//   { id, token, route, date, time }
// `date` is the journey date (YYYY-MM-DD) and `time` the departure time (HH:MM),
// i.e. the very same values stored on the ride row — no second date system.
// Entries saved before `time` existed simply omit it (see isPastMyRide).

import { isRideActive, todayISO } from './format';

const KEY = 'sahpravas_my_rides';

export function getMyRides() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* localStorage unavailable — non-critical */
  }
}

export function addMyRide(entry) {
  write([entry, ...getMyRides().filter((r) => r.id !== entry.id)]);
}

export function removeMyRide(id) {
  write(getMyRides().filter((r) => r.id !== id));
}

// A locally listed ride is "past" once it has left the ride listing — the exact
// same rule the Rides page uses (departure + RIDE_GRACE_MINUTES), so nothing here
// can disappear from this dashboard while it is still bookable elsewhere.
// Older entries have no `time`: they can only be judged by whole days, so they
// count as past from the next calendar day onwards.
export function isPastMyRide(entry, nowMs = Date.now()) {
  if (!entry?.date) return false;
  if (!entry.time) return entry.date < todayISO();
  return !isRideActive({ journey_date: entry.date, journey_time: entry.time }, nowMs);
}

export function countPastMyRides(nowMs = Date.now()) {
  return getMyRides().filter((r) => isPastMyRide(r, nowMs)).length;
}

// Drop only the past rides from this device's dashboard. Nothing is deleted on
// the server, and no other stored data (bookings, language, …) is touched.
export function clearPastMyRides(nowMs = Date.now()) {
  const kept = getMyRides().filter((r) => !isPastMyRide(r, nowMs));
  write(kept);
  return kept;
}
