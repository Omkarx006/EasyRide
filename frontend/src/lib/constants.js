// Static, non-translated data. City names are proper nouns shown the same in both
// languages; the field is also free-text (datalist) so any town can be entered.

export const MAHARASHTRA_CITIES = [
  'Mumbai',
  'Pune',
  'Nagpur',
  'Nashik',
  'Chhatrapati Sambhajinagar',
  'Solapur',
  'Kolhapur',
  'Beed',
  'Latur',
  'Dharashiv',
  'Nanded',
  'Parbhani',
  'Jalna',
  'Hingoli',
  'Ahilyanagar',
  'Satara',
  'Sangli',
  'Akola',
  'Amravati',
  'Yavatmal',
  'Wardha',
  'Chandrapur',
  'Dhule',
  'Jalgaon',
  'Nandurbar',
  'Ratnagiri',
  'Sindhudurg',
  'Raigad',
  'Thane',
  'Palghar',
  'Buldhana',
  'Washim',
  'Gondia',
  'Bhandara',
  'Gadchiroli',
];

// Time-of-day buckets (24h start/end, end exclusive). Night wraps past midnight.
export const TIME_BUCKETS = ['morning', 'afternoon', 'evening', 'night'];

// Seat filter options (minimum seats available).
export const SEAT_FILTER_OPTIONS = [1, 2, 3, 4];

// Sensible upper bound for the seats input (shared-vehicle reality check).
export const MAX_SEATS = 7;
