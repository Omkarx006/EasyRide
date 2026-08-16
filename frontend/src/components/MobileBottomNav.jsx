import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TABS } from '../lib/tabs';

// Fixed app-style bar for the four main screens (mobile only — the desktop
// header keeps its own navigation). Labels come from the shared i18n files, so
// they switch with the English/Marathi toggle like everything else.
export default function MobileBottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav
      aria-label={t('nav.mainScreens')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur
                 shadow-[0_-2px_16px_rgba(17,24,39,0.08)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between gap-1 px-2 py-1.5">
        {TABS.map(({ key, path, labelKey, Icon }) => {
          const active = pathname === path;
          return (
            <li key={key} className="min-w-0 flex-1">
              <Link
                to={path}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => {
                  // Tapping the screen you are already on scrolls it back to the
                  // top instead of stacking another history entry.
                  if (!active) return;
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex flex-col items-center gap-0.5 rounded-2xl py-1 outline-none
                           focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                    active ? 'bg-brand-50 text-brand-600' : 'text-slate-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`w-full truncate px-0.5 text-center text-[10px] leading-tight transition-colors ${
                    active ? 'font-bold text-brand-700' : 'font-semibold text-slate-500'
                  }`}
                >
                  {t(labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
