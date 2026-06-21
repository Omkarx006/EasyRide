import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import { CarIcon, ArrowRightIcon } from './Icons';

export default function Navbar() {
  const { t } = useTranslation();

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition ${
      isActive ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
      <nav className="container-px flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
            <CarIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            {t('app.name')}
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <NavLink to="/rides" className={navLinkClass}>
            <span className="hidden sm:inline">{t('nav.findRide')}</span>
            <span className="sm:hidden">{t('nav.findRide')}</span>
          </NavLink>
          <LanguageToggle />
          <Link to="/create" className="btn-primary !px-3 !py-2 text-xs sm:!px-4 sm:text-sm">
            {t('nav.offerRide')}
            <ArrowRightIcon className="hidden h-4 w-4 sm:inline" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
