import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MAHARASHTRA_CITIES } from '../lib/constants';
import { todayISO } from '../lib/format';
import { SearchIcon, MapPinIcon, CalendarIcon } from './Icons';

// Search by from-city / to-city / date. By default it navigates to /rides with
// the chosen filters as query params; pass `onSubmit` to handle it inline.
export default function SearchForm({ initial = {}, onSubmit, compact = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [from, setFrom] = useState(initial.from || '');
  const [to, setTo] = useState(initial.to || '');
  const [date, setDate] = useState(initial.date || '');

  function handleSubmit(e) {
    e.preventDefault();
    const params = {
      from: from.trim(),
      to: to.trim(),
      date: date || '',
    };
    if (onSubmit) {
      onSubmit(params);
      return;
    }
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    if (params.date) qs.set('date', params.date);
    navigate(`/rides${qs.toString() ? `?${qs}` : ''}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`grid gap-3 ${compact ? 'sm:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-4'}`}
    >
      <datalist id="city-options">
        {MAHARASHTRA_CITIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div>
        <label className="field-label" htmlFor="search-from">
          {t('search.from')}
        </label>
        <div className="relative">
          <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
          <input
            id="search-from"
            list="city-options"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder={t('search.anyCity')}
            className="field-input pl-9"
            autoComplete="off"
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="search-to">
          {t('search.to')}
        </label>
        <div className="relative">
          <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
          <input
            id="search-to"
            list="city-options"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={t('search.anyCity')}
            className="field-input pl-9"
            autoComplete="off"
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="search-date">
          {t('search.date')}
        </label>
        <div className="relative">
          <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
          <input
            id="search-date"
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="field-input pl-9"
          />
        </div>
      </div>

      <div className="flex items-end">
        <button type="submit" className="btn-primary w-full">
          <SearchIcon className="h-4 w-4" />
          {t('search.submit')}
        </button>
      </div>
    </form>
  );
}
