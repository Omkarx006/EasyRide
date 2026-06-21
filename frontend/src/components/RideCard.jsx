import { useTranslation } from 'react-i18next';
import { formatDate, formatTime, seatsLeft } from '../lib/format';
import {
  PhoneIcon,
  WhatsAppIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ArrowRightIcon,
} from './Icons';

export default function RideCard({ ride, onBook }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const left = seatsLeft(ride);
  const isFull = left <= 0;

  const dateLabel = formatDate(ride.journey_date, lang);
  const timeLabel = formatTime(ride.journey_time, lang);

  const waMessage = t('ride.whatsappMessage', {
    name: ride.driver_name,
    from: ride.pickup_city,
    to: ride.destination_city,
    date: dateLabel,
  });
  const waLink = `https://wa.me/91${ride.phone_number}?text=${encodeURIComponent(waMessage)}`;
  const telLink = `tel:+91${ride.phone_number}`;

  return (
    <article className="card animate-fade-up overflow-hidden transition-shadow hover:shadow-card-hover">
      {/* Route header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-bold text-slate-900">
            <span className="truncate">{ride.pickup_city}</span>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-brand-500" />
            <span className="truncate">{ride.destination_city}</span>
          </div>
          <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
            <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">
              {ride.pickup_area} → {ride.destination_area}
            </span>
          </div>
        </div>
        <span
          className={`chip shrink-0 ${
            isFull ? 'bg-slate-100 text-slate-500' : 'bg-brand-50 text-brand-700'
          }`}
        >
          <UsersIcon className="h-3.5 w-3.5" />
          {isFull ? t('ride.full') : t('ride.seatsLeft', { count: left })}
        </span>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 p-5 text-sm sm:grid-cols-3">
        <Meta icon={<CalendarIcon className="h-4 w-4" />} label={t('ride.departsOn')} value={dateLabel} />
        <Meta icon={<ClockIcon className="h-4 w-4" />} label={t('create.journeyTime')} value={timeLabel} />
        <Meta icon={<UsersIcon className="h-4 w-4" />} label={t('ride.driver')} value={ride.driver_name} />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-4 sm:grid-cols-3">
        <a href={telLink} className="btn-secondary !py-2.5 text-xs">
          <PhoneIcon className="h-4 w-4" />
          {t('ride.call')}
        </a>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn !py-2.5 bg-[#25D366] text-white hover:bg-[#1ebe5a] text-xs"
        >
          <WhatsAppIcon className="h-4 w-4" />
          {t('ride.whatsapp')}
        </a>
        <button
          type="button"
          onClick={() => onBook(ride)}
          disabled={isFull}
          className="btn-primary !py-2.5 text-xs col-span-2 sm:col-span-1"
        >
          <UsersIcon className="h-4 w-4" />
          {isFull ? t('ride.full') : t('ride.book')}
        </button>
      </div>
    </article>
  );
}

function Meta({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
