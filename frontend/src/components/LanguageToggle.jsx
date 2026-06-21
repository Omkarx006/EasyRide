import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';

// Compact two-option language switch (English / मराठी).
export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5">
      {LANGUAGES.map((lang) => {
        const active = current === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => i18n.changeLanguage(lang.code)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              active ? 'bg-brand-500 text-white' : 'text-slate-600 hover:text-brand-600'
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
