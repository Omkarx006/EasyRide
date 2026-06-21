import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SearchForm from '../components/SearchForm';
import {
  GiftIcon,
  PhoneIcon,
  BoltIcon,
  MapPinIcon,
  ArrowRightIcon,
  CheckIcon,
  ShieldIcon,
} from '../components/Icons';

const WHY_ICONS = [GiftIcon, PhoneIcon, BoltIcon, MapPinIcon];

export default function Home() {
  const { t } = useTranslation();
  const whyItems = t('home.why.items', { returnObjects: true });
  const guidelines = t('home.guidelines.items', { returnObjects: true });

  return (
    <div>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"
        />
        <div className="container-px relative py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="chip mb-5 border border-brand-200 bg-white text-brand-700 shadow-sm">
              <ShieldIcon className="h-3.5 w-3.5" />
              {t('trust.badge')}
            </span>
            <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
              {t('home.hero.title')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              {t('home.hero.subtitle')}
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/rides" className="btn-primary w-full sm:w-auto">
                {t('home.hero.ctaFind')}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link to="/create" className="btn-secondary w-full sm:w-auto">
                {t('home.hero.ctaOffer')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- Search */}
      <section className="container-px -mt-8 sm:-mt-10">
        <div className="card mx-auto max-w-4xl p-5 sm:p-7">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">{t('home.search.title')}</h2>
            <p className="text-sm text-slate-500">{t('home.search.subtitle')}</p>
          </div>
          <SearchForm />
        </div>
      </section>

      {/* ----------------------------------------------------------------- Why */}
      <section className="container-px py-14 sm:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {t('home.why.title')}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyItems.map((item, i) => {
            const Icon = WHY_ICONS[i % WHY_ICONS.length];
            return (
              <div key={i} className="card p-6 transition-shadow hover:shadow-card-hover">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------- Guidelines */}
      <section className="bg-slate-50">
        <div className="container-px py-14 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {t('home.guidelines.title')}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
                {t('home.guidelines.subtitle')}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {guidelines.map((g, i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-slate-700">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
