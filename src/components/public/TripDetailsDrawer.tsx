import React, { useEffect } from 'react';
import { X, Clock, Bus, MapPin, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Trip } from '../../types';
import { CAR_SEAT_VIEW_SEATS } from './SeatSelector';

interface TripDetailsDrawerProps {
  trip: Trip | null;
  selectedVehicleCapacity?: 11 | 14 | 16 | null;
  onClose: () => void;
  onSelectSeats: (trip: Trip, chosenCapacity: 11 | 14 | 16) => void;
}

export const TripDetailsDrawer: React.FC<TripDetailsDrawerProps> = ({
  trip,
  selectedVehicleCapacity,
  onClose,
  onSelectSeats,
}) => {
  useEffect(() => {
    if (!trip) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [trip, onClose]);

  if (!trip) return null;

  const vehicleCap: 11 | 14 | 16 =
    selectedVehicleCapacity ||
    (trip.vehicle?.seatingCapacity === 11
      ? 11
      : trip.vehicle?.seatingCapacity === 16
      ? 16
      : 14);

  const validSeats = CAR_SEAT_VIEW_SEATS[vehicleCap];
  const bookedSet = new Set(trip.bookedSeatNumbers || []);
  const availableSeatsCount = Math.max(
    0,
    validSeats.length - validSeats.filter((s) => bookedSet.has(s)).length
  );

  const depDate = new Date(trip.departureTime);
  const arrDate = new Date(trip.estimatedArrivalTime);

  const depTimeStr = depDate.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const arrTimeStr = arrDate.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateLabel = depDate.toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const durationHours = trip.route?.estimatedDurationHours || 6.5;
  const wholeHours = Math.floor(durationHours);
  const mins = Math.round((durationHours - wholeHours) * 60);
  const durationFormatted = mins > 0 ? `${wholeHours}h ${mins}m` : `${wholeHours}h`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-stretch sm:justify-end bg-slate-950/50 backdrop-blur-[2px] p-4 sm:p-0 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-drawer-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[calc(100vw-32px)] sm:max-w-md bg-white rounded-2xl sm:rounded-none sm:rounded-l-2xl border sm:border-t-0 sm:border-l border-slate-200 shadow-2xl flex flex-col justify-between max-h-[90dvh] sm:max-h-full overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Trip Details
            </span>
            <h2 id="trip-drawer-title" className="text-xl font-extrabold text-slate-950 mt-0.5">
              {trip.route.origin} → {trip.route.destination}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close trip details"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {/* Date & Status */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600">{dateLabel}</span>
            <span
              className={
                availableSeatsCount === 0
                  ? 'status-error'
                  : availableSeatsCount <= 3
                  ? 'status-warning'
                  : 'status-positive'
              }
            >
              <span>{availableSeatsCount === 0 ? '×' : '●'}</span>
              <span>
                {availableSeatsCount === 0
                  ? 'Sold Out'
                  : `${availableSeatsCount} ${availableSeatsCount === 1 ? 'seat' : 'seats'} available`}
              </span>
            </span>
          </div>

          {/* Schedule Timeline Block */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Departure</span>
                <span className="text-xl font-extrabold font-mono text-slate-950 tabular-nums">
                  {depTimeStr}
                </span>
                <span className="text-xs text-slate-600 block mt-0.5">
                  {trip.route.origin === 'Rongai' ? 'Rongai (Next to Isalu Center)' : `${trip.route.origin} Stage`}
                </span>
              </div>

              <div className="flex flex-col items-center px-3">
                <span className="text-[11px] font-mono font-semibold text-slate-600">
                  {durationFormatted} • Direct
                </span>
                <div className="w-20 h-px bg-slate-300 my-1.5 relative flex items-center justify-center">
                  <Bus className="w-3.5 h-3.5 text-amber-600 bg-slate-50 px-0.5" />
                </div>
                <span className="text-[10px] font-mono text-slate-400">{trip.tripCode}</span>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Arrival (Est.)</span>
                <span className="text-xl font-extrabold font-mono text-slate-950 tabular-nums">
                  {arrTimeStr}
                </span>
                <span className="text-xs text-slate-600 block mt-0.5">
                  {trip.route.destination === 'Rongai' ? 'Rongai (Next to Isalu Center)' : `${trip.route.destination} Stage`}
                </span>
              </div>
            </div>
          </div>

          {/* Key Trip Facts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-500 block">Vehicle</span>
              <span className="text-sm font-bold text-slate-950 mt-0.5 block">
                {vehicleCap}-Seater Shuttle
              </span>
              <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                {trip.vehicle?.registrationNumber || 'KDE 416Q'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-500 block">Standard Fare</span>
              <span className="text-base font-extrabold font-mono text-slate-950 mt-0.5 block tabular-nums">
                KSh {trip.fareKsh.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Per passenger seat</span>
            </div>
          </div>

          {/* PSV Seating & Payment Highlights */}
          <div className="space-y-2.5 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Included with Your Ticket
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Kenyan PSV {vehicleCap}-Seater layout (2 front seats beside driver + rear rows)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pay securely via M-Pesa or Pay on Boarding</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>25 KG standard luggage allowance included</span>
              </li>
            </ul>
          </div>

          {/* Intermediate Stops if available */}
          {trip.route?.stops && trip.route.stops.length > 0 && (
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Corridor Waypoints
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {trip.route.stops.map((stop) => (
                  <span
                    key={stop.id}
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200"
                  >
                    <MapPin className="w-3 h-3 text-amber-600" />
                    <span>{stop.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom CTA */}
        <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50/90 sticky bottom-0 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Fare per seat</span>
            <span className="text-lg font-extrabold font-mono text-slate-950 tabular-nums">
              KSh {trip.fareKsh.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            disabled={availableSeatsCount === 0}
            onClick={() => onSelectSeats(trip, vehicleCap)}
            className="craft-btn-amber py-3 px-6 text-sm font-bold flex items-center gap-2 min-h-[46px]"
          >
            <span>{availableSeatsCount === 0 ? 'Sold Out' : 'Select Seats'}</span>
            {availableSeatsCount > 0 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
