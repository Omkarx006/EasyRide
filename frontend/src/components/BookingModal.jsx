import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { bookSeat } from '../lib/rides';
import { formatDate } from '../lib/format';
import { CheckCircleIcon, XIcon, UsersIcon } from './Icons';

// Books a single seat through the atomic book_seat() RPC. Shows inline validation,
// maps server error codes to friendly messages, and a success confirmation.
export default function BookingModal({ ride, onClose, onBooked }) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Close on Escape; lock background scroll while open.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function validate() {
    const next = {};
    if (!name.trim()) next.name = t('validation.required');
    if (!/^[0-9]{10}$/.test(phone.trim())) next.phone = t('validation.phone10');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await bookSeat({
        rideId: ride.id,
        passengerName: name,
        passengerPhone: phone,
      });
      if (result?.success) {
        setDone(true);
        onBooked?.(result.seats_left);
      } else {
        const code = result?.error || 'generic';
        setServerError(t(`booking.errors.${code}`, t('booking.errors.generic')));
      }
    } catch {
      setServerError(t('booking.errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  const rideLabel = t('booking.rideLabel', {
    from: ride.pickup_city,
    to: ride.destination_city,
    date: formatDate(ride.journey_date, i18n.resolvedLanguage),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-pop-in w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircleIcon className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">{t('booking.success.title')}</h3>
            <p className="mt-2 text-sm text-slate-600">{t('booking.success.message')}</p>
            <button onClick={onClose} className="btn-primary mt-6 w-full">
              {t('booking.success.done')}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('booking.title')}</h3>
                <p className="mt-0.5 text-sm font-medium text-brand-600">{rideLabel}</p>
              </div>
              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="field-label" htmlFor="booking-name">
                  {t('booking.passengerName')}
                </label>
                <input
                  id="booking-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('booking.namePlaceholder')}
                  className="field-input"
                  autoFocus
                />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>

              <div>
                <label className="field-label" htmlFor="booking-phone">
                  {t('booking.passengerPhone')}
                </label>
                <input
                  id="booking-phone"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder={t('booking.phonePlaceholder')}
                  className="field-input"
                />
                {errors.phone && <p className="field-error">{errors.phone}</p>}
              </div>

              <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700">
                {t('booking.note')}
              </p>

              {serverError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                  {serverError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  {t('booking.cancel')}
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? (
                    t('booking.booking')
                  ) : (
                    <>
                      <UsersIcon className="h-4 w-4" />
                      {t('booking.confirm')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
