import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import { CarIcon, ArrowRightIcon } from './Icons';

// Desktop keeps the full header nav. On mobile the header is just the logo and
// the language switch — the four main screens live in the fixed bottom bar
// (components/MobileBottomNav.jsx), so there is no hamburger menu any more.
export default function Navbar() {
  const { t } = useTranslation();

  const desktopLink = ({ isActive }) =>
    `whitespace-nowrap text-sm font-medium transition ${
      isActive ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
      <nav className="container-px flex h-16 items-center justify-between gap-3">
        {/* Logo — locked to one line */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white sm:h-9 sm:w-9">
            <CarIcon className="h-5 w-5" />
          </span>
          <span className="whitespace-nowrap text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
            {t('app.name')}
          </span>
        </Link>

        {/* Desktop nav (>= 768px) */}
        <div className="hidden items-center gap-4 md:flex">
          <NavLink to="/rides" className={desktopLink}>
            {t('nav.findRide')}
          </NavLink>
          <NavLink to="/my-rides" className={desktopLink}>
            {t('nav.tabs.created')}
          </NavLink>
          <NavLink to="/my-bookings" className={desktopLink}>
            {t('nav.tabs.bookings')}
          </NavLink>
          <LanguageToggle />
          <Link to="/create" className="btn-primary !px-4 !py-2 text-sm">
            {t('nav.offerRide')}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile (< 768px): language switch only — screens are in the bottom bar */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle compact />
        </div>
      </nav>
    </header>
  );
}
