// "My Rides" — a local record (this browser only, since there are no accounts) of
// the rides published from this device, so the creator can return to the secret
// manage page anytime to see bookings or delete the ride.

const KEY = 'sahpravas_my_rides';

export function getMyRides() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addMyRide(entry) {
  try {
    const list = getMyRides().filter((r) => r.id !== entry.id);
    list.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* localStorage unavailable — non-critical */
  }
}

export function removeMyRide(id) {
  try {
    localStorage.setItem(KEY, JSON.stringify(getMyRides().filter((r) => r.id !== id)));
  } catch {
    /* non-critical */
  }
}
