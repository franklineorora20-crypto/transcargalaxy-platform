import React from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Bus,
  Shield,
  Gauge,
  Wifi,
  Award,
  Clock,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Navigation,
  Ticket,
  Eye,
  X,
  Zap,
  Check,
  Package,
} from 'lucide-react';
import { Route, Trip } from '../../types';

interface HomePageProps {
  routes: Route[];
  onStartSearch: (origin?: string, destination?: string, date?: string, passengers?: number) => void;
  onTrackBus: () => void;
  onRetrieveTicket: () => void;
  onSelectRoute: (route: Route) => void;
}

interface FleetVehicleShowcase {
  id: string;
  reg: string;
  title: string;
  edition: string;
  category: string;
  seats: number;
  image: string;
  description: string;
  corridor: string;
  amenities: string[];
  searchOrigin: string;
  searchDestination: string;
}

const FLEET_SHOWCASE_DATA: FleetVehicleShowcase[] = [
  {
    id: 'fleet-1',
    reg: 'KDE 416Q',
    title: 'TransCar Galaxy Executive HiAce',
    edition: 'Standard 11-Seater Class',
    category: '11-Seater HiAce Van',
    seats: 11,
    image: '/images/transcar_highway_kde4160.jpg',
    description:
      'Spacious 11-seater Toyota HiAce with generous legroom, individual high-back seating, air conditioning, and dedicated luggage space.',
    corridor: 'Rongai • Kiserian • Kisii Express Corridor',
    amenities: ['11 Executive Seats', 'High-Speed Wi-Fi', 'USB Charging Ports', 'Air Conditioning', 'Speed Governor (80 km/h)'],
    searchOrigin: 'Rongai',
    searchDestination: 'Kisii',
  },
  {
    id: 'fleet-2',
    reg: 'KDF 520M',
    title: 'TransCar Galaxy Direct HiAce',
    edition: 'Express 11-Seater Class',
    category: '11-Seater HiAce Van',
    seats: 11,
    image: '/images/transcar_kde4160_real.jpg',
    description:
      'Reliable 11-passenger Toyota HiAce shuttle for fast direct connections with reclining seats and full safety telemetry.',
    corridor: 'Kisii • Narok • Rongai Direct',
    amenities: ['11 Passenger Capacity', 'Reclining Comfort Seats', 'Air Conditioning', 'GPS Tracking', 'Direct Line: +254 724 626199'],
    searchOrigin: 'Kisii',
    searchDestination: 'Rongai',
  },
  {
    id: 'fleet-3',
    reg: 'KDV 149E',
    title: 'TransCar Galaxy Stalker Edition',
    edition: 'Intercity 14-Seater Class',
    category: '14-Seater HiAce Van',
    seats: 14,
    image: '/images/transcar_stalker_kdv149e.jpg',
    description:
      'High-capacity 14-seater Toyota HiAce van featuring custom aerodynamic livery, dual front headlights, and full-cabin USB charging.',
    corridor: 'Rongai • Suswa • Kisii Express Corridor',
    amenities: ['14 Passenger Seats', 'High-Speed Wi-Fi', 'USB Phone Charging', 'Individual AC Louvers', 'Satellite GPS Telematics'],
    searchOrigin: 'Rongai',
    searchDestination: 'Kisii',
  },
  {
    id: 'fleet-4',
    reg: 'KDE 832Y',
    title: 'TransCar Galaxy Day Shuttle',
    edition: 'Corridor 14-Seater Class',
    category: '14-Seater HiAce Van',
    seats: 14,
    image: '/images/transcar_kde832y_day.jpg',
    description:
      'Standard 14-seater Toyota HiAce daytime intercity shuttle servicing the Rongai, Kiserian, Matasia, Ngong, Suswa, and Kisii corridor.',
    corridor: 'Rongai • Kiserian • Matasia • Ngong • Suswa • Kisii',
    amenities: ['14 Passenger Seats', 'Dual PSV Captains', 'Overhead Luggage Bins', '24/7 Dispatch Hotline', 'FM Audio Entertainment'],
    searchOrigin: 'Rongai',
    searchDestination: 'Kisii',
  },
  {
    id: 'fleet-5',
    reg: 'KDA 123A',
    title: 'TransCar Galaxy Night Express',
    edition: 'Overnight 14-Seater Class',
    category: '14-Seater HiAce Van',
    seats: 14,
    image: '/images/transcar_night_travel.jpg',
    description:
      'Night-equipped 14-seater Toyota HiAce shuttle with calibrated reflective chevrons and scheduled overnight departures.',
    corridor: 'Rongai • Narok • Bomet • Kisii',
    amenities: ['14 Passenger Seats', 'Reflective Chevron Safety', 'Certified PSV Driver', 'Live GPS Tracking', 'Air Conditioning'],
    searchOrigin: 'Rongai',
    searchDestination: 'Kisii',
  },
  {
    id: 'fleet-6',
    reg: 'KDC 789C',
    title: 'TransCar Galaxy Maxi Shuttle',
    edition: 'Long-Wheelbase 16-Seater Class',
    category: '16-Seater HiAce Van',
    seats: 16,
    image: '/images/executive_shuttle_van.jpg',
    description:
      'Long-wheelbase 16-seater Toyota HiAce van configured with maximum passenger seating and rear luggage compartment.',
    corridor: 'Rongai • Kilgoris • Rongo • Kehancha',
    amenities: ['16 Passenger Capacity', 'Reclining Bucket Seats', 'Full Cabin AC', 'Luggage Compartment', 'Direct Dispatch'],
    searchOrigin: 'Rongai',
    searchDestination: 'Rongo',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  routes,
  onStartSearch,
  onTrackBus,
  onRetrieveTicket,
  onSelectRoute,
}) => {
  const [selectedOrigin, setSelectedOrigin] = React.useState('Rongai');
  const [selectedDestination, setSelectedDestination] = React.useState('Kisii');
  const [travelDate, setTravelDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [passengers, setPassengers] = React.useState('1');
  const [inspectedVehicle, setInspectedVehicle] = React.useState<FleetVehicleShowcase | null>(null);

  const uniqueOrigins = React.useMemo(() => Array.from(new Set(routes.map((r) => r.origin))), [routes]);
  const uniqueDestinations = React.useMemo(() => Array.from(new Set(routes.map((r) => r.destination))), [routes]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartSearch(selectedOrigin, selectedDestination, travelDate, Number(passengers));
  };

  const handleBookVehicle = (veh: FleetVehicleShowcase) => {
    onStartSearch(veh.searchOrigin, veh.searchDestination);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section with Emil Kowalski Layered Atmosphere */}
      <section className="relative text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 overflow-hidden">
        {/* Background Image with Cinematic Vignette */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <img 
            src="/images/transcar_user_uploaded_hero.jpg" 
            alt="TransCar Fleet" 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/transcar_homepage_hero.jpg';
            }}
            className="w-full h-full object-cover opacity-55 scale-105 transition-transform duration-1000"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/75 to-slate-950"></div>
          {/* Subtle Emil Kowalski radial glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[120px] pointer-events-none"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-slate-200 craft-shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium">Nairobi • Rongai • Kisii Express Corridor</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Intercity Transit, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">Refined.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-normal leading-relaxed">
            Daily express shuttles with instant seat selection and M-Pesa booking.
          </p>
        </div>

        {/* Clean Tactile Quick-Search Card */}
        <div className="max-w-5xl mx-auto mt-6 sm:mt-10 craft-card p-4 sm:p-7 shadow-2xl relative z-10 bg-white/95 backdrop-blur-xl border border-slate-200/90">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Origin */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                From (Origin)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                <select
                  id="hero-origin"
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all cursor-pointer min-h-[44px]"
                >
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
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                To (Destination)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                <select
                  id="hero-destination"
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all cursor-pointer min-h-[44px]"
                >
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
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Travel Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="hero-date"
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all cursor-pointer min-h-[44px]"
                />
              </div>
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Passengers
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none transition-all cursor-pointer min-h-[44px]"
                >
                  {[1, 2, 3, 4, 5, 6].map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? 'Passenger' : 'Passengers'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Button (Tactile Craft Amber) */}
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                id="hero-search-btn"
                type="submit"
                className="craft-btn-amber w-full py-2.5 px-4 text-sm font-bold flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Search Trips</span>
              </button>
            </div>
          </form>

          {/* Quick Value Trust Bar */}
          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 font-medium border border-emerald-200/60 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Instant M-Pesa STK</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-blue-800 font-medium border border-blue-200/60 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>1:00 AM & Hourly Runs</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-900 font-medium border border-amber-200/60 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span>NTSA Speed Governors</span>
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 font-mono text-[11px] text-slate-500 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <button
                onClick={onTrackBus}
                className="hover:text-slate-900 flex items-center gap-1 transition-colors min-h-[36px]"
              >
                <Navigation className="w-3.5 h-3.5 text-amber-500" />
                <span>Track Bus</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={onRetrieveTicket}
                className="hover:text-slate-900 flex items-center gap-1 transition-colors min-h-[36px]"
              >
                <Ticket className="w-3.5 h-3.5 text-amber-500" />
                <span>My Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Scheduled Routes Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-600 uppercase tracking-widest font-mono">
              Live Departures
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Popular Daily Express Routes
            </h2>
          </div>
          <button
            onClick={() => onStartSearch()}
            className="text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 group p-1.5 transition-colors"
          >
            <span>All Routes & Timetables</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {routes.slice(0, 3).map((route) => (
            <div
              key={route.id}
              className="craft-card-interactive p-6 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-900 bg-amber-400 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                    {route.code}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Scheduled
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-950 tracking-tight">
                    {route.origin} → {route.destination}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Departs 1:00 AM Daily • ~{route.estimatedDurationHours} hrs duration</span>
                  </p>
                </div>

                <div className="text-xs text-slate-500 pt-1 space-y-1">
                  <p className="flex items-center gap-1 text-[11px]">
                    <Shield className="w-3 h-3 text-slate-400" />
                    Toyota HiAce 11, 14 & 16-seater classes
                  </p>
                  <p className="text-[11px]">
                    Direct Hotline: <a href="tel:+254724626199" className="font-semibold text-slate-800 hover:text-amber-600">+254 724 626199</a>
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-5 border-t border-slate-100 flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-slate-950 tabular-nums">
                      KES {route.baseFareKsh.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">/ passenger</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Seats Available
                  </span>
                </div>

                <button
                  onClick={() => onSelectRoute(route)}
                  className="craft-btn-amber w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Select Seats & Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fleet Showcase Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-600 uppercase tracking-widest font-mono">
              Vehicle Engineering
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Our Certified Fleet
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select any vehicle to inspect layout, amenities, and corridor assignments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FLEET_SHOWCASE_DATA.map((veh) => (
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
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/transcar_white_highway.jpg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 text-[10px] font-mono font-bold bg-slate-950/90 text-amber-400 px-2 py-0.5 rounded-md border border-slate-700 backdrop-blur-sm">
                    {veh.reg}
                  </span>
                  <span className="absolute bottom-2.5 right-3 text-[10px] font-semibold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-sm">
                    {veh.seats} Passenger Seats
                  </span>
                </div>

                <div className="p-4 space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                    {veh.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">
                    {veh.corridor}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 text-xs mt-2">
                <span className="text-[11px] text-slate-500 font-mono">{veh.edition}</span>
                <span className="font-bold text-slate-900 group-hover:text-amber-600 flex items-center gap-1 transition-colors">
                  <span>Inspect Vehicle</span>
                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety & Parcel Services Banner Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Safety Box */}
          <div className="bg-slate-950 text-white rounded-2xl p-7 flex flex-col justify-between gap-6 relative overflow-hidden craft-shadow-lg border border-slate-800">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Standardized Passenger Safety</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                All TransCar shuttles are calibrated with speed governors (80 km/h), real-time satellite GPS tracking, and two certified PSV captains on long-distance night operations.
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <a
                href="tel:+254724626199"
                className="craft-btn-secondary text-xs bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white"
              >
                <PhoneCall className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span>+254 724 626199</span>
              </a>
            </div>
          </div>

          {/* Cargo Box */}
          <div className="bg-amber-400 text-slate-950 rounded-2xl p-7 flex flex-col justify-between gap-6 relative overflow-hidden craft-shadow-lg border border-amber-500/40">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-black/10 border border-black/10 text-slate-950">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 tracking-tight">Express Parcel & Courier Desk</h3>
              </div>
              <p className="text-xs text-slate-900 font-medium leading-relaxed">
                Secure same-day parcel delivery along the Nairobi • Rongai • Kisii corridor with SMS dispatch notifications and terminal pickup.
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <a
                href="tel:+254717747626"
                className="craft-btn-primary text-xs bg-slate-950 text-white"
              >
                <PhoneCall className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span>Call Cargo Desk: +254 717 747626</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Inspection Lightbox Modal */}
      {inspectedVehicle && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setInspectedVehicle(null)}
        >
          <div
            className="bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative text-white max-h-[90vh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setInspectedVehicle(null)}
              className="absolute top-3.5 right-3.5 z-20 w-8 h-8 sm:w-9 sm:h-9 bg-slate-900/80 hover:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Photo Container */}
            <div className="relative w-full bg-slate-900 flex items-center justify-center min-h-[200px] sm:min-h-[260px] max-h-[40vh] sm:max-h-[50vh] overflow-hidden flex-shrink-0">
              <img
                src={inspectedVehicle.image}
                alt={inspectedVehicle.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/transcar_white_highway.jpg';
                }}
                className="w-full h-auto max-h-[40vh] sm:max-h-[50vh] object-contain"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-3 sm:p-4 flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded">
                  {inspectedVehicle.reg}
                </span>
                <span className="text-xs font-medium text-slate-300 truncate">
                  {inspectedVehicle.category}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-7 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
              <div>
                <span className="text-[10px] sm:text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  {inspectedVehicle.edition}
                </span>
                <h3 className="text-lg sm:text-2xl font-extrabold text-white mt-0.5 tracking-tight">
                  {inspectedVehicle.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1.5 sm:mt-2 font-normal">
                  {inspectedVehicle.description}
                </p>
              </div>

              {/* Corridor & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Assigned Corridor</span>
                  <span className="text-white font-semibold block">{inspectedVehicle.corridor}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Dispatch Assistance</span>
                  <span className="text-amber-400 font-semibold block font-mono">+254 724 626199</span>
                </div>
              </div>

              {/* Amenities Grid */}
              <div className="space-y-2">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
                  Included Amenities & Telemetry
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 text-xs">
                  {inspectedVehicle.amenities.map((item, idx) => (
                    <div key={idx} className="p-2 sm:p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-1.5 sm:gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-slate-200 text-[10px] sm:text-[11px] truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 sm:pt-4 border-t border-slate-800 flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2.5 sm:gap-3">
                <button
                  onClick={() => setInspectedVehicle(null)}
                  className="craft-btn-secondary text-xs bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 min-h-[40px] flex items-center justify-center"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const v = inspectedVehicle;
                    setInspectedVehicle(null);
                    handleBookVehicle(v);
                  }}
                  className="craft-btn-amber text-xs font-bold flex items-center justify-center gap-1.5 min-h-[40px]"
                >
                  <span>Search Departures For This Vehicle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
