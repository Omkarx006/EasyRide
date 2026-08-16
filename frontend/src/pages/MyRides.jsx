import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyRides, isPastMyRide, clearPastMyRides } from '../lib/myRides';
import { formatDate, formatTime } from '../lib/format';
import { CarIcon, ArrowRightIcon, CalendarIcon, ClockIcon, XIcon } from '../components/Icons';

export default function MyRides() {
  const { t, i18n } = useTranslation();
  const [rides, setRides] = useState(() => getMyRides());
  const [confirming, setConfirming] = useState(false);

  // Rides whose departure (+ the usual grace period) has already passed. Counted
  // once per render of the list — enough for a page the user opens on demand.
  const pastCount = useMemo(() => rides.filter((r) => isPastMyRide(r)).length, [rides]);

  function confirmClearPast() {
    setRides(clearPastMyRides());
    setConfirming(false);
  }

  return (
    <div className="container-px py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('myRides.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('myRides.subtitle')}</p>
      </header>

      {rides.length === 0 ? (
        <div className="card mx-auto max-w-lg p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <CarIcon className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-xl font-bold text-slate-900">{t('myRides.emptyTitle')}</h3>
          <p className="mt-2 text-sm text-slate-600">{t('myRides.emptyMessage')}</p>
          <Link to="/create" className="btn-primary mt-6">
            {t('nav.offerRide')}
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-700">
            {t('myRides.note')}
          </p>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              {pastCount > 0
                ? t('myRides.pastCount', { count: pastCount })
                : t('myRides.noPastRides')}
            </p>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={pastCount === 0}
              className="btn-secondary !px-4 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('myRides.clearPast')}
            </button>
          </div>

          <div className="grid gap-3">
            {rides.map((r) => (
              <div key={r.id} className="card flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{r.route}</p>
                  {r.date && (
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(r.date, i18n.resolvedLanguage)}
                      </span>
                      {r.time && (
                        <span className="flex items-center gap-1.5">
                          <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                          {formatTime(r.time, i18n.resolvedLanguage)}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <Link
                  to={`/manage/${r.id}?token=${r.token}`}
                  className="btn-primary shrink-0 !px-4 !py-2 text-xs"
                >
                  {t('myRides.manage')}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirm clearing past rides — local dashboard only, nothing is deleted online */}
      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setConfirming(false)}
        >
          <div
            className="animate-pop-in w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t('myRides.clearPastTitle')}</h3>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                aria-label={t('common.close')}
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">{t('myRides.clearPastMessage')}</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirming(false)} className="btn-secondary flex-1">
                {t('myRides.clearPastCancel')}
              </button>
              <button onClick={confirmClearPast} className="btn-primary flex-1">
                {t('myRides.clearPast')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
