import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createRide } from '../lib/rides';
import { isSupabaseConfigured } from '../lib/supabase';
import { todayISO } from '../lib/format';
import { MAHARASHTRA_CITIES, MAX_SEATS } from '../lib/constants';
import { ConfigNotice } from '../components/States';
import { CheckCircleIcon, MapPinIcon, CalendarIcon, UsersIcon, ArrowRightIcon } from '../components/Icons';

const EMPTY = {
  pickup_city: '',
  pickup_area: '',
  destination_city: '',
  destination_area: '',
  journey_date: '',
  journey_time: '',
  available_seats: '1',
  driver_name: '',
  phone_number: '',
};

export default function CreateRide() {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  }

  function validate() {
    const e = {};
    const required = [
      'pickup_city',
      'pickup_area',
      'destination_city',
      'destination_area',
      'journey_date',
      'journey_time',
      'driver_name',
      'phone_number',
    ];
    required.forEach((k) => {
      if (!String(form[k]).trim()) e[k] = t('validation.required');
    });

    if (!/^[0-9]{10}$/.test(form.phone_number.trim())) {
      e.phone_number = t('validation.phone10');
    }
    if (form.journey_date && form.journey_date < todayISO()) {
      e.journey_date = t('validation.datePast');
    }
    const seats = Number(form.available_seats);
    if (!seats || seats < 1) e.available_seats = t('validation.seatsMin');
    else if (seats > MAX_SEATS) e.available_seats = t('validation.seatsMax');

    if (
      form.pickup_city.trim() &&
      form.destination_city.trim() &&
      form.pickup_city.trim().toLowerCase() === form.destination_city.trim().toLowerCase()
    ) {
      e.destination_city = t('validation.sameCity');
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setServerError('');
    if (!validate()) {
      // Focus the first invalid field for accessibility.
      const first = document.querySelector('[aria-invalid="true"]');
      first?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await createRide(form);
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setServerError(t('booking.errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm(EMPTY);
    setErrors({});
    setServerError('');
    setDone(false);
  }

  if (!isSupabaseConfigured) return <ConfigNotice />;

  if (done) {
    return (
      <div className="container-px py-12">
        <div className="card mx-auto max-w-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircleIcon className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">{t('create.success.title')}</h2>
          <p className="mt-2 text-sm text-slate-600">{t('create.success.message')}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link to="/rides" className="btn-primary flex-1">
              {t('create.success.viewRides')}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <button onClick={resetForm} className="btn-secondary flex-1">
              {t('create.success.createAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-px py-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('create.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('create.subtitle')}</p>
        </header>

        <form onSubmit={handleSubmit} className="card p-5 sm:p-7" noValidate>
          <datalist id="create-city-options">
            {MAHARASHTRA_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          {/* Route */}
          <Section icon={<MapPinIcon className="h-4 w-4" />} title={t('create.sectionRoute')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="pickup_city"
                label={t('create.pickupCity')}
                value={form.pickup_city}
                onChange={(v) => set('pickup_city', v)}
                placeholder={t('create.placeholders.city')}
                error={errors.pickup_city}
                list="create-city-options"
              />
              <Field
                id="pickup_area"
                label={t('create.pickupArea')}
                value={form.pickup_area}
                onChange={(v) => set('pickup_area', v)}
                placeholder={t('create.placeholders.pickupArea')}
                error={errors.pickup_area}
              />
              <Field
                id="destination_city"
                label={t('create.destinationCity')}
                value={form.destination_city}
                onChange={(v) => set('destination_city', v)}
                placeholder={t('create.placeholders.city')}
                error={errors.destination_city}
                list="create-city-options"
              />
              <Field
                id="destination_area"
                label={t('create.destinationArea')}
                value={form.destination_area}
                onChange={(v) => set('destination_area', v)}
                placeholder={t('create.placeholders.destinationArea')}
                error={errors.destination_area}
              />
            </div>
          </Section>

          {/* When */}
          <Section icon={<CalendarIcon className="h-4 w-4" />} title={t('create.sectionWhen')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="journey_date"
                label={t('create.journeyDate')}
                type="date"
                value={form.journey_date}
                onChange={(v) => set('journey_date', v)}
                error={errors.journey_date}
                min={todayISO()}
              />
              <Field
                id="journey_time"
                label={t('create.journeyTime')}
                type="time"
                value={form.journey_time}
                onChange={(v) => set('journey_time', v)}
                error={errors.journey_time}
              />
            </div>
          </Section>

          {/* Seats & contact */}
          <Section icon={<UsersIcon className="h-4 w-4" />} title={t('create.sectionSeats')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="available_seats"
                label={t('create.availableSeats')}
                type="number"
                value={form.available_seats}
                onChange={(v) => set('available_seats', v)}
                error={errors.available_seats}
                min={1}
                max={MAX_SEATS}
              />
              <Field
                id="driver_name"
                label={t('create.driverName')}
                value={form.driver_name}
                onChange={(v) => set('driver_name', v)}
                placeholder={t('create.placeholders.driverName')}
                error={errors.driver_name}
              />
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="phone_number">
                  {t('create.phone')}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-500">
                    {t('create.phonePrefix')}
                  </span>
                  <input
                    id="phone_number"
                    inputMode="numeric"
                    value={form.phone_number}
                    onChange={(e) =>
                      set('phone_number', e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    placeholder={t('create.placeholders.phone')}
                    aria-invalid={Boolean(errors.phone_number)}
                    className="field-input rounded-l-none"
                  />
                </div>
                {errors.phone_number && <p className="field-error">{errors.phone_number}</p>}
              </div>
            </div>
          </Section>

          {serverError && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {serverError}
            </p>
          )}

          <button type="submit" className="btn-primary mt-6 w-full" disabled={submitting}>
            {submitting ? t('create.submitting') : t('create.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <fieldset className="mb-6 last:mb-0">
      <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          {icon}
        </span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({ id, label, value, onChange, error, type = 'text', ...rest }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        autoComplete="off"
        className="field-input"
        {...rest}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
