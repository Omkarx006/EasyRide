// "My Bookings" — a local record (this browser only, since there are no accounts)
// of the bookings made from this device. Each entry keeps the booking's secret
// booking_token, which is the passenger's ONLY proof of ownership and the only
// way to edit that booking later. This is how the app knows which bookings belong
// to the current user without any login — and why the ride creator (who never has
// these tokens) can never edit a passenger's booking.
//
// Entry shape:
//   { bookingId, token, rideId, passengerName, passengerPhone, seats,
//     route, date, createdAt }

const KEY = 'sahpravas_my_bookings';

export function getMyBookings() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// All bookings this browser made for one ride (newest first).
export function getBookingsForRide(rideId) {
  return getMyBookings().filter((b) => b.rideId === rideId);
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    /* localStorage unavailable — non-critical */
  }
}

// Add a brand-new booking (does NOT overwrite others for the same ride — multiple
// bookings on one ride are all kept, keyed by their unique bookingId).
export function addMyBooking(entry) {
  const list = getMyBookings().filter((b) => b.bookingId !== entry.bookingId);
  list.unshift({ ...entry, createdAt: entry.createdAt || new Date().toISOString() });
  write(list);
}

// Patch a single booking in place (e.g. after an edit).
export function updateMyBooking(bookingId, patch) {
  write(getMyBookings().map((b) => (b.bookingId === bookingId ? { ...b, ...patch } : b)));
}

export function removeMyBooking(bookingId) {
  write(getMyBookings().filter((b) => b.bookingId !== bookingId));
}
