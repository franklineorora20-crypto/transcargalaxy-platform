import React from 'react';
import {
  Search,
  Calendar,
  Users,
  MapPin,
  Clock,
  Bus,
  Shield,
  Filter,
  Wifi,
  Zap,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Trip, Route } from '../../types';
import { ApiService } from '../../services/api';

interface TripSearchPageProps {
  onSelectTrip: (trip: Trip) => void;
  defaultOrigin?: string;
  defaultDestination?: string;
  defaultDate?: string;
  defaultPassengers?: number;
}

export const TripSearchPage: React.FC<TripSearchPageProps> = ({
  onSelectTrip,
  defaultOrigin = '',
  defaultDestination = '',
  defaultDate = '',
  defaultPassengers = 1,
}) => {
  const [origin, setOrigin] = React.useState(defaultOrigin);
  const [destination, setDestination] = React.useState(defaultDestination);
  const [travelDate, setTravelDate] = React.useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [passengers, setPassengers] = React.useState(defaultPassengers);

  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [routes, setRoutes] = React.useState<Route[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [demoMode, setDemoMode] = React.useState(false);

  // Filters
  const [timeFilter, setTimeFilter] = React.useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'NIGHT'>('ALL');
  const [serviceTypeFilter, setServiceTypeFilter] = React.useState<string>('ALL');
  const [maxPrice, setMaxPrice] = React.useState<number>(3000);
  const [onlyAvailable, setOnlyAvailable] = React.useState(true);

  const fetchTrips = React.useCallback(async (useDemoMode = demoMode) => {
    setLoading(true);
    try {
      const data = await ApiService.searchTrips({
        origin: origin || undefined,
        destination: destination || undefined,
        date: travelDate || undefined,
        demo: useDemoMode,
      });
      setTrips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, travelDate, demoMode]);

  React.useEffect(() => {
    ApiService.getRoutes()
      .then((data) => setRoutes(data))
      .catch((err) => console.error(err));
    fetchTrips();
  }, [fetchTrips]);

  const uniqueOrigins = React.useMemo(() => Array.from(new Set(routes.map((r) => r.origin))), [routes]);
  const uniqueDestinations = React.useMemo(() => Array.from(new Set(routes.map((r) => r.destination))), [routes]);

  // Apply frontend filters
  const filteredTrips = React.useMemo(() => {
    return trips.filter((t) => {
      // Available seats check
      if (onlyAvailable && t.availableSeats <= 0) return false;

      // Price filter
      if (t.fareKsh > maxPrice) return false;

      // Fleet filter: expose only the supported Toyota Hiace body sizes.
      if (serviceTypeFilter === 'hiace-16' && !(t.vehicle.model.toLowerCase().includes('toyota hiace') && t.vehicle.seatingCapacity === 16)) return false;
      if (serviceTypeFilter === 'hiace-14' && !(t.vehicle.model.toLowerCase().includes('toyota hiace') && t.vehicle.seatingCapacity === 14)) return false;
      if (serviceTypeFilter === 'hiace-11' && !(t.vehicle.model.toLowerCase().includes('toyota hiace') && t.vehicle.seatingCapacity === 11)) return false;

      // Time filter
      if (timeFilter !== 'ALL') {
        const hour = new Date(t.departureTime).getUTCHours();
        if (timeFilter === 'MORNING' && (hour < 5 || hour >= 12)) return false;
        if (timeFilter === 'AFTERNOON' && (hour < 12 || hour >= 18)) return false;
        if (timeFilter === 'NIGHT' && hour < 18 && hour >= 5) return false;
      }

      return true;
    });
  }, [trips, onlyAvailable, maxPrice, serviceTypeFilter, timeFilter]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrips();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Search Filter Header (Emil Kowalski Tactile Surface) */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-2xl border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-extrabold text-white tracking-tight">Available Departures</h1>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full">
            {filteredTrips.length} shuttles scheduled
          </span>
        </div>

        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Origin */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              From
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
              <select
                id="search-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all cursor-pointer"
              >
                <option value="">All Origins</option>
                {uniqueOrigins.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              To
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
              <select
                id="search-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all cursor-pointer"
              >
                <option value="">All Destinations</option>
                {uniqueDestinations.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Travel Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="search-date"
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Passengers */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Passengers
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Passenger' : 'Passengers'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-end">
            <button
              id="search-submit-btn"
              type="submit"
              className="craft-btn-amber w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Update Results</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Results Grid with Left Filter Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6 craft-card p-6 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-500" />
              <span>Filters</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">{filteredTrips.length} Available</span>
          </div>

          {/* Time of Day */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Departure Window</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'ALL', label: 'All Times' },
                { id: 'MORNING', label: 'Morning (5am - 12pm)' },
                { id: 'AFTERNOON', label: 'Afternoon (12pm - 6pm)' },
                { id: 'NIGHT', label: 'Night Express (6pm+)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeFilter(t.id as any)}
                  className={`p-2 text-xs rounded-lg font-semibold border text-left transition-all ${
                    timeFilter === t.id
                      ? 'bg-slate-950 text-amber-400 border-slate-950 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coach Class */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Coach Class</label>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Coach Classes</option>
              <option value="hiace-16">Toyota HiAce 16-Seater</option>
              <option value="hiace-14">Toyota HiAce 14-Seater</option>
              <option value="hiace-11">Toyota HiAce 11-Seater</option>
            </select>
          </div>

          {/* Availability toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
              />
              <span>Hide sold-out departures</span>
            </label>
          </div>
        </div>

        {/* Right Search Results Cards */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="craft-card p-12 text-center text-slate-600">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto mb-3"></div>
              <p className="font-bold text-slate-900 text-sm">Checking scheduled departures...</p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="craft-card p-12 text-center text-slate-600">
              <p className="font-bold text-slate-900 text-lg">No trips found matching your criteria.</p>
              <p className="text-xs text-slate-500 mt-1">Try broadening your date or city filter.</p>
              {!demoMode && (
                <button
                  type="button"
                  onClick={() => {
                    setDemoMode(true);
                    fetchTrips(true);
                  }}
                  className="craft-btn-amber text-xs mt-5"
                >
                  Load demo trips
                </button>
              )}
            </div>
          ) : (
            filteredTrips.map((trip) => {
              const depTime = new Date(trip.departureTime);
              const arrTime = new Date(trip.estimatedArrivalTime);
              const formattedDep = depTime.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
              const formattedArr = arrTime.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={trip.id}
                  id={`trip-card-${trip.id}`}
                  className="craft-card-interactive p-5 sm:p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-4 border-b border-slate-100">
                    {/* Vehicle Photo + Time & Corridor */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      {/* Vehicle Thumbnail */}
                      {trip.vehicle.imageUrl && (
                        <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-950 group">
                          <img
                            src={trip.vehicle.imageUrl}
                            alt={trip.vehicle.model}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/images/transcar_stalker_kdv149e.jpg';
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold bg-slate-950/90 text-amber-400 px-1.5 py-0.5 rounded">
                            {trip.vehicle.registrationNumber}
                          </span>
                        </div>
                      )}

                      {/* Time & Corridor */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <span className="text-2xl font-extrabold text-slate-950 font-mono">{formattedDep}</span>
                          <span className="text-xs text-slate-600 block font-semibold">{trip.route.origin}</span>
                        </div>

                        <div className="flex-1 min-w-[120px] text-center px-3">
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>{trip.route.estimatedDurationHours}h trip</span>
                          </span>
                          <div className="relative my-1.5 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-slate-200" />
                            <Bus className="w-4 h-4 text-amber-500 absolute bg-white px-0.5" />
                          </div>
                          <span className="text-[10px] text-amber-400 font-bold font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {trip.route.distanceKm} KM Express
                          </span>
                        </div>

                        <div className="text-center">
                          <span className="text-2xl font-extrabold text-slate-950 font-mono">{formattedArr}</span>
                          <span className="text-xs text-slate-600 block font-semibold">{trip.route.destination}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Booking Action */}
                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block md:text-right">Per Seat</span>
                        <span className="text-2xl font-extrabold text-slate-950 tabular-nums font-mono">
                          KES {trip.fareKsh.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          trip.availableSeats <= 3 
                            ? 'bg-red-50 text-red-600 border-red-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {trip.availableSeats}/{trip.totalSeats} seats open
                        </span>
                        <button
                          onClick={() => onSelectTrip(trip)}
                          disabled={trip.availableSeats === 0}
                          className="craft-btn-amber text-xs py-2 px-4 w-full flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span>{trip.availableSeats === 0 ? 'Sold Out' : 'Select Seats'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Amenities & Fleet Meta */}
                  <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-amber-400 font-mono bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 text-[11px]">
                        {trip.vehicle.registrationNumber}
                      </span>
                      {trip.vehicle.specialEdition && (
                        <span className="bg-amber-400 text-slate-950 font-bold text-[11px] px-2 py-0.5 rounded">
                          {trip.vehicle.specialEdition}
                        </span>
                      )}
                      <span className="text-slate-700 font-medium">
                        {trip.vehicle.model}
                      </span>
                      <span className="text-slate-300">|</span>
                      <div className="flex items-center gap-2 text-slate-700">
                        {trip.amenities.slice(0, 3).map((amenity, i) => (
                          <span key={i} className="flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-500">Speed Governed (80 km/h) • GPS Live</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
