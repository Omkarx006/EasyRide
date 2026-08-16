import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BookingModal from '../components/BookingModal';
import MyBookingModal from '../components/MyBookingModal';
import { Loader, ConfigNotice } from '../components/States';
import { fetchRideById } from '../lib/rides';
import { getMyBookings, removeMyBooking } from '../lib/myBookings';
import { isSupabaseConfigured } from '../lib/supabase';
import { formatDate, formatTime } from '../lib/format';
import {
  TicketIcon,
  PhoneIcon,
  WhatsAppIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  ArrowRightIcon,
} from '../components/Icons';

// Seats booked from this device, as a passenger — the counterpart of "My Rides"
// (rides published from this device). Ownership is the locally stored
// booking_token, exactly as in myBookings.js; nothing here needs an account.
// Editing / booking again reuse the very same modals as the ride list.

function groupByRide(bookings) {
  const groups = [];
  const index = {};
  for (const b of bookings) {
    if (index[b.rideId] === undefined) {
      index[b.rideId] = groups.length;
      groups.push({ rideId: b.rideId, bookings: [] });
    }
    groups[index[b.rideId]].bookings.push(b);
  }
  return groups;
}

export default function MyBookings() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;

  // Bumped whenever this browser's bookings change, so the list re-reads them.
  const [bookingsTick, setBookingsTick] = useState(0);
  const refreshBookings = useCallback(() => setBookingsTick((n) => n + 1), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const groups = useMemo(() => groupByRide(getMyBookings()), [bookingsTick]);
  const idsKey = groups.map((g) => g.rideId).join(',');

  // Live ride details (driver contact + current seat counts), keyed by ride id.
  // A ride that was deleted or has departed resolves to null.
  const [rides, setRides] = useState({});
  const [loading, setLoading] = useState(true);
  const [manageRide, setManageRide] = useState(null);
  const [bookingRide, setBookingRide] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) {
      setRides({});
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(ids.map((id) => fetchRideById(id).catch(() => null))).then((list) => {
      if (cancelled) return;
      const map = {};
      ids.forEach((id, i) => {
        map[id] = list[i] || null;
      });
      setRides(map);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  // Keep a ride's local seat count in sync after an edit changes it.
  const applySeatsLeft = useCallback((rideId, seatsLeftAfter) => {
    if (typeof seatsLeftAfter !== 'number') return;
    setRides((prev) =>
      prev[rideId]
        ? {
            ...prev,
            [rideId]: {
              ...prev[rideId],
              booked_seats: prev[rideId].available_seats - seatsLeftAfter,
            },
          }
        : prev,
    );
  }, []);

  function forget(bookingId) {
    removeMyBooking(bookingId);
    refreshBookings();
  }

  if (!isSupabaseConfigured) return <ConfigNotice />;

  return (
    <div className="container-px py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {t('myBookings.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('myBookings.subtitle')}</p>
      </header>

      {loading ? (
        <Loader label={t('common.loading')} />
      ) : groups.length === 0 ? (
        <div className="card mx-auto max-w-lg p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <TicketIcon className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-xl font-bold text-slate-900">{t('myBookings.emptyTitle')}</h3>
          <p className="mt-2 text-sm text-slate-600">{t('myBookings.emptyMessage')}</p>
          <Link to="/rides" className="btn-primary mt-6">
            {t('nav.findRide')}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-700">
            {t('myBookings.note')}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {groups.map((group) => (
              <BookingCard
                key={group.rideId}
                group={group}
                ride={rides[group.rideId]}
                lang={lang}
                onManage={setManageRide}
                onForget={forget}
              />
            ))}
          </div>
        </>
      )}

      {manageRide && (
        <MyBookingModal
          ride={manageRide}
          bookings={groups.find((g) => g.rideId === manageRide.id)?.bookings || []}
          onClose={() => setManageRide(null)}
          onBookAgain={(r) => {
            setManageRide(null);
            setBookingRide(r);
          }}
          onChanged={(seatsLeftAfter) => {
            applySeatsLeft(manageRide.id, seatsLeftAfter);
            refreshBookings();
          }}
        />
      )}

      {bookingRide && (
        <BookingModal
          ride={bookingRide}
          onClose={() => setBookingRide(null)}
          onBooked={(result) => {
            applySeatsLeft(bookingRide.id, result?.seats_left);
            refreshBookings();
          }}
        />
      )}
    </div>
  );
}

function BookingCard({ group, ride, lang, onManage, onForget }) {
  const { t } = useTranslation();
  const first = group.bookings[0];
  const seats = group.bookings.reduce((sum, b) => sum + (b.seats || 1), 0);
  const route = ride ? `${ride.pickup_city} → ${ride.destination_city}` : first.route;
  const date = ride?.journey_date || first.date;

  const waMessage = ride
    ? t('ride.whatsappMessage', {
        name: ride.driver_name,
        from: ride.pickup_city,
        to: ride.destination_city,
        date: formatDate(ride.journey_date, lang),
      })
    : '';

  return (
    <article className="card animate-fade-up overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-slate-900">{route}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {date && (
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                {formatDate(date, lang)}
              </span>
            )}
            {ride?.journey_time && (
              <span className="flex items-center gap-1.5">
                <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                {formatTime(ride.journey_time, lang)}
              </span>
            )}
          </div>
        </div>
        <span className="chip shrink-0 bg-green-100 text-green-700">
          <UsersIcon className="h-3.5 w-3.5" />
          {t('myBooking.seatsCount', { count: seats })}
        </span>
      </div>

      {ride ? (
        <>
          <div className="flex items-center gap-2 px-5 py-4 text-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <UsersIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{t('ride.driver')}</p>
              <p className="truncate font-semibold text-slate-800">{ride.driver_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-4 sm:grid-cols-3">
            <a href={`tel:+91${ride.phone_number}`} className="btn-secondary !py-2.5 text-xs">
              <PhoneIcon className="h-4 w-4" />
              {t('ride.call')}
            </a>
            <a
              href={`https://wa.me/91${ride.phone_number}?text=${encodeURIComponent(waMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn !py-2.5 bg-[#25D366] text-white hover:bg-[#1ebe5a] text-xs"
            >
              <WhatsAppIcon className="h-4 w-4" />
              {t('ride.whatsapp')}
            </a>
            <button
              type="button"
              onClick={() => onManage(ride)}
              className="btn-primary !py-2.5 text-xs col-span-2 sm:col-span-1"
            >
              <PencilIcon className="h-4 w-4" />
              {t('myBookings.manage')}
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-xs text-slate-500">{t('myBookings.unavailable')}</p>
          <button
            type="button"
            onClick={() => group.bookings.forEach((b) => onForget(b.bookingId))}
            className="btn-secondary !py-2 text-xs"
          >
            {t('myBookings.forget')}
          </button>
        </div>
      )}
    </article>
  );
}
