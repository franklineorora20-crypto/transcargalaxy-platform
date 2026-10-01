import React from 'react';
import { ArrowRight, Calendar } from 'lucide-react';
import { Trip } from '../../../types';
import { CAR_SEAT_VIEW_SEATS } from '../SeatSelector';

interface RoutesPreviewProps {
  departuresDate: string;
  todayIso: string;
  loadingDepartures: boolean;
  filteredDepartures: Trip[];
  availableCorridors: string[];
  departuresCorridorFilter: string;
  onCorridorFilterChange: (corridor: string) => void;
  onViewTrip: (trip: Trip) => void;
  onOpenSchedules?: () => void;
  onResetFilters: () => void;
}

export const RoutesPreview: React.FC<RoutesPreviewProps> = ({
  departuresDate,
  todayIso,
  loadingDepartures,
  filteredDepartures,
  availableCorridors,
  departuresCorridorFilter,
  onCorridorFilterChange,
  onViewTrip,
  onOpenSchedules,
  onResetFilters,
}) => {
  return (
    <section id="todays-departures-section" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-amber-600 tracking-wide uppercase">
            Live Schedule & Availability
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {departuresDate === todayIso ? "Today's Departures" : `Scheduled Departures (${departuresDate})`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Select an available trip to view the live PSV seat map and reserve your seat.
          </p>
        </div>

        {/* Route Filter Tabs + Full Schedule Link */}
        <div className="flex flex-wrap items-center gap-2">
          {availableCorridors.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => onCorridorFilterChange('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  departuresCorridorFilter === 'ALL'
                    ? 'bg-white text-slate-950 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                All Routes
              </button>
              {availableCorridors.map((corridor) => (
                <button
                  key={corridor}
                  type="button"
                  onClick={() => onCorridorFilterChange(corridor)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    departuresCorridorFilter === corridor
                      ? 'bg-white text-slate-950 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {corridor}
                </button>
              ))}
            </div>
          )}

          {onOpenSchedules && (
            <button
              type="button"
              onClick={onOpenSchedules}
              className="text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <span>Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loadingDepartures ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" aria-label="Loading departures">
          {[1, 2, 3].map((i) => (
            <div key={i} className="craft-card p-5 space-y-3">
              <div className="h-5 w-24 rounded skeleton-shimmer" />
              <div className="h-6 w-3/4 rounded skeleton-shimmer" />
              <div className="h-4 w-1/2 rounded skeleton-shimmer" />
              <div className="h-10 w-full rounded-xl skeleton-shimmer mt-2" />
            </div>
          ))}
        </div>
      ) : filteredDepartures.length === 0 ? (
        /* Empty State */
        <div className="craft-card p-8 sm:p-10 text-center space-y-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-600">
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              No departures found for this date.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please choose another travel date or adjust your filter to view available shuttles.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onResetFilters}
              className="craft-btn-amber text-xs px-4 py-2.5 font-bold cursor-pointer"
            >
              Reset Filters & View Today
            </button>
          </div>
        </div>
      ) : (
        /* Departures Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {filteredDepartures.map((trip) => {
            const depTime = new Date(trip.departureTime).toLocaleTimeString('en-KE', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const vehicleCap =
              trip.vehicle?.seatingCapacity === 11
                ? 11
                : trip.vehicle?.seatingCapacity === 16
                ? 16
                : 14;
            const validSeats = CAR_SEAT_VIEW_SEATS[vehicleCap] || CAR_SEAT_VIEW_SEATS[14];
            const bookedSet = new Set(trip.bookedSeatNumbers || []);
            const openSeats = Math.max(
              0,
              validSeats.length - validSeats.filter((s) => bookedSet.has(s)).length
            );

            return (
              <div
                key={trip.id}
                className="craft-card-interactive p-4 sm:p-5 flex flex-col justify-between gap-3 sm:gap-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-extrabold text-base sm:text-lg text-slate-950 tabular-nums">
                      {depTime}
                    </span>
                    <span
                      className={
                        openSeats === 0
                          ? 'status-error'
                          : openSeats <= 3
                          ? 'status-warning'
                          : 'status-positive'
                      }
                    >
                      <span>{openSeats === 0 ? '×' : '●'}</span>
                      <span>
                        {openSeats === 0
                          ? 'Sold out'
                          : `${openSeats} ${openSeats === 1 ? 'seat' : 'seats'} open`}
                      </span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-950 tracking-tight">
                      {trip.route.origin} → {trip.route.destination}
                    </h3>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      {vehicleCap}-Seater • <span className="font-mono text-slate-500">{trip.vehicle.registrationNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-base font-extrabold text-slate-950 font-mono tabular-nums">
                      KSh {trip.fareKsh.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-1">/ seat</span>
                  </div>

                  <button
                    type="button"
                    disabled={openSeats === 0}
                    onClick={() => onViewTrip(trip)}
                    className="craft-btn-secondary text-xs py-2 px-3.5 font-bold inline-flex items-center gap-1 min-h-[38px] cursor-pointer"
                  >
                    <span>{openSeats === 0 ? 'Sold Out' : 'View Trip'}</span>
                    {openSeats > 0 && <ArrowRight className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
