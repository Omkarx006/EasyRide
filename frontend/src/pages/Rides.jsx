import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SearchForm from '../components/SearchForm';
import Filters from '../components/Filters';
import RideCard from '../components/RideCard';
import BookingModal from '../components/BookingModal';
import MyBookingModal from '../components/MyBookingModal';
import { Loader, ErrorState, EmptyRides, ConfigNotice } from '../components/States';
import { fetchRides, isNetworkError } from '../lib/rides';
import { getMyBookings } from '../lib/myBookings';
import { isSupabaseConfigured } from '../lib/supabase';
import { timeBucket, seatsLeft, isRideActive } from '../lib/format';

const DEFAULT_FILTERS = { time: 'all', seats: 0 };

export default function Rides() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = useMemo(
    () => ({
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
      date: searchParams.get('date') || '',
    }),
    [searchParams],
  );

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  // null = no error; otherwise a { message } describing the failure.
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [bookingRide, setBookingRide] = useState(null);
  const [manageRide, setManageRide] = useState(null);
  // Bumped whenever this browser's bookings change, so cards + modals re-read them.
  const [bookingsTick, setBookingsTick] = useState(0);
  const refreshBookings = useCallback(() => setBookingsTick((n) => n + 1), []);
  // Re-evaluated every minute so rides drop off the moment they pass their
  // (journey time + 1h) expiry, even while the page stays open.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRides(search);
      setRides(data);
    } catch (err) {
      // Backend unreachable (DNS/offline/project down) gets a clearer message;
      // anything else falls back to the generic error title.
      setError({ message: isNetworkError(err) ? t('common.unreachable') : '' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (isSupabaseConfigured) load();
    else setLoading(false);
  }, [load]);

  // Client-side refinement: time-of-day bucket + minimum seats available.
  const visibleRides = useMemo(() => {
    return rides.filter((ride) => {
      // Disappear 1h after departure time. Full rides stay (shown "Fully booked").
      if (!isRideActive(ride, now)) return false;
      if (filters.time !== 'all' && timeBucket(ride.journey_time) !== filters.time) return false;
      if (filters.seats > 0 && seatsLeft(ride) < filters.seats) return false;
      return true;
    });
  }, [rides, filters, now]);

  const hasActiveFilters = filters.time !== 'all' || filters.seats > 0;

  // This browser's bookings, grouped by ride id (re-read whenever they change).
  const bookingsByRide = useMemo(() => {
    const map = {};
    for (const b of getMyBookings()) (map[b.rideId] ||= []).push(b);
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingsTick]);

  // Keep a ride's local seat count in sync after a booking/edit changes it.
  const applySeatsLeft = useCallback((rideId, seatsLeftAfter) => {
    if (typeof seatsLeftAfter !== 'number') return;
    setRides((prev) =>
      prev.map((r) =>
        r.id === rideId ? { ...r, booked_seats: r.available_seats - seatsLeftAfter } : r,
      ),
    );
  }, []);

  function handleSearch(params) {
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    if (params.date) qs.set('date', params.date);
    setSearchParams(qs);
  }

  // Reflect a successful booking locally without a full refetch.
  function handleBooked(result) {
    if (bookingRide) applySeatsLeft(bookingRide.id, result?.seats_left);
    refreshBookings();
  }

  if (!isSupabaseConfigured) return <ConfigNotice />;

  return (
    <div className="container-px py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('rides.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('rides.subtitle')}</p>
      </header>

      {/* Refine search */}
      <div className="card mb-6 p-4 sm:p-5">
        <SearchForm initial={search} onSubmit={handleSearch} compact />
      </div>

      {/* Filters */}
      <div className="card mb-6 p-4 sm:p-5">
        <Filters
          value={filters}
          onChange={setFilters}
          onClear={() => setFilters(DEFAULT_FILTERS)}
          showClear={hasActiveFilters}
        />
      </div>

      {/* Results */}
      {loading ? (
        <Loader label={t('rides.loading')} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={load} />
      ) : visibleRides.length === 0 ? (
        <EmptyRides />
      ) : (
        <>
          <p className="mb-4 text-sm font-medium text-slate-500">
            {t('rides.results', { count: visibleRides.length })}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                bookings={bookingsByRide[ride.id] || []}
                onBook={setBookingRide}
                onManageBookings={setManageRide}
              />
            ))}
          </div>
        </>
      )}

      {bookingRide && (
        <BookingModal
          ride={bookingRide}
          onClose={() => setBookingRide(null)}
          onBooked={handleBooked}
        />
      )}

      {manageRide && (
        <MyBookingModal
          ride={manageRide}
          bookings={bookingsByRide[manageRide.id] || []}
          onClose={() => setManageRide(null)}
          onBookAgain={(r) => {
            setManageRide(null);
            setBookingRide(rides.find((x) => x.id === r.id) || r);
          }}
          onChanged={(seatsLeftAfter) => {
            applySeatsLeft(manageRide.id, seatsLeftAfter);
            refreshBookings();
          }}
        />
      )}
    </div>
  );
}
