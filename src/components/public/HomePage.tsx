import React from 'react';
import { Route, Trip } from '../../types';
import { ApiService } from '../../services/api';
import { HeroSection } from './home/HeroSection';
import { RoutesPreview } from './home/RoutesPreview';
import { TripDetailsDrawer } from './TripDetailsDrawer';
import { Search } from 'lucide-react';

export { PsvCabinLayoutDiagram } from './home/PsvCabinLayoutDiagram';

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

export const HomePage: React.FC<HomePageProps> = ({
  routes,
  onStartSearch,
  onSelectTrip,
  onOpenSchedules,
}) => {
  const todayIso = React.useMemo(() => new Date().toISOString().split('T')[0], []);

  const [selectedOrigin, setSelectedOrigin] = React.useState('Rongai');
  const [selectedDestination, setSelectedDestination] = React.useState('Kisii');
  const [travelDate, setTravelDate] = React.useState(todayIso);
  const [vehicleFilter, setVehicleFilter] = React.useState<string>('ALL');

  // Live departures data
  const [departuresDate, setDeparturesDate] = React.useState<string>(todayIso);
  const [departuresCorridorFilter, setDeparturesCorridorFilter] = React.useState<string>('ALL');
  const [liveTrips, setLiveTrips] = React.useState<Trip[]>([]);
  const [loadingDepartures, setLoadingDepartures] = React.useState<boolean>(true);
  const [drawerTrip, setDrawerTrip] = React.useState<Trip | null>(null);

  // Unified city list from routes
  const allCities = React.useMemo(() => {
    const set = new Set<string>(['Rongai', 'Kisii']);
    routes.forEach((r) => {
      if (r.origin) set.add(r.origin);
      if (r.destination) set.add(r.destination);
    });
    return Array.from(set);
  }, [routes]);

  // Fetch real departures
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenVehicle: 11 | 14 | 16 | null =
      vehicleFilter === '11' ? 11 : vehicleFilter === '14' ? 14 : vehicleFilter === '16' ? 16 : null;
    onStartSearch(selectedOrigin, selectedDestination, travelDate, chosenVehicle);
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

  const availableCorridors = React.useMemo(() => {
    const set = new Set<string>();
    liveTrips.forEach((t) => {
      if (t.route?.origin && t.route?.destination) {
        set.add(`${t.route.origin} → ${t.route.destination}`);
      }
    });
    return Array.from(set);
  }, [liveTrips]);

  const handleSelectSeatsFromDrawer = (trip: Trip, chosenCap: 11 | 14 | 16) => {
    setDrawerTrip(null);
    if (onSelectTrip) {
      onSelectTrip(trip, chosenCap);
    } else {
      onStartSearch(trip.route.origin, trip.route.destination, departuresDate, chosenCap);
    }
  };

  const handleResetFilters = () => {
    setDeparturesDate(todayIso);
    setTravelDate(todayIso);
    setVehicleFilter('ALL');
    setDeparturesCorridorFilter('ALL');
    const heroOrigin = document.getElementById('hero-origin');
    if (heroOrigin) {
      heroOrigin.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleScrollToSearch = () => {
    const heroBtn = document.getElementById('hero-book-seat-btn');
    if (heroBtn) {
      heroBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      onStartSearch(selectedOrigin, selectedDestination, travelDate, null);
    }
  };

  return (
    <div className="w-full pb-24 md:pb-16 overflow-x-hidden">
      {/* 1. Merged Hero & Search Widget */}
      <HeroSection
        allCities={allCities}
        selectedOrigin={selectedOrigin}
        selectedDestination={selectedDestination}
        travelDate={travelDate}
        todayIso={todayIso}
        vehicleFilter={vehicleFilter}
        onOriginChange={setSelectedOrigin}
        onDestinationChange={setSelectedDestination}
        onDateChange={handleTravelDateChange}
        onVehicleFilterChange={setVehicleFilter}
        onSwapLocations={handleSwapLocations}
        onSubmit={handleSearchSubmit}
      />

      {/* 2. Live Routes & Departures Preview */}
      <RoutesPreview
        departuresDate={departuresDate}
        todayIso={todayIso}
        loadingDepartures={loadingDepartures}
        filteredDepartures={filteredDepartures}
        availableCorridors={availableCorridors}
        departuresCorridorFilter={departuresCorridorFilter}
        onCorridorFilterChange={setDeparturesCorridorFilter}
        onViewTrip={(trip) => setDrawerTrip(trip)}
        onOpenSchedules={onOpenSchedules}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Trip Details Drawer */}
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

      {/* 4. Single Sticky Bottom CTA on Mobile Only */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl">
        <button
          type="button"
          onClick={handleScrollToSearch}
          className="craft-btn-amber w-full py-3 px-4 font-extrabold text-xs flex items-center justify-center gap-2 rounded-xl shadow-md cursor-pointer active:scale-[0.99] transition-transform"
        >
          <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>Book Your Seat</span>
        </button>
      </div>
    </div>
  );
};
