// Date / time helpers. All formatting is locale-aware so dates and times render
// correctly in both English and Marathi.

const LOCALE_MAP = { en: 'en-IN', mr: 'mr-IN' };

function intlLocale(lang) {
  return LOCALE_MAP[lang] || 'en-IN';
}

// Today's date as YYYY-MM-DD in the user's LOCAL timezone (not UTC), so the
// date picker's min and "past date" checks match the calendar the user sees.
export function todayISO() {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

// "2026-07-15" -> "15 Jul 2026" (localized).
export function formatDate(isoDate, lang) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(intlLocale(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

// "17:30:00" / "17:30" -> "5:30 PM" (localized).
export function formatTime(timeStr, lang) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date(2000, 0, 1, h, m || 0);
  return new Intl.DateTimeFormat(intlLocale(lang), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// Map a "HH:MM[:SS]" time to a part-of-day bucket used by the filter.
//   morning   05:00–11:59
//   afternoon 12:00–16:59
//   evening   17:00–20:59
//   night     21:00–04:59
export function timeBucket(timeStr) {
  if (!timeStr) return null;
  const hour = Number(timeStr.split(':')[0]);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function seatsLeft(ride) {
  return Math.max(0, (ride.available_seats ?? 0) - (ride.booked_seats ?? 0));
}
