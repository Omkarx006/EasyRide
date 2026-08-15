import { UsersIcon } from './Icons';

// A compact +/- stepper for choosing a number of seats, clamped to [1, max].
export default function SeatStepper({ value, onChange, max, label }) {
  const canDec = value > 1;
  const canInc = value < max;
  const set = (v) => onChange(Math.min(max, Math.max(1, v)));

  return (
    <div>
      {label && <span className="field-label">{label}</span>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set(value - 1)}
          disabled={!canDec}
          aria-label="decrease seats"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg font-bold text-slate-700 disabled:opacity-40"
        >
          −
        </button>
        <span className="flex min-w-[3rem] items-center justify-center gap-1.5 text-lg font-bold text-slate-900">
          <UsersIcon className="h-4 w-4 text-brand-500" />
          {value}
        </span>
        <button
          type="button"
          onClick={() => set(value + 1)}
          disabled={!canInc}
          aria-label="increase seats"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg font-bold text-slate-700 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
