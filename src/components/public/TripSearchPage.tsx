import React from 'react';
import {
  Search,
  MapPin,
  Bus,
  ArrowRight,
  ArrowLeftRight,
  SlidersHorizontal,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Trip, Route } from '../../types';
import { ApiService } from '../../services/api';
import { DatePicker } from '../common/DatePicker';
import { CAR_SEAT_VIEW_SEATS } from './SeatSelector';
import { TripDetailsDrawer } from './TripDetailsDrawer';

interface TripSearchPageProps {
  onSelectTrip: (trip: Trip, chosenCarSeatView?: 11 | 14 | 16) => void;
  defaultOrigin?: string;
  defaultDestination?: string;
  defaultDate?: string;
  defaultCarSeatView?: 11 | 14 | 16 | null;
}

export const TripSearchPage: React.FC<TripSearchPageProps> = ({
  onSelectTrip,
  defaultOrigin = '',
  defaultDestination = '',
  defaultDate = '',
  defaultCarSeatView = null,
}) => {
  const todayIso = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const [origin, setOrigin] = React.useState(defaultOrigin);
  const [destination, setDestination] = React.useState(defaultDestination);
  const [travelDate, setTravelDate] = React.useState(defaultDate || todayIso);

  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [routes, setRoutes] = React.useState<Route[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [demoMode] = React.useState(false);

  // Progressive disclosure filters & Trip Details Drawer
  const [showFiltersDrawer, setShowFiltersDrawer] = React.useState(false);
  const [timeFilter, setTimeFilter] = React.useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'NIGHT'>('ALL');
  const [serviceTypeFilter, setServiceTypeFilter] = React.useState<string>(
    defaultCarSeatView === 11
      ? 'hiace-11'
      : defaultCarSeatView === 14
      ? 'hiace-14'
      : defaultCarSeatView === 16
      ? 'hiace-16'
      : 'ALL'
  );
  const [maxPrice] = React.useState<number>(5000);
  const [onlyAvailable, setOnlyAvailable] = React.useState(true);
  const [drawerTrip, setDrawerTrip] = React.useState<Trip | null>(null);

  const fetchTrips = React.useCallback(
    async (useDemoMode = demoMode) => {
      setLoading(true);
      setErrorMessage(null);
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
        setErrorMessage("We couldn't load the trips. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [origin, destination, travelDate, demoMode]
  );

  React.useEffect(() => {
    ApiService.getRoutes()
      .then((data) => setRoutes(data))
      .catch((err) => console.error(err));
    fetchTrips();
  }, [fetchTrips]);

  const allCities = React.useMemo(() => {
    const set = new Set<string>(['Rongai', 'Kisii']);
    routes.forEach((r) => {
      if (r.origin) set.add(r.origin);
      if (r.destination) set.add(r.destination);
    });
    return Array.from(set);
  }, [routes]);

  const handleSwapLocations = () => {
    const prevOrigin = origin;
    const prevDest = destination;
    setOrigin(prevDest);
    setDestination(prevOrigin);
  };

  // Apply frontend filters
  const filteredTrips = React.useMemo(() => {
    return trips.filter((t) => {
      const cap: 11 | 14 | 16 =
        t.vehicle?.seatingCapacity === 11
          ? 11
          : t.vehicle?.seatingCapacity === 16
          ? 16
          : 14;
      const validSeats = CAR_SEAT_VIEW_SEATS[cap];
      const bookedSet = new Set(t.bookedSeatNumbers || []);
      const openSeats = Math.max(
        0,
        validSeats.length - validSeats.filter((s) => bookedSet.has(s)).length
      );

      if (onlyAvailable && openSeats <= 0) return false;
      if (t.fareKsh > maxPrice) return false;

      if (serviceTypeFilter === 'hiace-16' && cap !== 16) return false;
      if (serviceTypeFilter === 'hiace-14' && cap !== 14) return false;
      if (serviceTypeFilter === 'hiace-11' && cap !== 11) return false;

      if (timeFilter !== 'ALL') {
        const hour = new Date(t.departureTime).getHours();
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

  const activeSecondaryFilterCount =
    (timeFilter !== 'ALL' ? 1 : 0) + (!onlyAvailable ? 1 : 0);

  const resolveChosenCap = (trip: Trip): 11 | 14 | 16 => {
    if (serviceTypeFilter === 'hiace-11') return 11;
    if (serviceTypeFilter === 'hiace-14') return 14;
    if (serviceTypeFilter === 'hiace-16') return 16;
    if (trip.vehicle?.seatingCapacity === 11) return 11;
    if (trip.vehicle?.seatingCapacity === 16) return 16;
    return 14;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Primary Search Bar (Sections 14-17 & 21) */}
      <div className="bg-slate-950 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800/90 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Find a Trip
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare departure times, vehicle capacity, and live seat availability.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'} available
            </span>
            <button
              type="button"
              onClick={() => setShowFiltersDrawer(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Filters</span>
              {activeSecondaryFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                  {activeSecondaryFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <form
          onSubmit={handleFormSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 items-end"
        >
          {/* From + Swap + To */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-2.5 items-end">
            <div>
              <label
                htmlFor="search-origin"
                className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                From
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="search-origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all cursor-pointer min-h-[44px]"
                >
                  <option value="">All Origins</option>
                  {allCities.map((city) => (
                    <option key={`from-${city}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center sm:pb-0.5">
              <button
                type="button"
                onClick={handleSwapLocations}
                aria-label="Swap origin and destination"
                title="Swap Origin & Destination"
                className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-2.5 h-10 sm:h-[44px] sm:w-[44px] rounded-xl bg-slate-900 hover:bg-amber-400 text-slate-300 hover:text-slate-950 border border-slate-700 hover:border-amber-400 font-bold text-xs transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0" />
                <span className="sm:hidden text-[11px] font-semibold">Swap Route</span>
              </button>
            </div>

            <div>
              <label
                htmlFor="search-destination"
                className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                To
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="search-destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all cursor-pointer min-h-[44px]"
                >
                  <option value="">All Destinations</option>
                  {allCities.map((city) => (
                    <option key={`to-${city}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="lg:col-span-3">
            <label
              htmlFor="search-date"
              className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Date
            </label>
            <DatePicker
              id="search-date"
              value={travelDate}
              onChange={(date) => setTravelDate(date)}
              variant="dark"
              minDate={todayIso}
            />
          </div>

          {/* Vehicle */}
          <div className="lg:col-span-2">
            <label
              htmlFor="search-vehicle"
              className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Vehicle
            </label>
            <div className="relative">
              <Bus className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="search-vehicle"
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all cursor-pointer min-h-[44px]"
              >
                <option value="ALL">All Vehicles</option>
                <option value="hiace-11">11-Seater</option>
                <option value="hiace-14">14-Seater</option>
                <option value="hiace-16">16-Seater</option>
              </select>
            </div>
          </div>

          {/* Primary Search CTA */}
          <div className="lg:col-span-2">
            <button
              id="search-submit-btn"
              type="submit"
              className="craft-btn-amber w-full py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
            >
              <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Find Trips</span>
            </button>
          </div>
        </form>
      </div>

      {/* Trip Results List (Section 20, 34, 35, 36) */}
      <div className="space-y-4">
        {loading ? (
          /* 35. SKELETON LOADERS */
          <div className="space-y-3.5" aria-label="Loading trips">
            {[1, 2, 3].map((i) => (
              <div key={`trip-skeleton-${i}`} className="craft-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-44 rounded skeleton-shimmer" />
                  <div className="h-6 w-24 rounded skeleton-shimmer" />
                </div>
                <div className="h-10 w-full rounded-lg skeleton-shimmer" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-5 w-32 rounded skeleton-shimmer" />
                  <div className="h-10 w-36 rounded-xl skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          /* 36. HUMAN-READABLE ERROR STATE */
          <div className="craft-card p-10 text-center space-y-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">We couldn't load the trips</h2>
              <p className="text-xs text-slate-500">Please try again.</p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fetchTrips()}
                className="craft-btn-amber text-xs px-5 py-2.5 font-bold inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        ) : filteredTrips.length === 0 ? (
          /* 34. USEFUL EMPTY STATE */
          <div className="craft-card p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-950">No trips found</h2>
              <p className="text-xs sm:text-sm text-slate-600">Try:</p>
              <ul className="text-xs text-slate-600 space-y-1 inline-block text-left font-medium pt-1">
                <li>• another date</li>
                <li>• another route</li>
                <li>• another vehicle type</li>
              </ul>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setTravelDate(todayIso);
                  setOrigin('');
                  setDestination('');
                  setServiceTypeFilter('ALL');
                  setTimeFilter('ALL');
                  setOnlyAvailable(false);
                }}
                className="craft-btn-amber text-xs px-5 py-2.5 font-bold cursor-pointer"
              >
                Change Search
              </button>
            </div>
          </div>
        ) : (
          /* 20. TRIP CARDS */
          filteredTrips.map((trip) => {
            const depTime = new Date(trip.departureTime);
            const arrTime = new Date(trip.estimatedArrivalTime);
            const formattedDep = depTime.toLocaleTimeString('en-KE', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const formattedArr = arrTime.toLocaleTimeString('en-KE', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const vehicleCap: 11 | 14 | 16 =
              trip.vehicle?.seatingCapacity === 11
                ? 11
                : trip.vehicle?.seatingCapacity === 16
                ? 16
                : 14;
            const validSeats = CAR_SEAT_VIEW_SEATS[vehicleCap];
            const bookedSet = new Set(trip.bookedSeatNumbers || []);
            const openSeats = Math.max(
              0,
              validSeats.length - validSeats.filter((s) => bookedSet.has(s)).length
            );

            const durationHours = trip.route?.estimatedDurationHours || 6.5;
            const wholeHours = Math.floor(durationHours);
            const mins = Math.round((durationHours - wholeHours) * 60);
            const durationFormatted = mins > 0 ? `${wholeHours}h ${mins}m` : `${wholeHours}h`;

            return (
              <div
                key={trip.id}
                id={`trip-card-${trip.id}`}
                className="craft-card-interactive p-5 sm:p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Left: Route, Departure -> Arrival, Duration */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center justify-between md:justify-start gap-2.5">
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight">
                        {trip.route.origin} → {trip.route.destination}
                      </h2>
                      <span className="text-xs font-medium text-slate-500 font-mono">
                        {vehicleCap}-Seater • {trip.vehicle.registrationNumber}
                      </span>
                    </div>

                    {/* Schedule Line: 08:00 AM -------- 02:30 PM (6h 30m • Direct) */}
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div>
                        <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-950 tabular-nums block">
                          {formattedDep}
                        </span>
                        <span className="text-xs text-slate-500 font-medium block">
                          {trip.route.origin}
                        </span>
                      </div>

                      <div className="flex flex-col items-center px-2 min-w-[96px] sm:min-w-[130px]">
                        <span className="text-[11px] font-mono font-semibold text-slate-600">
                          {durationFormatted} • Direct
                        </span>
                        <div className="w-full h-px bg-slate-200 my-1.5 relative flex items-center justify-center">
                          <Bus className="w-3.5 h-3.5 text-amber-500 bg-white px-0.5" />
                        </div>
                      </div>

                      <div>
                        <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-950 tabular-nums block">
                          {formattedArr}
                        </span>
                        <span className="text-xs text-slate-500 font-medium block">
                          {trip.route.destination}
                        </span>
                      </div>
                    </div>

                    {/* Vehicle & Availability Meta */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs">
                      <span className="status-neutral font-semibold">
                        <Bus className="w-3.5 h-3.5 text-slate-600" />
                        <span>{vehicleCap}-Seater</span>
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
                            : `${openSeats} ${openSeats === 1 ? 'seat' : 'seats'} available`}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Price & Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] font-medium text-slate-500 block">Per Seat</span>
                      <span className="text-2xl font-extrabold font-mono text-slate-950 tabular-nums">
                        KSh {trip.fareKsh.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDrawerTrip(trip)}
                        className="craft-btn-secondary text-xs py-2.5 px-3.5 font-semibold min-h-[42px]"
                      >
                        View Trip
                      </button>

                      <button
                        type="button"
                        disabled={openSeats === 0}
                        onClick={() => onSelectTrip(trip, resolveChosenCap(trip))}
                        className="craft-btn-amber text-xs py-2.5 px-4 font-bold inline-flex items-center gap-1.5 min-h-[42px]"
                      >
                        <span>{openSeats === 0 ? 'Sold Out' : 'Select Trip'}</span>
                        {openSeats > 0 && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 21. SECONDARY FILTERS DRAWER / MOBILE BOTTOM SHEET */}
      {showFiltersDrawer && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-[2px] animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Filter trips"
          onClick={() => setShowFiltersDrawer(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-950">Filter Trips</h3>
              <button
                type="button"
                onClick={() => setShowFiltersDrawer(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Departure Window */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Departure Window</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'ALL', label: 'All Times' },
                  { id: 'MORNING', label: 'Morning (5am–12pm)' },
                  { id: 'AFTERNOON', label: 'Afternoon (12pm–6pm)' },
                  { id: 'NIGHT', label: 'Night (6pm+)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeFilter(t.id as any)}
                    className={`p-2.5 text-xs rounded-xl font-semibold border text-left transition-all cursor-pointer ${
                      timeFilter === t.id
                        ? 'bg-slate-950 text-amber-400 border-slate-950'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Vehicle</label>
              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none min-h-[42px]"
              >
                <option value="ALL">All Vehicles</option>
                <option value="hiace-11">11-Seater</option>
                <option value="hiace-14">14-Seater</option>
                <option value="hiace-16">16-Seater</option>
              </select>
            </div>

            {/* Availability Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span>Only show trips with available seats</span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setTimeFilter('ALL');
                  setServiceTypeFilter('ALL');
                  setOnlyAvailable(true);
                }}
                className="craft-btn-tertiary text-xs font-semibold"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => setShowFiltersDrawer(false)}
                className="craft-btn-amber text-xs py-2.5 px-5 font-bold"
              >
                Show {filteredTrips.length} {filteredTrips.length === 1 ? 'Trip' : 'Trips'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 22. TRIP DETAILS DRAWER */}
      <TripDetailsDrawer
        trip={drawerTrip}
        selectedVehicleCapacity={
          serviceTypeFilter === 'hiace-11'
            ? 11
            : serviceTypeFilter === 'hiace-14'
            ? 14
            : serviceTypeFilter === 'hiace-16'
            ? 16
            : null
        }
        onClose={() => setDrawerTrip(null)}
        onSelectSeats={(trip, cap) => {
          setDrawerTrip(null);
          onSelectTrip(trip, cap);
        }}
      />
    </div>
  );
};
