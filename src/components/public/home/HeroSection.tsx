import React from 'react';
import { SearchWidget } from './SearchWidget';

interface HeroSectionProps {
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

export const HeroSection: React.FC<HeroSectionProps> = ({
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
    <section className="relative text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 overflow-hidden isolate">
      {/* Background Image with Directional Scrim */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-slate-950">
        <img
          src="/images/transcar_user_uploaded_hero.webp"
          alt="TransCar Rongai Express Shuttle"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/transcar_user_uploaded_hero.jpg';
          }}
          className="w-full h-full object-cover object-center opacity-85 sm:scale-[1.01] transition-transform duration-700"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-950/90"></div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-slate-950/30"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-3 relative z-10">
        {/* Corridor Kicker */}
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-amber-300 font-semibold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true"></span>
          <span>Premier Rongai & Intercity Express Transportation</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow [text-wrap:balance]">
          Intercity Transit,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">
            Refined.
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto font-normal leading-relaxed">
          Daily express shuttle service between Rongai, Nairobi, Kisii & Western Kenya. Select your seat with instant M-Pesa automated booking.
        </p>
      </div>

      {/* Merged Compact Booking Search Card */}
      <div className="max-w-5xl mx-auto mt-6 sm:mt-8 relative z-10">
        <SearchWidget
          allCities={allCities}
          selectedOrigin={selectedOrigin}
          selectedDestination={selectedDestination}
          travelDate={travelDate}
          todayIso={todayIso}
          vehicleFilter={vehicleFilter}
          onOriginChange={onOriginChange}
          onDestinationChange={onDestinationChange}
          onDateChange={onDateChange}
          onVehicleFilterChange={onVehicleFilterChange}
          onSwapLocations={onSwapLocations}
          onSubmit={onSubmit}
        />
      </div>
    </section>
  );
};
