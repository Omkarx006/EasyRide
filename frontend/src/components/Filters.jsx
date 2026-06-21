import { useTranslation } from 'react-i18next';
import { TIME_BUCKETS, SEAT_FILTER_OPTIONS } from '../lib/constants';

// Pill-style filter bar: time of day + minimum seats available.
export default function Filters({ value, onChange, onClear, showClear }) {
  const { t } = useTranslation();

  const pill = (active) =>
    `chip border transition ${
      active
        ? 'border-brand-500 bg-brand-500 text-white'
        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-600'
    }`;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('filters.timeOfDay')}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...value, time: 'all' })}
            className={pill(value.time === 'all')}
          >
            {t('filters.all')}
          </button>
          {TIME_BUCKETS.map((bucket) => (
            <button
              key={bucket}
              type="button"
              onClick={() => onChange({ ...value, time: bucket })}
              className={pill(value.time === bucket)}
            >
              {t(`filters.${bucket}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('filters.seats')}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...value, seats: 0 })}
            className={pill(value.seats === 0)}
          >
            {t('filters.seatsAny')}
          </button>
          {SEAT_FILTER_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ ...value, seats: n })}
              className={pill(value.seats === n)}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      {showClear && (
        <button
          type="button"
          onClick={onClear}
          className="self-start text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          {t('filters.clear')}
        </button>
      )}
    </div>
  );
}
