import React from 'react';
import {
  Search,
  MapPin,
  Bus,
  Shield,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  PhoneCall,
  Navigation,
  Ticket,
  Eye,
  X,
  Check,
  Package,
  HelpCircle,
  Calendar,
  Download,
  Smartphone,
  Monitor,
  QrCode,
} from 'lucide-react';
import { Route, Trip } from '../../types';
import { DatePicker } from '../common/DatePicker';
import { ApiService } from '../../services/api';
import { CAR_SEAT_VIEW_SEATS } from './SeatSelector';
import { TripDetailsDrawer } from './TripDetailsDrawer';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface HomePageProps {
  routes: Route[];
  onStartSearch: (origin?: string, destination?: string, date?: string, vehicleCapacity?: 11 | 14 | 16 | null) => void;
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
    corridor: 'Rongai • Kiserian • Kisii Express Corridor',
    seatLayoutSummary: '2 Front Seats beside Driver (P1, P2) + 3 Rear Rows of 3 Seats (1A–3C)',
    amenities: ['11 Passenger Seats', 'High-Speed Wi-Fi', 'USB Charging Ports', 'Air Conditioning', 'Speed Governor (80 km/h)'],
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
    corridor: 'Kisii • Narok • Rongai Direct',
    seatLayoutSummary: '2 Front Seats beside Driver (P1, P2) + 3 Rear Rows of 3 Seats (1A–3C)',
    amenities: ['11 Passenger Seats', 'Reclining Comfort Seats', 'Air Conditioning', 'GPS Tracking', 'Direct Line: +254 724 626199'],
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
    corridor: 'Rongai • Suswa • Kisii Express Corridor',
    seatLayoutSummary: '2 Front Seats beside Driver (P1, P2) + Rows 1–3 (8 Seats) + 4-Seat Rear Bench (4A–4D)',
    amenities: ['14 Passenger Seats', 'High-Speed Wi-Fi', 'USB Phone Charging', 'Individual AC Louvers', 'Satellite GPS Telematics'],
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
    corridor: 'Rongai • Kiserian • Ngong • Suswa • Kisii',
    seatLayoutSummary: '2 Front Seats beside Driver (P1, P2) + Rows 1–3 (8 Seats) + 4-Seat Rear Bench (4A–4D)',
    amenities: ['14 Passenger Seats', 'Certified PSV Captains', 'Overhead Luggage Bins', '24/7 Dispatch Hotline', 'Air Conditioning'],
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
    corridor: 'Rongai • Narok • Bomet • Kisii',
    seatLayoutSummary: '2 Front Seats beside Driver (P1, P2) + Rows 1–3 (8 Seats) + 4-Seat Rear Bench (4A–4D)',
    amenities: ['14 Passenger Seats', 'Reflective Chevron Safety', 'Certified PSV Driver', 'Live GPS Tracking', 'Air Conditioning'],
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
    corridor: 'Rongai • Kilgoris • Rongo • Kehancha',
    seatLayoutSummary: '2 Front Seats beside Driver (P1, P2) + Rows 1–4 (10 Seats) + 4-Seat Rear Bench (5A–5D)',
    amenities: ['16 Passenger Seats', 'Reclining Bucket Seats', 'Full Cabin AC', 'Luggage Compartment', 'Direct Dispatch'],
    searchOrigin: 'Rongai',
    searchDestination: 'Rongo',
  },
];

/**
 * Compact Kenyan PSV Cabin Diagram showing 2 passenger seats beside the driver (P1, P2)
 * and the exact rear seating arrangement for 11-Seater, 14-Seater, and 16-Seater vehicles.
 */
