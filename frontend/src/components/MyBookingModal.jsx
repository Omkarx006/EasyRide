import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateBooking } from '../lib/rides';
import { updateMyBooking } from '../lib/myBookings';
import { formatDate, formatTime, seatsLeft } from '../lib/format';
import { XIcon, PencilIcon, PlusIcon, UsersIcon, PhoneIcon, CheckIcon } from './Icons';
import SeatStepper from './SeatStepper';

// The passenger's "My Booking(s)" view for one ride: shows every booking THIS
// browser made (from myBookings.js), lets the owner edit each one (name / phone /
// seats — gated server-side by the secret booking_token), and offers "Book Again"
// to create a separate booking. The ride creator never reaches this — they have no
// booking_token — so passenger data is only ever editable by its owner.
export default function MyBookingModal({ ride, bookings, onClose, onBookAgain, onChanged }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  // Local copy of the ride's seat counts, kept current as edits change them.
  const [rideState, setRideState] = useState(ride);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const rideLabel = t('booking.rideLabel', {
    from: ride.pickup_city,
    to: ride.destination_city,
    date: formatDate(ride.journey_date, lang),
  });
  const timeLabel = formatTime(ride.journey_time, lang);
  const multiple = bookings.length > 1;

  // How far a given booking can grow: seats currently free + this booking's own seats.
  function editMax(booking) {
    return seatsLeft(rideState) + (booking.seats || 1);
  }

  function handleSaved(bookingId, patch, seatsLeftAfter) {
    updateMyBooking(bookingId, patch);
    if (typeof seatsLeftAfter === 'number') {
      setRideState((r) => ({ ...r, booked_seats: r.available_seats - seatsLeftAfter }));
      onChanged?.(seatsLeftAfter);
    }
    setEditingId(null);
  }

  return (
    <div
      data-no-swipe
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-pop-in w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {multiple ? t('myBooking.titlePlural') : t('myBooking.title')}
            </h3>
            <p className="mt-0.5 text-sm font-medium text-brand-600">{rideLabel}</p>
            <p className="text-xs text-slate-500">{timeLabel}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[55vh] space-y-3 overflow-y-auto">
          {bookings.map((b, idx) =>
            editingId === b.bookingId ? (
              <EditBookingForm
                key={b.bookingId}
                booking={b}
                max={editMax(b)}
                onCancel={() => setEditingId(null)}
                onSaved={handleSaved}
              />
            ) : (
              <div key={b.bookingId} className="rounded-2xl border border-slate-200 p-4">
                {multiple && (
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {t('myBooking.bookingN', { n: idx + 1 })}
                  </p>
                )}
                <p className="text-base font-bold text-slate-900">{b.passengerName}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                  <PhoneIcon className="h-3.5 w-3.5 text-slate-400" />
                  {b.passengerPhone}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                  <UsersIcon className="h-3.5 w-3.5 text-slate-400" />
                  {t('myBooking.seatsCount', { count: b.seats || 1 })}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingId(b.bookingId)}
                  className="btn-secondary mt-3 !py-2 text-xs"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  {t('myBooking.edit')}
                </button>
              </div>
            ),
          )}
        </div>

        <button type="button" onClick={() => onBookAgain(ride)} className="btn-primary mt-4 w-full">
          <PlusIcon className="h-4 w-4" />
          {t('myBooking.bookAgain')}
        </button>
      </div>
    </div>
  );
}

// Inline edit form for a single booking. Name, phone and seat count are editable;
// the save is gated server-side by the booking's secret token.
function EditBookingForm({ booking, max, onCancel, onSaved }) {
  const { t } = useTranslation();
  const [name, setName] = useState(booking.passengerName || '');
  const [phone, setPhone] = useState(booking.passengerPhone || '');
  const [seats, setSeats] = useState(booking.seats || 1);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  function validate() {
    const next = {};
    if (!name.trim()) next.name = t('validation.required');
    if (!/^[0-9]{10}$/.test(phone.trim())) next.phone = t('validation.phone10');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    setServerError('');
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await updateBooking({
        bookingId: booking.bookingId,
        bookingToken: booking.token,
        passengerName: name,
        passengerPhone: phone,
        seats,
      });
      if (result?.success) {
        onSaved(
          booking.bookingId,
          { passengerName: name.trim(), passengerPhone: phone.trim(), seats: result.seats },
          result.seats_left,
        );
      } else {
        const code = result?.error || 'generic';
        setServerError(t(`booking.errors.${code}`, t('booking.errors.generic')));
      }
    } catch {
      setServerError(t('booking.errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
      <div className="space-y-3">
        <div>
          <label className="field-label" htmlFor={`edit-name-${booking.bookingId}`}>
            {t('booking.passengerName')}
          </label>
          <input
            id={`edit-name-${booking.bookingId}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input"
            autoFocus
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor={`edit-phone-${booking.bookingId}`}>
            {t('booking.passengerPhone')}
          </label>
          <input
            id={`edit-phone-${booking.bookingId}`}
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="field-input"
          />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>
        <SeatStepper label={t('booking.seats')} value={seats} onChange={setSeats} max={max} />

        {serverError && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {serverError}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={saving}>
            {t('booking.cancel')}
          </button>
          <button type="button" onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            <CheckIcon className="h-4 w-4" />
            {saving ? t('myBooking.saving') : t('myBooking.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
