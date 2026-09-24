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
    <div className="space-y-12 pb-16">
      {/* Hero Section - Clean & Focused */}
      <section className="relative text-white pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 overflow-hidden">
        {/* Background Image */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <img 
            src="/images/transcar_user_uploaded_hero.jpg" 
            alt="TransCar Fleet Background" 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/transcar_homepage_hero.jpg';
            }}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <p className="text-sm sm:text-base text-neutral-300 max-w-xl mx-auto font-medium">
            Intercity & Regional Express | 6.5 hrs | 11-seater & 14-seater
          </p>

          <div className="text-xs text-amber-400 font-semibold pt-1">
            Hotline: <span className="font-mono font-bold text-white">+254 724 626199 / +254 717 747626</span>
          </div>
        </div>

        {/* Clean Search Form */}
        <div className="max-w-5xl mx-auto mt-8 bg-white rounded-2xl p-5 sm:p-6 shadow-xl border border-neutral-200">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Origin */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                From
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                <select
                  id="hero-origin"
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-black font-semibold text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none"
                >
                  {uniqueOrigins.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Passengers
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-black font-semibold text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'Passenger' : 'Passengers'}</option>)}
                </select>
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                To
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                <select
                  id="hero-destination"
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-black font-semibold text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none"
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
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Travel Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                <input
                  id="hero-date"
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-black font-semibold text-sm focus:ring-2 focus:ring-amber-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Search Submit */}
            <div className="flex items-end">
              <button
                id="hero-search-btn"
                type="submit"
                className="w-full py-2.5 px-6 bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer border border-black"
              >
                <Search className="w-4 h-4 text-black stroke-[2.5]" />
                <span>Search</span>
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-wrap justify-center sm:justify-start gap-3 text-xs font-bold text-neutral-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-amber-800"><CheckCircle2 className="w-3.5 h-3.5" /> M-Pesa accepted</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-green-800"><Shield className="w-3.5 h-3.5" /> Safe drivers</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-blue-800"><Clock className="w-3.5 h-3.5" /> On-time departures</span>
          </div>

          {/* Clean Quick Actions */}
          <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600">
            <div className="flex items-center gap-4">
              <button
                onClick={onTrackBus}
                className="flex items-center gap-1.5 text-neutral-800 hover:text-amber-600 font-semibold transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-amber-500" />
                <span>Track Bus</span>
              </button>
              <span className="text-neutral-300">|</span>
              <button
                onClick={onRetrieveTicket}
                className="flex items-center gap-1.5 text-neutral-800 hover:text-amber-600 font-semibold transition-colors"
              >
                <Ticket className="w-3.5 h-3.5 text-amber-500" />
                <span>Retrieve Ticket</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-500">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>NTSA Certified 80 km/h Shuttles</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Routes */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-black font-serif">
              Popular Routes
            </h2>
            <p className="text-xs text-neutral-600">Daily scheduled departures</p>
          </div>
          <button
            onClick={() => onStartSearch()}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {routes.slice(0, 3).map((route) => (
            <div
              key={route.id}
              className="bg-white rounded-2xl border border-neutral-100 p-5 hover:border-amber-300 hover:shadow-xl transition-all flex flex-col min-h-[292px]"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-black text-black bg-amber-400 px-2.5 py-1 rounded-md">
                    {route.code}
                  </span>
                  <span className="text-xs text-neutral-500">Daily service</span>
                </div>

                <h3 className="text-xl font-extrabold text-black tracking-tight">
                  {route.origin} → {route.destination}
                </h3>
                <div className="flex items-center gap-2 text-neutral-700">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold">Departs 1:00 AM Daily</span>
                </div>
                <p className="text-xs text-neutral-500">{route.estimatedDurationHours} hrs travel time • 11 & 14-seater shuttles</p>
                <p className="text-xs text-neutral-500">Need assistance? <a href="tel:+254724626199" className="font-bold text-amber-700 hover:text-amber-800">Call Dispatch</a></p>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-100">
                <div className="flex items-end justify-between mb-3">
                <div>
                  <span className="text-2xl font-black text-black font-mono">
                    KES {route.baseFareKsh.toLocaleString()}
                  </span>
                  <span className="text-xs text-neutral-400 ml-1">/ seat</span>
                </div>
                <span className="text-xs font-bold text-green-700">7 seats left</span>
                </div>
                <button
                  onClick={() => onSelectRoute(route)}
                  className="w-full px-4 py-3 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-sm font-black transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 border border-amber-500/50 cursor-pointer active:scale-95"
                >
                  <span>Select Seats</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fleet Gallery - Clean, Uncrowded Single Presentation of Real Photos */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-black font-serif">
              Our Shuttle Fleet
            </h2>
            <p className="text-xs text-neutral-600">3 × 14-seater HiAce vans • 1 × 16-seater • 2 × 11-seaters — Click any shuttle to inspect specifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FLEET_SHOWCASE_DATA.map((veh) => (
            <div
              key={veh.id}
              onClick={() => setInspectedVehicle(veh)}
              className="group bg-white rounded-xl border border-neutral-200 overflow-hidden hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] w-full overflow-hidden relative bg-neutral-900">
                  <img
                    src={veh.image}
                    alt={veh.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/transcar_white_highway.jpg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 text-[10px] font-mono font-bold bg-black/80 text-amber-400 px-2 py-0.5 rounded">
                    {veh.reg}
                  </span>
                </div>
                <div className="p-3.5 space-y-1">
                  <h4 className="font-bold text-sm text-black group-hover:text-amber-600 transition-colors">
                    {veh.title}
                  </h4>
                  <p className="text-xs text-neutral-500 font-medium">
                    {veh.corridor}
                  </p>
                </div>
              </div>

              <div className="p-3.5 pt-0 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">{veh.seats} Seats</span>
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                  <span>View Details</span>
                  <Eye className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info Bars - Safety & Parcels */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Safety Box */}
          <div className="bg-neutral-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6 relative overflow-hidden group">
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Safe & Reliable</h3>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed max-w-sm">
                All TransCar shuttles are equipped with certified 80 km/h speed governors, satellite GPS tracking, and two certified drivers on long journeys.
              </p>
            </div>
            <div className="relative z-10 flex items-start">
              <a
                href="tel:+254724626199"
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
              >
                <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                <span>+254 724 626199</span>
              </a>
            </div>
            {/* Background Accent */}
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="w-48 h-48" />
            </div>
          </div>

          {/* Parcel & Cargo Box */}
          <div className="bg-amber-400 text-black rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6 relative overflow-hidden group">
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5" />
                <h3 className="text-lg font-bold">Parcel & Cargo Services</h3>
              </div>
              <p className="text-xs text-black/80 font-medium leading-relaxed max-w-sm">
                Need to send a parcel? We offer fast, secure, and same-day delivery across all our routes. Reach out to our logistics desk and you will be given feedback immediately!
              </p>
            </div>
            <div className="relative z-10 flex items-start">
              <a
                href="tel:+254717747626"
                className="px-5 py-2.5 bg-black hover:bg-neutral-900 text-amber-400 font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Logistics: +254 717 747626</span>
              </a>
            </div>
            {/* Background Accent */}
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Package className="w-48 h-48" />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Vehicle Photo Lightbox Modal */}
      {inspectedVehicle && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setInspectedVehicle(null)}
        >
          <div
            className="bg-neutral-950 border-2 border-amber-400 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setInspectedVehicle(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/80 hover:bg-amber-400 hover:text-black rounded-full flex items-center justify-center text-white transition-colors border border-white/20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Photo Container - Exact uncropped vehicle aspect ratio preserving full car body */}
            <div className="relative w-full bg-neutral-900 flex items-center justify-center min-h-[300px] max-h-[75vh] overflow-hidden">
              <img
                src={inspectedVehicle.image}
                alt={inspectedVehicle.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/transcar_white_highway.jpg';
                }}
                className="w-full h-auto max-h-[75vh] object-contain"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent p-4 flex items-center gap-3">
                <span className="text-sm font-mono font-black bg-black text-amber-400 px-3 py-1 rounded-md border border-amber-400">
                  {inspectedVehicle.reg}
                </span>
                <span className="text-xs font-black bg-amber-400 text-black px-3 py-1 rounded-md uppercase">
                  {inspectedVehicle.category}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                  {inspectedVehicle.edition}
                </span>
                <h3 className="text-2xl font-black font-serif text-white mt-1">
                  {inspectedVehicle.title}
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed mt-2 font-medium">
                  {inspectedVehicle.description}
                </p>
              </div>

              {/* Corridor & Route Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <span className="text-neutral-400 font-bold uppercase block text-[10px]">Corridor</span>
                  <span className="text-white font-bold text-sm block">{inspectedVehicle.corridor}</span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <span className="text-neutral-400 font-bold uppercase block text-[10px]">Fleet Dispatch Hotline</span>
                  <span className="text-amber-400 font-bold text-sm block font-mono">+254 724 626199 / +254 717 747626 / +254 700 800 900</span>
                </div>
              </div>

              {/* Amenities Grid */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider block">
                  Included Amenities & Safety Specs
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {inspectedVehicle.amenities.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-neutral-200 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-neutral-400">
                  TransCar Rongai Certified Passenger Vehicle
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setInspectedVehicle(null)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={() => {
                      const v = inspectedVehicle;
                      setInspectedVehicle(null);
                      handleBookVehicle(v);
                    }}
                    className="flex-1 sm:flex-initial px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-black shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer border border-black"
                  >
                    <span>Book Seats On This Shuttle</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

