import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import mr from './locales/mr.json';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'मराठी' },
];

// Apply a font-switching class on <html> so Marathi gets a Devanagari font.
function applyHtmlLang(lng) {
  const root = document.documentElement;
  root.setAttribute('lang', lng);
  root.classList.toggle('lang-mr', lng === 'mr');
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      mr: { translation: mr },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'mr'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'sahpravas_lang',
      caches: ['localStorage'],
    },
  });

applyHtmlLang(i18n.resolvedLanguage || 'en');
i18n.on('languageChanged', applyHtmlLang);

export default i18n;
