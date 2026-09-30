import React from 'react';
import {
  Search,
  MapPin,
  Bus,
  ArrowRight,
  ArrowLeftRight,
  Eye,
  X,
  Check,
  Calendar,
} from 'lucide-react';
import { Route, Trip } from '../../types';
import { DatePicker } from '../common/DatePicker';
import { ApiService } from '../../services/api';
import { CAR_SEAT_VIEW_SEATS } from './SeatSelector';
import { TripDetailsDrawer } from './TripDetailsDrawer';

interface HomePageProps {
  routes: Route[];
  onStartSearch: (
    origin?: string,
    destination?: string,
    date?: string,
    vehicleCapacity?: 11 | 14 | 16 | null
  ) => void;
  onSelectTrip?: (trip: Trip, chosenVehicleCapacity?: 11 | 14 | 16) => void;
  onTrackBus: () => void;
  onRetrieveTicket: () => void;
  onSelectRoute?: (route: Route) => void;
  onOpenTutorial?: () => void;
  onOpenSchedules?: () => void;
  onOpenFleet?: () => void;
}

interface FleetVehicleShowcase {
  id: string;
  reg: string;
  title: string;
  edition: string;
  category: '11-Seater' | '14-Seater' | '16-Seater';
  seats: 11 | 14 | 16;
  image: string;
  description: string;
  corridor: string;
  seatLayoutSummary: string;
  amenities: string[];
  searchOrigin: string;
  searchDestination: string;
}

export const FLEET_SHOWCASE_DATA: FleetVehicleShowcase[] = [
  {
    id: 'fleet-1',
    reg: 'KDE 416Q',
    title: 'TransCar rongai Executive HiAce',
    edition: '11-Seater Executive Shuttle',
    category: '11-Seater',
    seats: 11,
    image: '/images/transcar_highway_kde4160.webp',
    description:
      'Spacious 11-seater Toyota HiAce with 2 front passenger seats beside the driver and 3 rear rows (3 seats each) for extra legroom.',
    corridor: 'Rongai · Kiserian · Kisii Express Corridor',
    seatLayoutSummary: '2 Front Seats beside Driver (P1, P2) + 3 Rear Rows of 3 Seats (1A–3C)',
    amenities: [
      '11 Passenger Seats',
      'High-Speed Wi-Fi',
      'USB Charging Ports',
      'Air Conditioning',
      'Speed Governor (80 km/h)',
    ],
    searchOrigin: 'Rongai',
    searchDestination: 'Kisii',
  },
  {
    id: 'fleet-2',
    reg: 'KDF 520M',
    title: 'TransCar rongai Direct HiAce',
    edition: '11-Seater Express Shuttle',
    category: '11-Seater',
    seats: 11,
    image: '/images/transcar_highway_kde4160.webp',
    description:
      'Reliable 11-passenger Toyota HiAce shuttle for direct intercity travel with reclining seats and real-time GPS tracking.',
    corridor: 'Kisii · Narok · Rongai Direct',
    seatLayoutSummary: '2 Front Seats beside Driver (P1, P2) + 3 Rear Rows of 3 Seats (1A–3C)',
    amenities: [
      '11 Passenger Seats',
      'Reclining Comfort Seats',
      'Air Conditioning',
      'GPS Tracking',
      'Direct Line: +254 724 626199',
    ],
    searchOrigin: 'Kisii',
    searchDestination: 'Rongai',
  },
  {
    id: 'fleet-3',
    reg: 'KDV 149E',
    title: 'TransCar rongai Intercity HiAce',
    edition: '14-Seater Standard Shuttle',
    category: '14-Seater',
    seats: 14,
    image: '/images/transcar_stalker_kdv149e.webp',
    description:
      'Standard 14-seater Kenyan PSV Toyota HiAce featuring 2 front passenger seats beside the driver, aisle walkway access, and a 4-seat rear bench.',
    corridor: 'Rongai · Suswa · Kisii Express Corridor',
    seatLayoutSummary:
      '2 Front Seats beside Driver (P1, P2) + Rows 1–3 (8 Seats) + 4-Seat Rear Bench (4A–4D)',
    amenities: [
      '14 Passenger Seats',
      'High-Speed Wi-Fi',
      'USB Phone Charging',
      'Individual AC Louvers',
      'Satellite GPS Telematics',
    ],
    searchOrigin: 'Rongai',
    searchDestination: 'Kisii',
  },
  {
    id: 'fleet-4',
    reg: 'KDE 832Y',
    title: 'TransCar rongai Day Shuttle',
    edition: '14-Seater Corridor Shuttle',
    category: '14-Seater',
    seats: 14,
    image: '/images/transcar_kde832y_day.webp',
    description:
      'Daytime 14-seater Toyota HiAce intercity shuttle servicing the Rongai, Kiserian, Matasia, Ngong, Suswa, and Kisii corridor.',
    corridor: 'Rongai · Kiserian · Ngong · Suswa · Kisii',
    seatLayoutSummary:
      '2 Front Seats beside Driver (P1, P2) + Rows 1–3 (8 Seats) + 4-Seat Rear Bench (4A–4D)',
    amenities: [
      '14 Passenger Seats',
      'Certified PSV Captains',
      'Overhead Luggage Bins',
      '24/7 Dispatch Hotline',
      'Air Conditioning',
    ],
    searchOrigin: 'Rongai',
    searchDestination: 'Kisii',
  },
  {
    id: 'fleet-5',
    reg: 'KDA 123A',
    title: 'TransCar rongai Night Express',
    edition: '14-Seater Overnight Shuttle',
    category: '14-Seater',
    seats: 14,
    image: '/images/transcar_night_travel.webp',
    description:
      'Night-equipped 14-seater Toyota HiAce shuttle with calibrated reflective chevrons and scheduled express departures.',
    corridor: 'Rongai · Narok · Bomet · Kisii',
    seatLayoutSummary:
      '2 Front Seats beside Driver (P1, P2) + Rows 1–3 (8 Seats) + 4-Seat Rear Bench (4A–4D)',
    amenities: [
      '14 Passenger Seats',
      'Reflective Chevron Safety',
      'Certified PSV Driver',
      'Live GPS Tracking',
      'Air Conditioning',
    ],
    searchOrigin: 'Rongai',
    searchDestination: 'Kisii',
  },
  {
    id: 'fleet-6',
    reg: 'KDC 789C',
    title: 'TransCar rongai Maxi Shuttle',
    edition: '16-Seater Long-Wheelbase Shuttle',
    category: '16-Seater',
    seats: 16,
    image: '/images/transcar_highway_rear.webp',
    description:
      'Long-wheelbase 16-seater Toyota HiAce van configured with 2 front passenger seats beside the driver, extended cabin rows, and rear luggage bay.',
    corridor: 'Rongai · Kilgoris · Rongo · Kehancha',
    seatLayoutSummary:
      '2 Front Seats beside Driver (P1, P2) + Rows 1–4 (10 Seats) + 4-Seat Rear Bench (5A–5D)',
    amenities: [
      '16 Passenger Seats',
      'Reclining Bucket Seats',
      'Full Cabin AC',
      'Luggage Compartment',
      'Direct Dispatch',
    ],
    searchOrigin: 'Rongai',
    searchDestination: 'Rongo',
  },
];

