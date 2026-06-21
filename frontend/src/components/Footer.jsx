import { useTranslation } from 'react-i18next';
import { CarIcon } from './Icons';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 border-t border-slate-100 bg-slate-50">
      <div className="container-px py-10">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              <CarIcon className="h-4 w-4" />
            </span>
            <span className="text-base font-extrabold text-slate-900">{t('app.name')}</span>
          </div>
          <span className="chip bg-brand-50 text-brand-700">{t('trust.badge')}</span>
        </div>

        <p className="mt-4 max-w-2xl text-sm text-slate-600">{t('footer.tagline')}</p>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-400">
          {t('footer.disclaimer')}
        </p>
        <p className="mt-4 text-xs font-medium text-slate-400">{t('footer.builtBy')}</p>

        <div className="mt-6 flex flex-col gap-1 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:gap-2">
          <span>
            Created by <span className="font-semibold text-slate-700">Omkar Jadhav</span>
          </span>
          <span className="hidden sm:inline text-slate-300">·</span>
          <span className="break-all">
            Email:{' '}
            <a
              href="mailto:omkarjadhavn06@gmail.com"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              omkarjadhavn06@gmail.com
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
