import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SearchForm from '../components/SearchForm';
import Filters from '../components/Filters';
import RideCard from '../components/RideCard';
import BookingModal from '../components/BookingModal';
import { Loader, ErrorState, EmptyRides, ConfigNotice } from '../components/States';
import { fetchRides } from '../lib/rides';
import { isSupabaseConfigured } from '../lib/supabase';
import { timeBucket, seatsLeft } from '../lib/format';

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
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [bookingRide, setBookingRide] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchRides(search);
      setRides(data);
    } catch {
      setError(true);
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
      if (filters.time !== 'all' && timeBucket(ride.journey_time) !== filters.time) return false;
      if (filters.seats > 0 && seatsLeft(ride) < filters.seats) return false;
      return true;
    });
  }, [rides, filters]);

  const hasActiveFilters = filters.time !== 'all' || filters.seats > 0;

  function handleSearch(params) {
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    if (params.date) qs.set('date', params.date);
    setSearchParams(qs);
  }

  // Reflect a successful booking locally without a full refetch.
  function handleBooked(seatsLeftAfter) {
    if (!bookingRide) return;
    setRides((prev) =>
      prev.map((r) =>
        r.id === bookingRide.id
          ? { ...r, booked_seats: r.available_seats - seatsLeftAfter }
          : r,
      ),
    );
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
        <ErrorState onRetry={load} />
      ) : visibleRides.length === 0 ? (
        <EmptyRides />
      ) : (
        <>
          <p className="mb-4 text-sm font-medium text-slate-500">
            {t('rides.results', { count: visibleRides.length })}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} onBook={setBookingRide} />
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
    </div>
  );
}