export const PsvCabinLayoutDiagram: React.FC<{ capacity: 11 | 14 | 16 }> = ({ capacity }) => {
  const SeatBox: React.FC<{ label: string; highlight?: boolean }> = ({
    label,
    highlight = false,
  }) => (
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold border ${
        highlight
          ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
          : 'bg-slate-800 text-slate-200 border-slate-700'
      }`}
    >
      {label}
    </div>
  );

  return (
    <div className="bg-slate-950 text-white rounded-xl border border-slate-800 p-3.5 w-full max-w-[240px] mx-auto">
      <div className="text-center pb-2 mb-2.5 border-b border-slate-800">
        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
          {capacity}-Seater Kenyan PSV Layout
        </span>
        <span className="text-[9px] text-slate-400">2 Front Seats Beside Driver</span>
      </div>

      {/* Front Cabin: P1, P2 + Driver (RHD) */}
      <div className="mb-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 mb-1">
          <span>2 Front Seats</span>
          <span>Driver (RHD)</span>
        </div>
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1">
            <SeatBox label="P1" highlight />
            <SeatBox label="P2" highlight />
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-[8px] font-mono font-bold text-slate-400">
            DRV
          </div>
        </div>
      </div>

      {/* Rear Rows */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <SeatBox label="1A" />
          <span className="text-[8px] text-slate-600 font-mono">Aisle</span>
          <div className="flex items-center gap-1">
            <SeatBox label="1B" />
            <SeatBox label="1C" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <SeatBox label="2A" />
          <span className="text-[8px] text-slate-600 font-mono">|</span>
          <div className="flex items-center gap-1">
            <SeatBox label="2B" />
            <SeatBox label="2C" />
          </div>
        </div>

        {capacity === 11 && (
          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-center gap-1">
            <SeatBox label="3A" />
            <SeatBox label="3B" />
            <SeatBox label="3C" />
          </div>
        )}

        {capacity === 14 && (
          <>
            <div className="flex items-center justify-between">
              <SeatBox label="3A" />
              <span className="text-[8px] text-slate-600 font-mono">Door</span>
              <SeatBox label="3C" />
            </div>
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-center gap-1">
              <SeatBox label="4A" />
              <SeatBox label="4B" />
              <SeatBox label="4C" />
              <SeatBox label="4D" />
            </div>
          </>
        )}

        {capacity === 16 && (
          <>
            <div className="flex items-center justify-between">
              <SeatBox label="3A" />
              <span className="text-[8px] text-slate-600 font-mono">|</span>
              <div className="flex items-center gap-1">
                <SeatBox label="3B" />
                <SeatBox label="3C" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <SeatBox label="4A" />
              <span className="text-[8px] text-slate-600 font-mono">Pass</span>
              <div className="w-8" />
            </div>
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-center gap-1">
              <SeatBox label="5A" />
              <SeatBox label="5B" />
              <SeatBox label="5C" />
              <SeatBox label="5D" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({
  routes,
  onStartSearch,
  onSelectTrip,
}) => {
  const todayIso = React.useMemo(() => new Date().toISOString().split('T')[0], []);

  const [selectedOrigin, setSelectedOrigin] = React.useState('Rongai');
  const [selectedDestination, setSelectedDestination] = React.useState('Kisii');
  const [travelDate, setTravelDate] = React.useState(todayIso);
  const [vehicleFilter, setVehicleFilter] = React.useState<string>('ALL');
  const [fleetCategoryTab, setFleetCategoryTab] = React.useState<
    'ALL' | '11-Seater' | '14-Seater' | '16-Seater'
  >('ALL');
  const [inspectedVehicle, setInspectedVehicle] = React.useState<FleetVehicleShowcase | null>(null);
  const [drawerTrip, setDrawerTrip] = React.useState<Trip | null>(null);

  // Today's Departures state (real backend trip data)
  const [departuresDate, setDeparturesDate] = React.useState<string>(todayIso);
  const [departuresCorridorFilter, setDeparturesCorridorFilter] = React.useState<string>('ALL');
  const [liveTrips, setLiveTrips] = React.useState<Trip[]>([]);
  const [loadingDepartures, setLoadingDepartures] = React.useState<boolean>(true);

  const allCities = React.useMemo(() => {
    const set = new Set<string>(['Rongai', 'Kisii']);
    routes.forEach((r) => {
      if (r.origin) set.add(r.origin);
      if (r.destination) set.add(r.destination);
    });
    return Array.from(set);
  }, [routes]);

  const fetchDepartures = React.useCallback(async (targetDate: string) => {
    setLoadingDepartures(true);
    try {
      const data = await ApiService.searchTrips({ date: targetDate });
      setLiveTrips(data);
    } catch (err) {
      console.error('Failed to load departures:', err);
      setLiveTrips([]);
    } finally {
      setLoadingDepartures(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDepartures(departuresDate);
  }, [departuresDate, fetchDepartures]);

  const handleTravelDateChange = (newDate: string) => {
    setTravelDate(newDate);
    setDeparturesDate(newDate);
  };

  const handleSwapLocations = () => {
    const prevOrigin = selectedOrigin;
    const prevDest = selectedDestination;
    setSelectedOrigin(prevDest);
    setSelectedDestination(prevOrigin);
  };

  const triggerTripSearch = () => {
    const chosenVehicle: 11 | 14 | 16 | null =
      vehicleFilter === '11'
        ? 11
        : vehicleFilter === '14'
        ? 14
        : vehicleFilter === '16'
        ? 16
        : null;
    onStartSearch(selectedOrigin, selectedDestination, travelDate, chosenVehicle);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerTripSearch();
  };

  const handleBookVehicle = (veh: FleetVehicleShowcase) => {
    onStartSearch(veh.searchOrigin, veh.searchDestination, travelDate, veh.seats);
  };

  const filteredDepartures = React.useMemo(() => {
    return liveTrips.filter((t) => {
      if (departuresCorridorFilter !== 'ALL') {
        const corridorKey = `${t.route.origin} → ${t.route.destination}`;
        if (corridorKey !== departuresCorridorFilter) return false;
      }
      if (vehicleFilter !== 'ALL') {
        const cap = t.vehicle?.seatingCapacity || t.totalSeats || 14;
        if (String(cap) !== vehicleFilter) return false;
      }
      return true;
    });
  }, [liveTrips, departuresCorridorFilter, vehicleFilter]);

  const availableCorridorsInTrips = React.useMemo(() => {
    const set = new Set<string>();
    liveTrips.forEach((t) => {
      if (t.route?.origin && t.route?.destination) {
        set.add(`${t.route.origin} → ${t.route.destination}`);
      }
    });
    return Array.from(set);
  }, [liveTrips]);

  const filteredFleetShowcase = React.useMemo(() => {
    if (fleetCategoryTab === 'ALL') return FLEET_SHOWCASE_DATA;
    return FLEET_SHOWCASE_DATA.filter((v) => v.category === fleetCategoryTab);
  }, [fleetCategoryTab]);

  const handleViewTrip = (trip: Trip) => {
    setDrawerTrip(trip);
  };

  const handleSelectSeatsFromDrawer = (trip: Trip, chosenCap: 11 | 14 | 16) => {
    setDrawerTrip(null);
    if (onSelectTrip) {
      onSelectTrip(trip, chosenCap);
    } else {
      onStartSearch(trip.route.origin, trip.route.destination, departuresDate, chosenCap);
    }
  };

  return (
    <div className="space-y-10 pb-24 md:pb-16 w-full max-w-[100vw] overflow-x-hidden">
      {/* 1. MERGED HERO + QUICK SEARCH COMPACT CARD */}
      <section className="max-w-6xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-lg">
          {/* Compact Hero Visual Header */}
          <div className="relative bg-slate-950 text-white p-5 sm:p-8 overflow-hidden isolate">
            <img
              src="/images/transcar_user_uploaded_hero.webp"
              alt="TransCar rongai Toyota HiAce Express Shuttle"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  '/images/transcar_user_uploaded_hero.jpg';
              }}
              className="absolute inset-0 w-full h-full max-w-full object-cover object-center opacity-50 pointer-events-none"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/50" />

            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="text-xs text-amber-300 font-semibold tracking-wide">
                Ongata Rongai · Nairobi · Kisii Express Corridor
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight [text-wrap:balance]">
                Intercity Transit, Refined.
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Search live departures, choose your exact Kenyan PSV seat, and confirm instantly via M-Pesa.
              </p>
            </div>
          </div>

          {/* Integrated Quick Search Form */}
          <div className="p-4 sm:p-6 bg-white">
            <form
              onSubmit={handleSearchSubmit}
              aria-label="Find available shuttle trips"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
            >
              {/* FROM */}
              <div className="lg:col-span-3">
                <label
                  htmlFor="hero-origin"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  From
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="hero-origin"
                    value={selectedOrigin}
                    onChange={(e) => setSelectedOrigin(e.target.value)}
                    className="w-full min-h-[44px] pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    {allCities.map((city) => (
                      <option key={`from-${city}`} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SWAP ROUTE */}
              <div className="lg:col-span-1">
                <button
                  id="hero-swap-locations-btn"
                  type="button"
                  onClick={handleSwapLocations}
                  aria-label={`Swap origin and destination (${selectedOrigin} and ${selectedDestination})`}
                  title={`Swap ${selectedOrigin} ↔ ${selectedDestination}`}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-100 hover:bg-amber-400 text-slate-700 hover:text-slate-950 border border-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4 shrink-0" />
                  <span className="lg:hidden">Swap Route</span>
                </button>
              </div>

              {/* TO */}
              <div className="lg:col-span-3">
                <label
                  htmlFor="hero-destination"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  To
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="hero-destination"
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    className="w-full min-h-[44px] pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    {allCities.map((city) => (
                      <option key={`to-${city}`} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TRAVEL DATE */}
              <div className="lg:col-span-2">
                <label
                  htmlFor="hero-date"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Travel Date
                </label>
                <DatePicker
                  id="hero-date"
                  value={travelDate}
                  onChange={handleTravelDateChange}
                  variant="light"
                  minDate={todayIso}
                />
              </div>

              {/* VEHICLE FILTER */}
              <div className="lg:col-span-1">
                <label
                  htmlFor="hero-vehicle-filter"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Seats
                </label>
                <select
                  id="hero-vehicle-filter"
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="w-full min-h-[44px] px-2.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all cursor-pointer"
                >
                  <option value="ALL">All</option>
                  <option value="11">11-Seat</option>
                  <option value="14">14-Seat</option>
                  <option value="16">16-Seat</option>
                </select>
              </div>

              {/* SINGLE PRIMARY HERO CTA */}
              <div className="md:col-span-2 lg:col-span-2">
                <button
                  id="hero-search-btn"
                  type="submit"
                  className="craft-btn-amber w-full min-h-[44px] py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Search className="w-4 h-4 text-slate-950 stroke-[2.5] shrink-0" />
                  <span>Find Trips</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 2. TODAY'S DEPARTURES SECTION */}
      <section id="todays-departures-section" className="max-w-6xl mx-auto px-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-amber-600 tracking-wide">
              Live Schedule & Availability
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {departuresDate === todayIso
                ? "Today's Departures"
                : `Scheduled Departures (${departuresDate})`}
            </h2>
          </div>

          {availableCorridorsInTrips.length > 0 && (
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-1.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setDeparturesCorridorFilter('ALL')}
                className={`w-full sm:w-auto min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  departuresCorridorFilter === 'ALL'
                    ? 'bg-slate-900 text-amber-400 font-bold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Routes
              </button>
              {availableCorridorsInTrips.map((corridor) => (
                <button
                  key={corridor}
                  type="button"
                  onClick={() => setDeparturesCorridorFilter(corridor)}
                  className={`w-full sm:w-auto min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    departuresCorridorFilter === corridor
                      ? 'bg-slate-900 text-amber-400 font-bold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {corridor}
                </button>
              ))}
            </div>
          )}
        </div>

        {loadingDepartures ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
            aria-label="Loading departures"
          >
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="craft-card p-5 space-y-3 w-full">
                <div className="h-5 w-24 rounded skeleton-shimmer" />
                <div className="h-6 w-3/4 rounded skeleton-shimmer" />
                <div className="h-11 w-full rounded-xl skeleton-shimmer mt-2" />
              </div>
            ))}
          </div>
        ) : filteredDepartures.length === 0 ? (
          <div className="craft-card p-6 sm:p-8 text-center space-y-4 w-full">
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-600">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                No departures available for this date.
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {vehicleFilter !== 'ALL' || departuresCorridorFilter !== 'ALL'
                  ? 'No trips matched your current route or vehicle filter for this date.'
                  : 'Please select another travel date to view available scheduled departures.'}
              </p>
            </div>
            <div className="max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => {
                  setDeparturesDate(todayIso);
                  setTravelDate(todayIso);
                  setVehicleFilter('ALL');
                  setDeparturesCorridorFilter('ALL');
                }}
                className="craft-btn-amber w-full min-h-[44px] text-xs px-4 py-2.5 font-bold cursor-pointer"
              >
                Reset to Today&apos;s Trips
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full items-stretch">
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
              const validSeats = CAR_SEAT_VIEW_SEATS[vehicleCap];
              const bookedSet = new Set(trip.bookedSeatNumbers || []);
              const openSeats = Math.max(
                0,
                validSeats.length - validSeats.filter((s) => bookedSet.has(s)).length
              );

              return (
                <div
                  key={trip.id}
                  className="craft-card-interactive p-4 sm:p-5 w-full flex flex-col justify-between gap-4"
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
                            : `${openSeats} ${openSeats === 1 ? 'seat' : 'seats'} left`}
                        </span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight">
                        {trip.route.origin} → {trip.route.destination}
                      </h3>
                      <p className="text-xs font-medium text-slate-600 mt-0.5">
                        {vehicleCap}-Seater ·{' '}
                        <span className="font-mono text-slate-500">
                          {trip.vehicle.registrationNumber}
                        </span>{' '}
                        ·{' '}
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          KSh {trip.fareKsh.toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={openSeats === 0}
                      onClick={() => handleViewTrip(trip)}
                      className="craft-btn-secondary w-full min-h-[44px] text-xs py-2.5 px-4 font-bold inline-flex items-center justify-center gap-1.5"
                    >
                      <span>{openSeats === 0 ? 'Sold Out' : 'View Trip & Select Seat'}</span>
                      {openSeats > 0 && <ArrowRight className="w-4 h-4 text-amber-600" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. FLEET SECTION (11-SEATER, 14-SEATER, 16-SEATER) */}
      <section id="fleet-section" className="max-w-6xl mx-auto px-4 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-amber-600 tracking-wide">
              Kenyan PSV Fleet Configurations
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              11-Seater, 14-Seater & 16-Seater Shuttles
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 w-full md:w-auto">
            {(['ALL', '11-Seater', '14-Seater', '16-Seater'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFleetCategoryTab(cat)}
                className={`w-full sm:w-auto min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  fleetCategoryTab === cat
                    ? 'bg-slate-900 text-amber-400 font-bold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'ALL' ? 'All Vehicles' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {filteredFleetShowcase.map((veh) => (
            <div
              key={veh.id}
              className="craft-card-interactive overflow-hidden w-full flex flex-col justify-between group"
            >
              <div>
                <div className="w-full overflow-hidden relative bg-slate-950">
                  <img
                    src={veh.image}
                    alt={veh.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        '/images/transcar_white_highway.webp';
                    }}
                    className="w-full h-auto max-w-full aspect-[16/10] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 text-[11px] font-mono font-bold bg-slate-950/90 text-amber-400 px-2.5 py-0.5 rounded-md border border-slate-700">
                    {veh.reg}
                  </span>
                  <span className="absolute bottom-2.5 right-3 text-[11px] font-bold text-white bg-slate-950/85 px-2.5 py-0.5 rounded">
                    {veh.category}
                  </span>
                </div>

                <div className="p-4 space-y-1.5">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    {veh.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {veh.seatLayoutSummary}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  type="button"
                  onClick={() => setInspectedVehicle(veh)}
                  className="craft-btn-secondary w-full min-h-[44px] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>View {veh.category} Seat Layout</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SINGLE STICKY BOTTOM CTA ON MOBILE ONLY */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5">
        <button
          id="mobile-sticky-book-cta"
          type="button"
          onClick={triggerTripSearch}
          className="craft-btn-amber w-full min-h-[44px] text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Search className="w-4 h-4 text-slate-950 stroke-[2.5] shrink-0" />
          <span>Book Trip ({selectedOrigin} → {selectedDestination})</span>
        </button>
      </div>

      {/* Vehicle Inspection & PSV Seat Configuration Modal */}
      {inspectedVehicle && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setInspectedVehicle(null)}
        >
          <div
            className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-[calc(100vw-32px)] md:max-w-3xl overflow-hidden shadow-2xl relative text-white max-h-[90vh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo Header */}
            <div className="relative w-full bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={inspectedVehicle.image}
                alt={inspectedVehicle.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    '/images/transcar_white_highway.jpg';
                }}
                className="w-full h-auto max-w-full max-h-[34vh] object-contain"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-3 sm:p-4 flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded">
                  {inspectedVehicle.reg}
                </span>
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {inspectedVehicle.category} Toyota HiAce
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                <div className="md:col-span-7 space-y-3">
                  <div>
                    <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                      {inspectedVehicle.edition}
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5 tracking-tight">
                      {inspectedVehicle.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1.5">
                      {inspectedVehicle.description}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
                    <span className="text-slate-400 uppercase text-[10px] font-bold block">
                      Seat Configuration
                    </span>
                    <span className="text-amber-300 font-semibold block">
                      {inspectedVehicle.seatLayoutSummary}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                      Vehicle Features
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      {inspectedVehicle.amenities.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-slate-200 text-[11px] truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5">
                  <PsvCabinLayoutDiagram capacity={inspectedVehicle.seats} />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setInspectedVehicle(null)}
                  className="craft-btn-secondary w-full min-h-[44px] text-xs bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const v = inspectedVehicle;
                    setInspectedVehicle(null);
                    handleBookVehicle(v);
                  }}
                  className="craft-btn-amber w-full min-h-[44px] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Find {inspectedVehicle.category} Trips</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRIP DETAILS DRAWER */}
      <TripDetailsDrawer
        trip={drawerTrip}
        selectedVehicleCapacity={
          vehicleFilter === '11'
            ? 11
            : vehicleFilter === '14'
            ? 14
            : vehicleFilter === '16'
            ? 16
            : null
        }
        onClose={() => setDrawerTrip(null)}
        onSelectSeats={handleSelectSeatsFromDrawer}
      />
    </div>
  );
};
