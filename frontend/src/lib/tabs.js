// The four main mobile screens, in swipe order. They map onto routes that
// already exist (plus /my-bookings, the passenger counterpart of /my-rides) —
// this is only a navigation model, not a second router.
//
//   Find Ride  ←→  Offer Ride  ←→  Created Rides  ←→  My Bookings
//
// "Created Rides" are rides you published; "My Bookings" are seats you booked
// as a passenger. They are deliberately separate screens.

import { SearchIcon, PlusIcon, CarIcon, TicketIcon } from '../components/Icons';

export const TABS = [
  { key: 'find', path: '/rides', labelKey: 'nav.tabs.find', Icon: SearchIcon },
  { key: 'offer', path: '/create', labelKey: 'nav.tabs.offer', Icon: PlusIcon },
  { key: 'created', path: '/my-rides', labelKey: 'nav.tabs.created', Icon: CarIcon },
  { key: 'bookings', path: '/my-bookings', labelKey: 'nav.tabs.bookings', Icon: TicketIcon },
];

// Position of a pathname in the swipe order, or -1 when it isn't a main screen
// (Home and the private /manage/:id page are reachable but not swipeable).
export function tabIndex(pathname) {
  return TABS.findIndex((tab) => tab.path === pathname);
}
