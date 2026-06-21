import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import { CarIcon, ArrowRightIcon, MenuIcon, XIcon } from './Icons';

export default function Navbar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu on navigation.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock background scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const desktopLink = ({ isActive }) =>
    `whitespace-nowrap text-sm font-medium transition ${
      isActive ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600'
    }`;

  const mobileLink = ({ isActive }) =>
    `block w-full rounded-xl px-4 py-3 text-base font-semibold transition ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
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
            {t('nav.myRides')}
          </NavLink>
          <LanguageToggle />
          <Link to="/create" className="btn-primary !px-4 !py-2 text-sm">
            {t('nav.offerRide')}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile cluster (< 768px): always-visible language switch + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle compact />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700"
          >
            {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {open && (
        <>
          <div
            className="fixed inset-0 top-16 z-30 bg-slate-900/20 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="animate-fade-up absolute inset-x-0 top-16 z-40 border-b border-slate-100 bg-white shadow-card md:hidden">
            <div className="container-px flex flex-col gap-1 py-3">
              <NavLink to="/rides" className={mobileLink} onClick={() => setOpen(false)}>
                {t('nav.findRide')}
              </NavLink>
              <NavLink to="/my-rides" className={mobileLink} onClick={() => setOpen(false)}>
                {t('nav.myRides')}
              </NavLink>
              <Link
                to="/create"
                onClick={() => setOpen(false)}
                className="btn-primary mt-1 w-full justify-center !py-3 text-base"
              >
                {t('nav.offerRide')}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
