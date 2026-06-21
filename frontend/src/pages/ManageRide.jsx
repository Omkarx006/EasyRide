import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchRideById, getRideBookings, deleteRide } from '../lib/rides';
import { isSupabaseConfigured } from '../lib/supabase';
import { formatDate, formatTime, seatsLeft } from '../lib/format';
import { Loader, ConfigNotice } from '../components/States';
import {
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  PhoneIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  XIcon,
} from '../components/Icons';

export default function ManageRide() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const { id } = useParams();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [rideData, bookingData] = await Promise.all([
        fetchRideById(id),
        getRideBookings(id, token),
      ]);
      if (!rideData) {
        setInvalid(true);
      } else {
        setRide(rideData);
        setBookings(bookingData);
      }
    } catch {
      setInvalid(true);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (isSupabaseConfigured) load();
    else setLoading(false);
  }, [load]);

  async function confirmDelete() {
    setDeleting(true);
    setError('');
    try {
      const result = await deleteRide(id, token);
      if (result?.success) {
        setDeleted(true);
        setConfirming(false);
      } else {
        setError(t('manage.deleteError'));
      }
    } catch {
      setError(t('manage.deleteError'));
    } finally {
      setDeleting(false);
    }
  }

  if (!isSupabaseConfigured) return <ConfigNotice />;

  if (loading) {
    return (
      <div className="container-px py-10">
        <Loader label={t('manage.loading')} />
      </div>
    );
  }

  if (deleted) {
    return (
      <div className="container-px py-12">
        <div className="card mx-auto max-w-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircleIcon className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">{t('manage.deletedTitle')}</h2>
          <p className="mt-2 text-sm text-slate-600">{t('manage.deletedMessage')}</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-6 w-full">
            {t('manage.backHome')}
          </button>
        </div>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="container-px py-12">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h2 className="text-lg font-bold text-slate-900">{t('manage.invalidLink')}</h2>
          <p className="mt-2 text-sm text-slate-600">{t('manage.invalidLinkMessage')}</p>
          <Link to="/rides" className="btn-secondary mt-6">
            {t('nav.findRide')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-px py-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('manage.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('manage.subtitle')}</p>
        </header>

        {/* Ride summary */}
        <section className="card mb-6 p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t('manage.rideSummary')}
          </h2>
          <div className="flex flex-wrap items-center gap-x-2 text-lg font-bold text-slate-900">
            <span>{ride.pickup_city}</span>
            <ArrowRightIcon className="h-4 w-4 text-brand-500" />
            <span>{ride.destination_city}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
            {ride.pickup_area} → {ride.destination_area}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Meta icon={<CalendarIcon className="h-4 w-4" />} value={formatDate(ride.journey_date, lang)} />
            <Meta icon={<ClockIcon className="h-4 w-4" />} value={formatTime(ride.journey_time, lang)} />
            <Meta
              icon={<UsersIcon className="h-4 w-4" />}
              value={`${seatsLeft(ride)} / ${ride.available_seats}`}
            />
          </div>
        </section>

        {/* Bookings */}
        <section className="card mb-6 p-5">
          <h2 className="mb-3 flex items-center justify-between text-sm font-bold text-slate-900">
            <span>{t('manage.bookingsTitle')}</span>
            <span className="chip bg-brand-50 text-brand-700">
              {t('manage.bookingsCount', { count: bookings.length })}
            </span>
          </h2>
          {bookings.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">{t('manage.noBookings')}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {bookings.map((b, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700">
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-800">{b.passenger_name}</span>
                  </div>
                  <a
                    href={`tel:+91${b.passenger_phone}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    {b.passenger_phone}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Danger zone */}
        <section className="card border-red-100 p-5">
          {error && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          <button
            onClick={() => setConfirming(true)}
            className="btn w-full border border-red-200 bg-white text-red-600 hover:bg-red-50"
          >
            {t('manage.deleteRide')}
          </button>
        </section>
      </div>

      {/* Confirm delete modal */}
      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => !deleting && setConfirming(false)}
        >
          <div
            className="animate-pop-in w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t('manage.confirmTitle')}</h3>
              <button
                onClick={() => !deleting && setConfirming(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                aria-label={t('common.close')}
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">{t('manage.confirmMessage')}</p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="btn-secondary flex-1"
              >
                {t('manage.confirmNo')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="btn flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                {deleting ? t('manage.deleting') : t('manage.confirmYes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ icon, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <span className="truncate font-semibold text-slate-800">{value}</span>
    </div>
  );
}
