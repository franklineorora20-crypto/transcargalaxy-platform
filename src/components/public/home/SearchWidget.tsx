import React from 'react';
import { MapPin, Bus, ArrowLeftRight, Search } from 'lucide-react';
import { DatePicker } from '../../common/DatePicker';

interface SearchWidgetProps {
  allCities: string[];
  selectedOrigin: string;
  selectedDestination: string;
  travelDate: string;
  todayIso: string;
  vehicleFilter: string;
  onOriginChange: (origin: string) => void;
  onDestinationChange: (dest: string) => void;
  onDateChange: (date: string) => void;
  onVehicleFilterChange: (filter: string) => void;
  onSwapLocations: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({
  allCities,
  selectedOrigin,
  selectedDestination,
  travelDate,
  todayIso,
  vehicleFilter,
  onOriginChange,
  onDestinationChange,
  onDateChange,
  onVehicleFilterChange,
  onSwapLocations,
  onSubmit,
}) => {
  return (
    <div className="w-full bg-white/90 supports-[backdrop-filter]:bg-white/85 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 border border-white/80 ring-1 ring-slate-900/10 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.32)]">
      <form
        onSubmit={onSubmit}
        aria-label="Find and book shuttle trips"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end"
      >
        {/* Origin + Swap + Destination Group */}
        <div className="sm:col-span-2 lg:col-span-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-2.5 items-end">
          {/* Origin */}
          <div className="w-full">
            <label
              htmlFor="hero-origin"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              From
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="hero-origin"
                value={selectedOrigin}
                onChange={(e) => onOriginChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all cursor-pointer min-h-[44px]"
              >
                {allCities.map((city) => (
                  <option key={`from-${city}`} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center sm:pb-0.5">
            <button
              id="hero-swap-locations-btn"
              type="button"
              onClick={onSwapLocations}
              aria-label={`Swap origin and destination (${selectedOrigin} and ${selectedDestination})`}
              title={`Swap ${selectedOrigin} ↔ ${selectedDestination}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-2.5 h-10 sm:h-[44px] sm:w-[44px] rounded-xl bg-slate-100 hover:bg-amber-400 text-slate-700 hover:text-slate-950 border border-slate-200 hover:border-slate-900 font-bold text-xs transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              <span className="sm:hidden text-[11px] font-semibold">Swap</span>
            </button>
          </div>

          {/* Destination */}
          <div className="w-full">
            <label
              htmlFor="hero-destination"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              To
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="hero-destination"
                value={selectedDestination}
                onChange={(e) => onDestinationChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all cursor-pointer min-h-[44px]"
              >
                {allCities.map((city) => (
                  <option key={`to-${city}`} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Travel Date */}
        <div className="sm:col-span-1 lg:col-span-3 w-full">
          <label
            htmlFor="hero-date"
            className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Travel Date
          </label>
          <DatePicker
            id="hero-date"
            value={travelDate}
            onChange={onDateChange}
            variant="light"
            minDate={todayIso}
          />
        </div>

        {/* Vehicle Filter */}
        <div className="sm:col-span-1 lg:col-span-2 w-full">
          <label
            htmlFor="hero-vehicle-filter"
            className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Vehicle
          </label>
          <div className="relative">
            <Bus className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="hero-vehicle-filter"
              value={vehicleFilter}
              onChange={(e) => onVehicleFilterChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all cursor-pointer min-h-[44px]"
            >
              <option value="ALL">All Shuttles</option>
              <option value="11">11-Seater Executive</option>
              <option value="14">14-Seater Standard</option>
              <option value="16">16-Seater Maxi</option>
            </select>
          </div>
        </div>

        {/* Primary CTA: Book Your Seat / Find Trips */}
        <div className="sm:col-span-2 lg:col-span-2 w-full">
          <button
            id="hero-book-seat-btn"
            type="submit"
            className="craft-btn-amber w-full py-2.5 px-4 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 min-h-[44px] whitespace-nowrap cursor-pointer shadow-md active:scale-[0.99] transition-transform"
          >
            <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Book Your Seat</span>
          </button>
        </div>
      </form>

      {/* Metadata strip */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-medium">
          <span>Daily Departures</span>
          <span aria-hidden="true">·</span>
          <span>Live Seat Map</span>
          <span aria-hidden="true">·</span>
          <span>Instant M-Pesa Ticketing</span>
        </div>
        <span className="font-mono text-[11px] text-slate-600 font-semibold">
          Hotline: +254 724 626199
        </span>
      </div>
    </div>
  );
};
