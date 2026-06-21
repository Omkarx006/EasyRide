import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyRides } from '../lib/myRides';
import { formatDate } from '../lib/format';
import { CarIcon, ArrowRightIcon, CalendarIcon } from '../components/Icons';

export default function MyRides() {
  const { t, i18n } = useTranslation();
  const [rides] = useState(() => getMyRides());

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
          <div className="grid gap-3">
            {rides.map((r) => (
              <div key={r.id} className="card flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{r.route}</p>
                  {r.date && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(r.date, i18n.resolvedLanguage)}
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
    </div>
  );
}
