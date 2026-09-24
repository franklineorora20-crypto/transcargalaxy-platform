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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header Bar */}
      <div className="bg-black rounded-3xl p-6 sm:p-8 text-white shadow-2xl border-2 border-amber-400/40">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-amber-400 text-black text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded">
            Scheduled Departures
          </span>
          <span className="text-neutral-400 text-xs font-semibold">NTSA Verified Fleet</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-white mb-2">
          Search Scheduled Departures
        </h1>
        <p className="text-sm text-neutral-300 mb-6">
          Check live seat availability and reserve your seats with instant M-Pesa confirmation.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchTrips();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          {/* Origin */}
          <div className="relative">
            <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1">
              From (Origin)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
              <select
                id="search-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
              >
                <option value="">All Origins</option>
                {uniqueOrigins.map((o) => (
                  <option key={o} value={o} className="bg-neutral-900 text-white">
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Destination */}
          <div className="relative">
            <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1">
              To (Destination)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
              <select
                id="search-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
              >
                <option value="">All Destinations</option>
                {uniqueDestinations.map((d) => (
                  <option key={d} value={d} className="bg-neutral-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1">
              Travel Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
              <input
                id="search-date"
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Passengers */}
          <div>
            <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1">
              Passengers
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
              <select
                id="search-passengers"
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num} className="bg-neutral-900 text-white">
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
              className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer border border-black"
            >
              <Search className="w-4 h-4 text-black stroke-[3]" />
              <span>Update Search</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Results Grid with Left Filter Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6 bg-white p-6 rounded-2xl border-2 border-neutral-200 shadow-sm h-fit">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h3 className="font-black text-sm text-black flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-500" />
              <span>Filter Results</span>
            </h3>
            <span className="text-xs font-bold text-neutral-500">{filteredTrips.length} Available</span>
          </div>

          {/* Time of Day */}
          <div className="space-y-2">
            <label className="text-xs font-black text-black uppercase tracking-wider block">Departure Window</label>
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
                  className={`p-2 text-xs rounded-lg font-black border text-left transition-all ${
                    timeFilter === t.id
                      ? 'bg-black text-amber-400 border-black shadow'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coach Class / Bus Type */}
          <div className="space-y-2">
            <label className="text-xs font-black text-black uppercase tracking-wider block">Coach Class</label>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border-2 border-neutral-300 bg-white font-bold text-black focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            >
              <option value="ALL">All Coach Classes</option>
              <option value="hiace-16">Toyota HiAce 16-Seater</option>
              <option value="hiace-14">Toyota HiAce 14-Seater</option>
              <option value="hiace-11">Toyota HiAce 11-Seater</option>
            </select>
          </div>

          {/* Maximum Fare */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-black uppercase tracking-wider">MAX FARE</span>
              <span className="font-mono font-black text-black bg-amber-400 px-2 py-0.5 rounded">KES 3,000</span>
            </div>
          </div>

          {/* Availability toggle */}
          <div className="pt-2 border-t border-neutral-200">
            <label className="flex items-center gap-2 text-xs font-bold text-black cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span>Hide sold-out departures</span>
            </label>
          </div>
        </div>

        {/* Right Search Results Cards */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-12 text-center text-neutral-600">
              <Bus className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <p className="font-bold text-black">Checking scheduled departures...</p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-12 text-center text-neutral-600">
              <p className="font-black text-black text-lg">No trips found matching your criteria.</p>
              <p className="text-xs text-neutral-500 mt-1">Try broadening your date or city filter.</p>
              {!demoMode && (
                <button
                  type="button"
                  onClick={() => {
                    setDemoMode(true);
                    fetchTrips(true);
                  }}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-sm font-black border border-black shadow-sm"
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
                  className="bg-white rounded-2xl border-2 border-neutral-200 shadow-sm hover:border-amber-400 hover:shadow-lg transition-all p-5 sm:p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-4 border-b border-neutral-200">
                    {/* Vehicle Photo + Time & Corridor */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      {/* Vehicle Thumbnail */}
                      {trip.vehicle.imageUrl && (
                        <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-neutral-300 flex-shrink-0 bg-neutral-950 group">
                          <img
                            src={trip.vehicle.imageUrl}
                            alt={trip.vehicle.model}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/images/transcar_stalker_kdv149e.jpg';
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute bottom-1 right-1 text-[9px] font-mono font-black bg-black/90 text-amber-400 px-1.5 py-0.5 rounded">
                            {trip.vehicle.registrationNumber}
                          </span>
                        </div>
                      )}

                      {/* Time & Corridor */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <span className="text-2xl font-black text-black font-mono">{formattedDep}</span>
                          <span className="text-xs text-neutral-600 block font-bold">{trip.route.origin}</span>
                        </div>

                        <div className="flex-1 min-w-[120px] text-center px-3">
                          <span className="text-[11px] font-bold text-neutral-500 flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>{trip.route.estimatedDurationHours}h trip</span>
                          </span>
                          <div className="relative my-1.5 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-neutral-300" />
                            <Bus className="w-4 h-4 text-amber-500 absolute bg-white px-0.5" />
                          </div>
                          <span className="text-[10px] text-amber-400 font-black bg-black px-2 py-0.5 rounded border border-amber-400/40">
                            {trip.route.distanceKm} KM Express
                          </span>
                        </div>

                        <div className="text-center">
                          <span className="text-2xl font-black text-black font-mono">{formattedArr}</span>
                          <span className="text-xs text-neutral-600 block font-bold">{trip.route.destination}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Booking Action */}
                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase font-black block md:text-right">Per Seat</span>
                        <span className="text-2xl font-black text-black font-mono">
                          KES {trip.fareKsh.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          trip.availableSeats <= 3 
                            ? 'bg-red-50 text-red-600 border-red-200' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                          Available Seats {trip.availableSeats}/{trip.totalSeats}
                        </span>
                        <button
                          onClick={() => onSelectTrip(trip)}
                          disabled={trip.availableSeats === 0}
                          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-black w-full"
                        >
                          <span>{trip.availableSeats === 0 ? 'Sold Out' : 'Select Seats'}</span>
                          <ArrowRight className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Amenities & Fleet Meta */}
                  <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-amber-400 font-mono bg-black px-2.5 py-0.5 rounded border border-neutral-800">
                        {trip.vehicle.registrationNumber}
                      </span>
                      {trip.vehicle.specialEdition && (
                        <span className="bg-amber-400 text-black font-extrabold text-[11px] px-2 py-0.5 rounded">
                          {trip.vehicle.specialEdition}
                        </span>
                      )}
                      <span className="text-neutral-700 font-bold">
                        {trip.vehicle.model}
                      </span>
                      <span className="text-neutral-300">|</span>
                      <div className="flex items-center gap-2 text-neutral-700">
                        {trip.amenities.slice(0, 3).map((amenity, i) => (
                          <span key={i} className="flex items-center gap-1 text-[11px] bg-neutral-100 text-black font-medium px-2 py-0.5 rounded border border-neutral-200">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-bold">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded border ${
                          trip.availableSeats <= 5
                            ? 'bg-black text-amber-400 border-amber-400 font-black'
                            : 'bg-neutral-100 text-black border-neutral-300'
                        }`}
                      >
                        {trip.availableSeats} of {trip.totalSeats} seats remaining
                      </span>
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
