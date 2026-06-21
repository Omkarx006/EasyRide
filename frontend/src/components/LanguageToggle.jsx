import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';

// Compact two-option language switch (English / मराठी). Pass `compact` for the
// space-tight mobile navbar (short codes + tighter padding).
export default function LanguageToggle({ compact = false }) {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

  return (
    <div className="inline-flex shrink-0 rounded-full border border-slate-200 bg-white p-0.5">
      {LANGUAGES.map((lang) => {
        const active = current === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => i18n.changeLanguage(lang.code)}
            aria-pressed={active}
            aria-label={lang.label}
            className={`whitespace-nowrap rounded-full font-semibold transition ${
              compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1 text-xs'
            } ${active ? 'bg-brand-500 text-white' : 'text-slate-600 hover:text-brand-600'}`}
          >
            {compact ? lang.short : lang.label}
          </button>
        );
      })}
    </div>
  );
}
