import React from 'react';
import {
  Bus,
  Shield,
  Clock,
  Award,
  Users,
  MapPin,
  Phone,
  Mail,
  Package,
  CheckCircle2,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Route } from '../../types';

interface CompanyPagesProps {
  page: 'about' | 'services' | 'routes' | 'safety' | 'policies' | 'terms' | 'privacy' | 'contact' | 'faqs';
  routes: Route[];
  onBookRoute?: (route: Route) => void;
}

export const CompanyPages: React.FC<CompanyPagesProps> = ({ page, routes, onBookRoute }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* 1. ABOUT US PAGE */}
      {page === 'about' && (
        <div className="space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-black bg-amber-400 px-3 py-1 rounded-xl border border-black">
              About Us
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-black font-serif">
              TransCar Rongai Ltd.
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-medium">
              We provide scheduled intercity passenger travel, focusing on safety, comfort, and punctuality across our route network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-3xl border-2 border-neutral-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-amber-400 border border-amber-400 flex items-center justify-center font-black">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-black">Our Mission</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                To deliver the most dependable, safe, and comfortable long-distance passenger travel and parcel logistics
                in Kenya, empowering communities and commerce with zero tolerance for safety compromises.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border-2 border-neutral-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-black border border-black flex items-center justify-center font-black">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-black">Our Vision</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                To be the benchmark for passenger mobility in sub-Saharan Africa, setting new standards for speed governance,
                driver welfare, and customer digital ease.
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border-2 border-neutral-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white border border-neutral-800 flex items-center justify-center font-black">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-black text-black">Core Values</h3>
              <ul className="text-xs text-neutral-600 space-y-1.5 list-disc list-inside font-medium">
                <li><strong>Safety First:</strong> Mandatory dual drivers on routes exceeding 400 KM.</li>
                <li><strong>Punctuality:</strong> Strict on-time departures governed by digital dispatch.</li>
                <li><strong>Transparency:</strong> No hidden luggage fees or terminal touting.</li>
              </ul>
            </div>
          </div>

          {/* Official Fleet Showcase */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-amber-500">
                TransCar Galaxy Fleet
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-black">
                Our Certified Executive Shuttles
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 font-medium">
                Standardized Toyota HiAce fleet: 3 × 14-seater vans, 1 × 16-seater, and 2 × 11-seater vans calibrated to 80 km/h.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl overflow-hidden border-2 border-neutral-200 shadow-sm hover:border-amber-400 transition-all group">
                <div className="aspect-[4/3] w-full overflow-hidden bg-black relative">
                  <img
                    src="/images/transcar_highway_kde4160.webp"
                    alt="TransCar Express Shuttle KDE 416Q"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] font-mono font-black bg-black/90 text-amber-400 px-2 py-0.5 rounded border border-amber-400/40">
                    KDE 416Q
                  </span>
                </div>
                <div className="p-4 space-y-1 text-left">
                  <span className="text-[10px] font-extrabold text-amber-600 uppercase block">11-Seater HiAce</span>
                  <h4 className="font-black text-sm text-black">Executive HiAce Class</h4>
                  <p className="text-[11px] text-neutral-600 font-medium line-clamp-2">
                    11 spacious passenger seats with extra legroom, air conditioning, and dual USB-C ports.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden border-2 border-neutral-200 shadow-sm hover:border-amber-400 transition-all group">
                <div className="aspect-[4/3] w-full overflow-hidden bg-black relative">
                  <img
                    src="/images/transcar_stalker_kdv149e.webp"
                    alt="TransCar Stalker Cruiser KDV 149E"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] font-mono font-black bg-black/90 text-amber-400 px-2 py-0.5 rounded border border-amber-400/40">
                    KDV 149E
                  </span>
                </div>
                <div className="p-4 space-y-1 text-left">
                  <span className="text-[10px] font-extrabold text-neutral-800 uppercase block">14-Seater HiAce</span>
                  <h4 className="font-black text-sm text-black">Stalker Family Edition</h4>
                  <p className="text-[11px] text-neutral-600 font-medium line-clamp-2">
                    14 passenger seats, aerodynamic highway stability, high-speed Wi-Fi, and live satellite telematics.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden border-2 border-neutral-200 shadow-sm hover:border-amber-400 transition-all group">
                <div className="aspect-[4/3] w-full overflow-hidden bg-black relative">
                  <img
                    src="/images/transcar_highway_rear.webp"
                    alt="TransCar Maxi Shuttle KDC 789C"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] font-mono font-black bg-black/90 text-amber-400 px-2 py-0.5 rounded border border-amber-400/40">
                    KDC 789C
                  </span>
                </div>
                <div className="p-4 space-y-1 text-left">
                  <span className="text-[10px] font-extrabold text-amber-600 uppercase block">16-Seater HiAce</span>
                  <h4 className="font-black text-sm text-black">Maxi Shuttle Class</h4>
                  <p className="text-[11px] text-neutral-600 font-medium line-clamp-2">
                    16 passenger capacity with dedicated luggage compartment and individual AC louvers.
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Corporate Offices & Operating Hours */}
          <div className="bg-black text-white p-8 rounded-3xl space-y-6 border-2 border-amber-400/40">
            <div>
              <h2 className="text-2xl font-black font-serif text-white">Regional Station Terminals & Operating Hours</h2>
              <p className="text-xs text-neutral-300 mt-1 font-medium">
                Full-service ticket counters, passenger lounges, and parcel freight drop-offs in all major urban hubs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-neutral-900 border-2 border-amber-400 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-400 text-sm block">Ongata Rongai Head Office & Stage</span>
                  <span className="text-[10px] bg-amber-400 text-black font-black px-1.5 py-0.5 rounded">HQ</span>
                </div>
                <p className="text-neutral-300">Magadi Road, Ongata Rongai Commercial Stage</p>
                <p className="text-amber-300 font-bold">Hours: 24/7 Operations • Hotline: +254 724 626199 / +254 717 747626</p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-700 space-y-2">
                <span className="font-black text-amber-400 text-sm block">Nairobi Central Terminal</span>
                <p className="text-neutral-300">Haile Selassie Avenue, Opposite Railway Station</p>
                <p className="text-neutral-400">Hours: 05:00 - 23:00 Daily • Tel: +254 700 800 901</p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-700 space-y-2">
                <span className="font-black text-amber-400 text-sm block">Kisii Town Terminal</span>
                <p className="text-neutral-300">Kisii Bus Park, Off Hospital Road</p>
                <p className="text-neutral-400">Hours: 05:00 - 22:00 Daily • Tel: +254 724 626199 / +254 717 747626</p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-700 space-y-2">
                <span className="font-black text-amber-400 text-sm block">Mombasa Coastal Station</span>
                <p className="text-neutral-300">Mwembe Tayari Commercial Center, Jomo Kenyatta Ave</p>
                <p className="text-neutral-400">Hours: 05:30 - 22:30 Daily • Tel: +254 700 800 902</p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-700 space-y-2">
                <span className="font-black text-amber-400 text-sm block">Kisumu Western Hub</span>
                <p className="text-neutral-300">Mega Plaza Junction, Oginga Odinga Road</p>
                <p className="text-neutral-400">Hours: 06:00 - 21:00 Daily • Tel: +254 700 800 903</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. SERVICES PAGE */}
      {page === 'services' && (
        <div className="space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-black bg-amber-400 px-3 py-1 rounded-xl border border-black">
              Commercial Operations
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-black font-serif">
              Our Transportation & Logistics Services
            </h1>
            <p className="text-sm text-neutral-600 font-medium">
              Engineered to meet the exact travel, cargo, and charter requirements of individuals and corporations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-7 rounded-3xl border-2 border-neutral-200 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-black text-amber-400 flex items-center justify-center font-black border border-amber-400">
                <Bus className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-black">Scheduled Intercity Passenger Travel</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Daily scheduled express coaches connecting Nairobi with coastal and western destinations.
                Features high-speed onboard Wi-Fi, air conditioning, 240V USB phone charging ports, and spacious 2+2 or 2+1 reclining leather seating.
              </p>
              <ul className="text-xs text-neutral-800 space-y-1.5 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500" /> Morning & Night Express Departures</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500" /> Comfortable front rows with extra legroom</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500" /> 25 KG Free Baggage Allowance</li>
              </ul>
            </div>

            <div className="bg-white p-7 rounded-3xl border-2 border-neutral-200 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black border border-black">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-black">SafariCargo Express Parcel Logistics</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Same-day and overnight secure parcel delivery between all terminal stations.
                Every consignment is barcoded, insured, and tracked digitally from drop-off to collection.
              </p>
              <ul className="text-xs text-neutral-800 space-y-1.5 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500" /> Document & Small Parcel Fast-Track</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500" /> Commercial Bulk Consignment Underbelly Space</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500" /> SMS Collection PIN for Verified Handover</li>
              </ul>
            </div>

            <div className="bg-white p-7 rounded-3xl border-2 border-neutral-200 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-black text-amber-400 flex items-center justify-center font-black border border-neutral-800">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-black">Corporate & Institutional Charter</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Private hire of 45-passenger to 49-passenger luxury touring coaches for corporate retreats,
                university faculty excursions, conferences, and sporting delegations with custom itinerary routing.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border-2 border-neutral-200 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black border border-black">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-black">Safety & Telematics Fleet Management</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                24/7 central command center telematics continuously monitoring vehicle speeds, driver rest hours,
                fuel efficiency, and geofenced corridors.
              </p>
            </div>
          </div>

          {/* Executive Shuttle Charter & Commuter Fleet Gallery */}
          <div className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400/40 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Charter & Shuttle Fleet
                </span>
                <h3 className="text-xl font-black font-serif text-white mt-0.5">
                  Corporate Hire & Express Transfers
                </h3>
              </div>
              <a
                href="tel:+254729807711"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-black font-black text-xs rounded-xl shadow border border-black hover:bg-amber-300 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Charter Desk: +254 724 626199 / +254 717 747626</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 group">
                <div className="aspect-[16/9] w-full overflow-hidden">
                  <img
                    src="/images/transcar_highway_kde4160.webp"
                    alt="TransCar Exact Original Van"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-amber-400">KDE 416Q • Executive Edition</span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-400/30">Charter Shuttle</span>
                  </div>
                  <p className="text-xs text-neutral-300 font-medium">
                    Available for corporate groups, private family airport transfers, and express charters across Kenya.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 group">
                <div className="aspect-[16/9] w-full overflow-hidden">
                  <img
                    src="/images/transcar_white_highway.webp"
                    alt="TransCar Highway Cruiser"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-amber-400">KDV 149E • Stalker Cruiser</span>
                    <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded border border-white/30">Highway Express</span>
                  </div>
                  <p className="text-xs text-neutral-300 font-medium">
                    High-speed commuter touring coach featuring individual climate louvers, spacious luggage capacity, and live telematic speed control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ROUTES & SCHEDULES PAGE */}
      {page === 'routes' && (
        <div className="space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-black bg-amber-400 px-3 py-1 rounded-xl border border-black">
              Timetable & Fares
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-black font-serif">
              Published Route Corridor Timetable
            </h1>
            <p className="text-sm text-neutral-600 font-medium">
              Transparent, fixed fares across all routes. All tickets include passenger accident insurance.
            </p>
          </div>

          <div className="grid gap-6">
            {routes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-3xl border-2 border-neutral-200 shadow-sm p-6 sm:p-8 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-neutral-200 pb-4">
                  <div>
                    <span className="text-xs font-mono font-medium text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-200">
                      {route.code}
                    </span>
                    <h3 className="text-2xl font-black text-black mt-1 font-serif">
                      {route.origin} ↔ {route.destination}
                    </h3>
                    <p className="text-xs text-neutral-600 font-medium mt-0.5">{route.description}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-neutral-500 font-bold block">Standard Fare</span>
                      <span className="text-2xl font-black text-black font-mono">
                        KES {route.baseFareKsh.toLocaleString()}
                      </span>
                    </div>

                    {onBookRoute && (
                      <button
                        onClick={() => onBookRoute(route)}
                        className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 border border-black cursor-pointer"
                      >
                        <span>Book Seats</span>
                        <ArrowRight className="w-4 h-4 stroke-[3]" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium">
                  <div>
                    <span className="text-neutral-500 block font-bold">Distance</span>
                    <span className="font-black text-black">{route.distanceKm} Kilometers</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block font-bold">Duration</span>
                    <span className="font-black text-black">~{route.estimatedDurationHours} Hours</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block font-bold">Daily Departures</span>
                    <span className="font-black text-black">Scheduled Daily</span>
                  </div>
                </div>

                {/* Intermediate Stops */}
                <div className="pt-2">
                  <span className="text-xs font-black text-black uppercase tracking-wider block mb-2">
                    Intermediate Boarding & Drop-off Stops
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {route.stops.map((stop, idx) => (
                      <span
                        key={stop.id}
                        className="text-xs bg-neutral-100 text-black font-semibold px-3 py-1 rounded-lg border border-neutral-300"
                      >
                        {idx + 1}. {stop.name} ({stop.distanceFromOriginKm} km)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. POLICIES PAGE */}
      {page === 'policies' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-black bg-amber-400 px-3 py-1 rounded-xl border border-black">
              Regulatory Standards
            </span>
            <h1 className="text-3xl font-black font-serif text-black">Customer Travel & Booking Policies</h1>
            <p className="text-xs text-neutral-600 font-medium">Official operating guidelines and regulatory standards.</p>
          </div>

          <div className="space-y-6 text-sm text-neutral-700 leading-relaxed bg-white p-8 rounded-3xl border-2 border-neutral-200 shadow-sm">
            <section className="space-y-2">
              <h3 className="font-black text-base text-black flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                1. Reporting Time & Boarding Procedure
              </h3>
              <p className="text-xs text-neutral-600 font-medium">
                Passengers are requested to check in at least <strong>30 minutes before scheduled departure time</strong>.
                Seats may be released to standby travelers 10 minutes prior to departure if a passenger fails to check in.
                Every traveler must present an authentic Government National ID card or valid Passport matching the ticket manifest.
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-base text-black flex items-center gap-2">
                <FileText className="w-4 h-4 text-black" />
                2. Luggage & Baggage Allowance
              </h3>
              <p className="text-xs text-neutral-600 font-medium">
                Each adult passenger is entitled to <strong>25 kilograms of standard luggage free of charge</strong>.
                Extra luggage or bulky commercial items are charged at modest per-kilogram parcel rates.
                Hazardous materials, firearms, flammable liquids, and contraband are strictly prohibited on all coaches.
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-base text-black flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                3. Cancellation, Rescheduling & Refund Policy
              </h3>
              <p className="text-xs text-neutral-600 font-medium">
                Cancellations made at least <strong>6 hours prior to departure</strong> are eligible for a 90% refund
                or complimentary rescheduling to any available future date within 30 days. Cancellations made between
                2 and 6 hours prior to departure incur a 20% cancellation administration fee.
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-base text-black flex items-center gap-2">
                <FileText className="w-4 h-4 text-black" />
                4. Child Travel Policy
              </h3>
              <p className="text-xs text-neutral-600 font-medium">
                Children aged 2 years and under who do not occupy an individual seat travel free of charge in the lap of an adult guardian.
                Children aged 3 years and above must purchase a dedicated seat with full safety belt harness.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* 5. TERMS & CONDITIONS PAGE */}
      {page === 'terms' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-black bg-amber-400 px-3 py-1 rounded-xl border border-black">
              Legal Agreement
            </span>
            <h1 className="text-3xl sm:text-4xl font-black font-serif text-black">
              Terms & Conditions of Carriage
            </h1>
            <p className="text-xs text-neutral-600 font-medium">
              Contractual terms governing passenger transport with TransCar Rongai Limited.
            </p>
          </div>

          <div className="space-y-6 text-xs text-neutral-700 leading-relaxed bg-white p-8 rounded-3xl border-2 border-neutral-200 shadow-sm font-medium">
            <section className="space-y-2">
              <h3 className="font-black text-sm text-black">1. Contract of Carriage</h3>
              <p>
                These Terms and Conditions constitute a legally binding agreement between you (the Passenger) and
                TransCar Rongai Limited (the Carrier), a registered Public Service Vehicle operator licensed under
                the National Transport and Safety Authority (NTSA) Act of Kenya. Purchase of a digital or printed ticket,
                payment via M-Pesa, or boarding a TransCar Rongai vehicle signifies unconditional acceptance of these terms.
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">2. Ticketing, Payments & M-Pesa Validation</h3>
              <p>
                All tickets must be booked and paid in full prior to departure. Automated M-Pesa transactions via
                Paybill 400200 (Account 867845) generate a unique Booking Reference and SMS confirmation. Tickets are issued specifically
                for the named traveler and assigned seat number; tickets are strictly non-transferable without prior
                counter authorization.
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">3. Reporting, Check-In & Boarding Formalities</h3>
              <p>
                Passengers must arrive at the designated terminal station at least thirty (30) minutes prior to scheduled departure.
                Every traveler must present a valid Government-issued National Identification Card or authentic International Passport.
                Failure to arrive fifteen (15) minutes before departure authorizes the Carrier to reassign the seat to waitlisted
                standby passengers without refund liability.
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">4. Baggage Allowances & Prohibited Articles</h3>
              <p>
                Each passenger is permitted up to 25 kilograms of standard personal luggage free of charge in the coach luggage bay.
                Excess baggage is billed at standard published cargo tariff rates. The carriage of firearms, explosive substances,
                flammable liquids, narcotics, live animals, and uninspected commercial contraband is strictly prohibited under Kenyan Law.
                The Carrier disclaims liability for fragile or undeclared high-value items carried inside luggage compartments.
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">5. Cancellation, Postponement & Refund Schedule</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>More than 6 hours prior to departure:</strong> 90% refund via original M-Pesa account or free reschedule within 30 days.</li>
                <li><strong>Between 2 and 6 hours prior to departure:</strong> 80% refund (20% administrative deduction) or date change fee of KES 200.</li>
                <li><strong>Less than 2 hours prior to departure or No-Show:</strong> Ticket is forfeited; no cash refund will be issued.</li>
              </ul>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">6. Passenger Safety, Speed Governance & Conduct</h3>
              <p>
                In compliance with NTSA mandates, all TransCar Rongai vehicles are speed-governed to an absolute ceiling of 80 km/h
                and equipped with 24/7 digital telematics telemetry. Passengers must fasten their seatbelts for the entire duration
                of the voyage. Smoking, alcohol consumption, narcotic use, rowdiness, and harassment of the driver or fellow travelers
                are strictly grounds for immediate offloading and handover to the National Police Service.
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">7. Delays, Force Majeure & Alternate Transport</h3>
              <p>
                While the Carrier strives to maintain published schedules, departure and arrival times are estimates. TransCar Rongai
                is not liable for transit delays caused by traffic gridlock, KeNHA roadworks, extreme weather, or unforeseen police check stops.
                In the event of vehicle mechanical breakdown, the Carrier shall dispatch a replacement coach within two hours or arrange
                alternative passenger carriage to the final ticket destination.
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">8. Applicable Law & Jurisdiction</h3>
              <p>
                These Conditions of Carriage are governed solely by the Laws of the Republic of Kenya. Any disputes arising shall be subject
                to the exclusive jurisdiction of the competent courts of Kenya.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* 6. PRIVACY POLICY PAGE */}
      {page === 'privacy' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-black bg-amber-400 px-3 py-1 rounded-xl border border-black">
              Data Protection
            </span>
            <h1 className="text-3xl sm:text-4xl font-black font-serif text-black">
              Passenger Privacy Policy
            </h1>
            <p className="text-xs text-neutral-600 font-medium">
              Compliant with the Kenya Data Protection Act, 2019 (ODPC Registered).
            </p>
          </div>

          <div className="space-y-6 text-xs text-neutral-700 leading-relaxed bg-white p-8 rounded-3xl border-2 border-neutral-200 shadow-sm font-medium">
            <section className="space-y-2">
              <h3 className="font-black text-sm text-black">1. Commitment to Data Privacy</h3>
              <p>
                TransCar Rongai Limited ("we", "us", "our") respects the constitutional privacy of all travelers and customers.
                We process your personal data in strict compliance with the Kenya Data Protection Act, 2019, and guidance issued
                by the Office of the Data Protection Commissioner (ODPC).
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">2. Personal Information We Collect</h3>
              <p>To confirm travel reservations, verify boarding security, and process payments, we collect:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Identity Data:</strong> Full legal passenger name, National ID or Passport Number.</li>
                <li><strong>Contact Data:</strong> Mobile phone number and email address for ticket delivery and travel notices.</li>
                <li><strong>Financial Data:</strong> M-Pesa transaction reference codes and payment confirmation amounts. (We do not store bank PINs).</li>
                <li><strong>Journey Data:</strong> Departure station, arrival destination, assigned seat number, and baggage tags.</li>
                <li><strong>Telematics & Security:</strong> Coach GPS positioning telemetry and station terminal CCTV footage recorded for passenger safety.</li>
              </ul>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">3. Purpose and Lawful Basis for Processing</h3>
              <p>
                Your data is processed strictly for: (a) Performing the transportation service contract; (b) Complying with NTSA
                statutory passenger manifest reporting requirements; (c) Processing automated M-Pesa payments; and (d) Providing real-time
                bus tracking and emergency dispatch support.
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">4. Sharing and Disclosure of Information</h3>
              <p>
                TransCar Rongai will never sell, rent, or trade your personal data to marketing third parties. We share relevant data only with:
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Safaricom M-Pesa Gateway:</strong> For automated payment processing and refund disbursements.</li>
                <li><strong>Law Enforcement & NTSA:</strong> Only when legally compelled by statutory regulations, court order, or national safety emergencies.</li>
              </ul>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">5. Data Retention & Secure Storage</h3>
              <p>
                Digital passenger booking manifests are retained securely for a statutory period of twelve (12) months in accordance with
                Kenyan Public Service Vehicle regulations, after which personal identifiable information is securely archived or permanently
                erased. All database transmissions use TLS 1.3 encryption.
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">6. Your Data Protection Rights</h3>
              <p>Under the Kenya Data Protection Act 2019, you have the right to:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Request access to the personal data we hold about your travel history.</li>
                <li>Request rectification of inaccurate passenger records.</li>
                <li>Request erasure of your non-statutory personal data.</li>
                <li>Lodge an inquiry or grievance with our designated Data Protection Officer.</li>
              </ul>
            </section>

            <section className="space-y-2 pt-4 border-t-2 border-neutral-200">
              <h3 className="font-black text-sm text-black">7. Data Protection Officer Contact</h3>
              <p>
                For any privacy inquiries or to exercise your statutory data rights, contact our Data Protection & Compliance Office at:
                <br />
                <span className="font-black text-black">Email:</span> privacy@transcarrongai.co.ke
                <br />
                <span className="font-black text-black">Postal Address:</span> P.O. Box 48291-00100, Haile Selassie Avenue, Nairobi, Kenya
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
