import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CarIcon, BoltIcon } from './Icons';

export function Loader({ label }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      <p className="mt-3 text-sm">{label || t('common.loading')}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <p className="text-base font-semibold text-slate-900">{t('common.error')}</p>
      {message && <p className="mt-1 text-sm text-slate-500">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-5">
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}

export function EmptyRides() {
  const { t } = useTranslation();
  return (
    <div className="card mx-auto max-w-lg p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <CarIcon className="h-8 w-8" />
      </div>
      <h3 className="mt-5 text-xl font-bold text-slate-900">{t('rides.empty.title')}</h3>
      <p className="mt-2 text-sm text-slate-600">{t('rides.empty.message')}</p>
      <Link to="/create" className="btn-primary mt-6">
        {t('rides.empty.cta')}
      </Link>
    </div>
  );
}

export function ConfigNotice() {
  const { t } = useTranslation();
  return (
    <div className="container-px py-16">
      <div className="card mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <BoltIcon className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">{t('config.missingTitle')}</h2>
        <p className="mt-2 text-sm text-slate-600">{t('config.missingMessage')}</p>
      </div>
    </div>
  );
}