export const PsvCabinLayoutDiagram: React.FC<{ capacity: 11 | 14 | 16 }> = ({ capacity }) => {
  const SeatBox: React.FC<{ label: string; highlight?: boolean }> = ({ label, highlight = false }) => (
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
        {/* Row 1 */}
        <div className="flex items-center justify-between">
          <SeatBox label="1A" />
          <span className="text-[8px] text-slate-600 font-mono">Aisle</span>
          <div className="flex items-center gap-1">
            <SeatBox label="1B" />
            <SeatBox label="1C" />
          </div>
        </div>

        {/* Row 2 */}
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
  onTrackBus,
  onRetrieveTicket,
  onOpenTutorial,
  onOpenSchedules,
  onOpenFleet,
}) => {
  const todayIso = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const { isInstalled, isInstallable, triggerInstallOrGuide, openInstallModal } = usePWAInstall();

  const [selectedOrigin, setSelectedOrigin] = React.useState('Rongai');
  const [selectedDestination, setSelectedDestination] = React.useState('Kisii');
  const [travelDate, setTravelDate] = React.useState(todayIso);
  const [vehicleFilter, setVehicleFilter] = React.useState<string>('ALL');
  const [fleetCategoryTab, setFleetCategoryTab] = React.useState<'ALL' | '11-Seater' | '14-Seater' | '16-Seater'>('ALL');
  const [inspectedVehicle, setInspectedVehicle] = React.useState<FleetVehicleShowcase | null>(null);
  const [drawerTrip, setDrawerTrip] = React.useState<Trip | null>(null);

  // Today's Departures state (real backend trip data)
  const [departuresDate, setDeparturesDate] = React.useState<string>(todayIso);
  const [departuresCorridorFilter, setDeparturesCorridorFilter] = React.useState<string>('ALL');
  const [liveTrips, setLiveTrips] = React.useState<Trip[]>([]);
  const [loadingDepartures, setLoadingDepartures] = React.useState<boolean>(true);

  // Build unified city list from routes so swapping Origin and Destination is always valid
  const allCities = React.useMemo(() => {
    const set = new Set<string>(['Rongai', 'Kisii']);
    routes.forEach((r) => {
      if (r.origin) set.add(r.origin);
      if (r.destination) set.add(r.destination);
    });
    return Array.from(set);
  }, [routes]);

  // Fetch real trips for Today's Departures section whenever departuresDate changes
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

  // Synchronize Today's Departures date when the user changes Travel Date in the search card
  const handleTravelDateChange = (newDate: string) => {
    setTravelDate(newDate);
    setDeparturesDate(newDate);
  };

  // Swap Origin & Destination state
  const handleSwapLocations = () => {
    const prevOrigin = selectedOrigin;
    const prevDest = selectedDestination;
    setSelectedOrigin(prevDest);
    setSelectedDestination(prevOrigin);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenVehicle: 11 | 14 | 16 | null =
      vehicleFilter === '11' ? 11 : vehicleFilter === '14' ? 14 : vehicleFilter === '16' ? 16 : null;
    onStartSearch(selectedOrigin, selectedDestination, travelDate, chosenVehicle);
  };

  const handleBookVehicle = (veh: FleetVehicleShowcase) => {
    onStartSearch(veh.searchOrigin, veh.searchDestination, travelDate, veh.seats);
  };

  // Filter live trips for Today's Departures by corridor and selected vehicle capacity
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
    <div className="space-y-14 sm:space-y-16 pb-20">
      {/* 4 & 5. HERO SECTION WITH LIGHTENED VEHICLE VISIBILITY & CONTROLLED GRADIENT */}
      <section className="relative text-white pt-12 sm:pt-16 pb-14 sm:pb-18 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 overflow-hidden isolate gpu-accelerated [backface-visibility:hidden] [transform:translateZ(0)]">
        {/* Background Image: Clearly Visible TransCar Shuttle with Controlled Directional Scrim */}
        <div className="pointer-events-none absolute inset-0 z-0 gpu-accelerated [backface-visibility:hidden] bg-slate-950">
          <img
            src="/images/transcar_user_uploaded_hero.webp"
            alt="TransCar rongai Toyota HiAce Express Shuttle"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/transcar_user_uploaded_hero.jpg';
            }}
            className="w-full h-full object-cover object-center opacity-90 sm:scale-[1.02] transition-transform duration-700"
          />
          {/* Stronger contrast scrim behind upper text, gradually lighter toward the shuttle vehicle */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/45 to-slate-950/85"></div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-slate-950/30"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-3.5 relative z-10">
          {/* Corridor Kicker */}
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-amber-300 font-semibold tracking-wide drop-shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true"></span>
            <span>Premier Intercity & Rongai Regional Express Transportation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md [text-wrap:balance]">
            Intercity Transit,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">
              Refined.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-100 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow">
            Daily express shuttle services between Rongai, Nairobi and Kisii with live trip search, seat selection and flexible payment options.
          </p>
        </div>

        {/* 6–11. BOOKING SEARCH CARD */}
        <div className="max-w-5xl mx-auto mt-7 sm:mt-9 craft-card p-4 sm:p-6 shadow-2xl relative z-10 bg-white border border-slate-200/90">
          <form
            onSubmit={handleSearchSubmit}
            aria-label="Find available shuttle trips"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-3.5 items-end"
          >
            {/* FROM + SWAP + TO Group (5 cols on desktop, full width on tablet) */}
            <div className="sm:col-span-2 lg:col-span-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-2.5 items-end">
              {/* FROM */}
              <div>
                <label
                  htmlFor="hero-origin"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  From
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="hero-origin"
                    value={selectedOrigin}
                    onChange={(e) => setSelectedOrigin(e.target.value)}
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

              {/* ORIGIN / DESTINATION SWAP BUTTON (⇄) */}
              <div className="flex justify-center sm:pb-0.5">
                <button
                  id="hero-swap-locations-btn"
                  type="button"
                  onClick={handleSwapLocations}
                  aria-label={`Swap origin and destination (${selectedOrigin} and ${selectedDestination})`}
                  title={`Swap ${selectedOrigin} ↔ ${selectedDestination}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-2.5 h-10 sm:h-[44px] sm:w-[44px] rounded-xl bg-slate-100 hover:bg-amber-400 text-slate-700 hover:text-slate-950 border border-slate-200 hover:border-slate-900 font-bold text-xs transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <ArrowLeftRight className="w-4 h-4 shrink-0" />
                  <span className="sm:hidden text-[11px] font-semibold">Swap Route</span>
                </button>
              </div>

              {/* TO */}
              <div>
                <label
                  htmlFor="hero-destination"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  To
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="hero-destination"
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
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

            {/* TRAVEL DATE (3 cols on desktop) */}
            <div className="sm:col-span-1 lg:col-span-3">
              <label
                htmlFor="hero-date"
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
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

            {/* VEHICLE FILTER (2 cols on desktop) */}
            <div className="sm:col-span-1 lg:col-span-2">
              <label
                htmlFor="hero-vehicle-filter"
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Vehicle
              </label>
              <div className="relative">
                <Bus className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="hero-vehicle-filter"
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all cursor-pointer min-h-[44px]"
                >
                  <option value="ALL">All Vehicles</option>
                  <option value="11">11-Seater</option>
                  <option value="14">14-Seater</option>
                  <option value="16">16-Seater</option>
                </select>
              </div>
            </div>

            {/* PRIMARY SEARCH CTA: FIND TRIPS (2 cols on desktop) */}
            <div className="sm:col-span-2 lg:col-span-2">
              <button
                id="hero-search-btn"
                type="submit"
                className="craft-btn-amber w-full py-2.5 px-4 text-sm font-bold flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap cursor-pointer"
              >
                <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Find Trips</span>
              </button>
            </div>
          </form>

          {/* 18. SERVICE INDICATORS + PASSENGER TOOLS */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
            {/* Visually Secondary Service Indicators */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] sm:text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
                <span>Daily Departures</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
                <span>Live Availability</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
                <span>M-Pesa</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
                <span>Pay on Boarding</span>
              </span>
            </div>

            {/* Secondary Quick Utility Links */}
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              {onOpenTutorial && (
                <>
                  <button
                    type="button"
                    onClick={onOpenTutorial}
                    className="hover:text-slate-950 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>How It Works</span>
                  </button>
                  <span className="text-slate-300" aria-hidden="true">|</span>
                </>
              )}
              <button
                type="button"
                onClick={onTrackBus}
                className="hover:text-slate-950 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-amber-500" />
                <span>Track Shuttle</span>
              </button>
              <span className="text-slate-300" aria-hidden="true">|</span>
              <button
                type="button"
                onClick={onRetrieveTicket}
                className="hover:text-slate-950 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5 text-amber-500" />
                <span>Retrieve Ticket</span>
              </button>
              {!isInstalled && (
                <>
                  <span className="text-slate-300" aria-hidden="true">|</span>
                  <button
                    type="button"
                    onClick={() => triggerInstallOrGuide()}
                    className="text-slate-900 hover:text-amber-600 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                    <span>Install App</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 14. TODAY'S DEPARTURES SECTION (REAL-TIME BACKEND-DRIVEN) */}
      <section id="todays-departures-section" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-amber-600 tracking-wide">
              Live Schedule & Availability
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {departuresDate === todayIso ? "Today's Departures" : `Scheduled Departures (${departuresDate})`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Select an available trip below to view the vehicle seat map and choose your seat.
            </p>
          </div>

          {/* Route Filter Tabs + Full Schedule Link */}
          <div className="flex flex-wrap items-center gap-2">
            {availableCorridorsInTrips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDeparturesCorridorFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    departuresCorridorFilter === 'ALL'
                      ? 'bg-white text-slate-950 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  All Routes
                </button>
                {availableCorridorsInTrips.map((corridor) => (
                  <button
                    key={corridor}
                    type="button"
                    onClick={() => setDeparturesCorridorFilter(corridor)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading departures">
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
          /* Empty State as Specified in Section 19 */
          <div className="craft-card p-8 sm:p-10 text-center space-y-4">
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
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDeparturesDate(todayIso);
                  setTravelDate(todayIso);
                  setVehicleFilter('ALL');
                  setDeparturesCorridorFilter('ALL');
                  const dateBtn = document.getElementById('hero-date');
                  if (dateBtn) {
                    dateBtn.focus();
                    dateBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="craft-btn-amber text-xs px-4 py-2.5 font-bold cursor-pointer"
              >
                Choose Another Date
              </button>
            </div>
          </div>
        ) : (
          /* Horizontal Cards on Desktop, Stacked Vertically on Mobile (Section 19) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
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
                  className="craft-card-interactive p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
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
                            : `${openSeats} ${openSeats === 1 ? 'seat' : 'seats'} available`}
                        </span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight">
                        {trip.route.origin} → {trip.route.destination}
                      </h3>
                      <p className="text-xs font-medium text-slate-600 mt-0.5">
                        {vehicleCap}-Seater • <span className="font-mono text-slate-500">{trip.vehicle.registrationNumber}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-base sm:text-lg font-extrabold text-slate-950 font-mono tabular-nums">
                        KSh {trip.fareKsh.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1">/ seat</span>
                    </div>

                    <button
                      type="button"
                      disabled={openSeats === 0}
                      onClick={() => handleViewTrip(trip)}
                      className="craft-btn-secondary text-xs py-2 px-4 font-bold inline-flex items-center gap-1.5 min-h-[40px]"
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

      {/* 16. FLEET SECTION (11-SEATER, 14-SEATER, 16-SEATER WITH KENYAN PSV SEAT CONFIGURATIONS) */}
      <section id="fleet-section" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-amber-600 tracking-wide">
              Supported Fleet Categories
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              11-Seater, 14-Seater & 16-Seater Shuttles
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              All vehicles feature 2 front passenger seats beside the driver (P1, P2) and calibrated 80 km/h speed governors.
            </p>
          </div>

          {/* Interactive Vehicle Category Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            {(['ALL', '11-Seater', '14-Seater', '16-Seater'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFleetCategoryTab(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  fleetCategoryTab === cat
                    ? 'bg-white text-slate-950 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {cat === 'ALL' ? 'All Vehicles' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFleetShowcase.map((veh) => (
            <div
              key={veh.id}
              onClick={() => setInspectedVehicle(veh)}
              className="craft-card-interactive overflow-hidden cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="aspect-[16/10] w-full overflow-hidden relative bg-slate-950">
                  <img
                    src={veh.image}
                    alt={veh.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/transcar_white_highway.webp';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 text-[11px] font-mono font-bold bg-slate-950/90 text-amber-400 px-2.5 py-0.5 rounded-md border border-slate-700">
                    {veh.reg}
                  </span>
                  <span className="absolute bottom-2.5 right-3 text-[11px] font-bold text-white bg-slate-950/85 px-2.5 py-0.5 rounded">
                    {veh.category}
                  </span>
                </div>

                <div className="p-4 space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                    {veh.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {veh.seatLayoutSummary}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-2.5 flex items-center justify-between border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-500 font-mono">{veh.category} PSV</span>
                <span className="font-bold text-slate-900 group-hover:text-amber-600 flex items-center gap-1 transition-colors">
                  <span>View Seat Layout</span>
                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {onOpenFleet && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={onOpenFleet}
              className="craft-btn-secondary text-xs px-5 py-2.5 font-bold inline-flex items-center gap-2"
            >
              <Bus className="w-4 h-4 text-amber-600" />
              <span>Open Full Fleet & Seat Configurations Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Safety & Parcel Services Banner Grid */}
      <section className="max-w-6xl mx-auto px-3 sm:px-6 space-y-5">
        {/* Easy App Installation Banner Card (Hidden once already running as installed standalone app) */}
        {!isInstalled && (
          <div className="bg-slate-950 text-white rounded-2xl p-5 sm:p-7 border border-slate-800 craft-shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                <Download className="w-3.5 h-3.5" />
                <span>Fast & Offline-Ready App</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Install the TransCar rongai App in Seconds
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Add TransCar directly to your phone or computer home screen — no app store download required. Access your booked QR boarding passes offline, track active shuttles, and reserve seats in one tap.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openInstallModal('android')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Android Guide</span>
                </button>
                <button
                  type="button"
                  onClick={() => openInstallModal('ios')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>iPhone / iPad Guide</span>
                </button>
                <button
                  type="button"
                  onClick={() => openInstallModal('desktop')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Monitor className="w-3.5 h-3.5 text-amber-400" />
                  <span>Computer Guide</span>
                </button>
                <button
                  type="button"
                  onClick={() => openInstallModal('qr')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scan QR to Phone</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={() => triggerInstallOrGuide()}
                className="craft-btn-amber text-xs sm:text-sm px-5 py-3 font-extrabold inline-flex items-center justify-center gap-2 min-h-[46px] cursor-pointer whitespace-nowrap shadow-lg"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{isInstallable ? 'Install App Now (1-Click)' : 'Install TransCar App'}</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Safety Box */}
          <div className="bg-slate-950 text-white rounded-2xl p-7 flex flex-col justify-between gap-6 relative overflow-hidden craft-shadow-lg border border-slate-800">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">NTSA Regulated Passenger Safety</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                All TransCar rongai shuttles are calibrated with 80 km/h speed governors, real-time GPS tracking, and licensed PSV captains across all intercity corridors.
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <a
                href="tel:+254724626199"
                className="craft-btn-secondary text-xs bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white"
              >
                <PhoneCall className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span>Support: +254 724 626199</span>
              </a>
            </div>
          </div>

          {/* Cargo Box */}
          <div className="bg-amber-400 text-slate-950 rounded-2xl p-7 flex flex-col justify-between gap-6 relative overflow-hidden craft-shadow-lg border border-amber-500/40">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-black/10 border border-black/10 text-slate-950">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 tracking-tight">Express Parcel & Courier Service</h3>
              </div>
              <p className="text-xs text-slate-900 font-medium leading-relaxed">
                Same-day parcel dispatch along the Nairobi • Rongai • Kisii corridor with SMS collection verification at all stage offices.
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <a
                href="tel:+254717747626"
                className="craft-btn-primary text-xs bg-slate-950 text-white"
              >
                <PhoneCall className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span>Parcel Desk: +254 717 747626</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Inspection & PSV Seat Configuration Modal */}
      {inspectedVehicle && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setInspectedVehicle(null)}
        >
          <div
            className="bg-slate-950 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative text-white max-h-[90vh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setInspectedVehicle(null)}
              aria-label="Close vehicle details"
              className="absolute top-3.5 right-3.5 z-20 w-8 h-8 sm:w-9 sm:h-9 bg-slate-900/80 hover:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Photo Container */}
            <div className="relative w-full bg-slate-900 flex items-center justify-center min-h-[180px] sm:min-h-[240px] max-h-[38vh] overflow-hidden shrink-0">
              <img
                src={inspectedVehicle.image}
                alt={inspectedVehicle.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/transcar_white_highway.jpg';
                }}
                className="w-full h-auto max-h-[38vh] object-contain"
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

            {/* Modal Body with Kenyan PSV Layout Diagram */}
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
                    <span className="text-slate-400 uppercase text-[10px] font-bold block">Seat Configuration</span>
                    <span className="text-amber-300 font-semibold block">{inspectedVehicle.seatLayoutSummary}</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                      Vehicle Features
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {inspectedVehicle.amenities.map((item, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-slate-200 text-[11px] truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Realistic Kenyan PSV Seat Layout Preview */}
                <div className="md:col-span-5">
                  <PsvCabinLayoutDiagram capacity={inspectedVehicle.seats} />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-800 flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setInspectedVehicle(null)}
                  className="craft-btn-secondary text-xs bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 min-h-[40px] flex items-center justify-center cursor-pointer"
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
                  className="craft-btn-amber text-xs font-bold flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer"
                >
                  <span>Find {inspectedVehicle.category} Trips</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 22. TRIP DETAILS DRAWER */}
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
