import React from 'react';
import { Header, Footer } from './components/layout/Header';
import { OfflineBanner } from './components/common/OfflineBanner';
import { HomePage } from './components/public/HomePage';
import { TripSearchPage } from './components/public/TripSearchPage';
import { BookingFlow } from './components/public/BookingFlow';
import { TripTrackingPage } from './components/public/TripTrackingPage';
import { TicketRetrievalPage } from './components/public/TicketRetrievalPage';
import { CompanyPages } from './components/public/CompanyPages';
import { DriverLogin } from './components/driver/DriverLogin';
import { DriverPortal } from './components/driver/DriverPortal';
import { ManagerLogin } from './components/manager/ManagerLogin';
import { ManagerPortal } from './components/manager/ManagerPortal';
import { Route, Trip } from './types';
import { ApiService } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = React.useState<string>('home');
  const [userRole, setUserRole] = React.useState<'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER'>(
    (ApiService.getUserRole() as any) || 'CUSTOMER_PUBLIC'
  );
  const [driverData, setDriverData] = React.useState<any>(null);
  const [managerData, setManagerData] = React.useState<any>(null);

  // Global routes cache
  const [routes, setRoutes] = React.useState<Route[]>([]);
  const [selectedTripForBooking, setSelectedTripForBooking] = React.useState<Trip | null>(null);
  const [trackingCode, setTrackingCode] = React.useState<string>('TRP-48291');

  // Search defaults
  const [searchOrigin, setSearchOrigin] = React.useState('');
  const [searchDestination, setSearchDestination] = React.useState('');
  const [searchDate, setSearchDate] = React.useState('');
  const [searchPassengers, setSearchPassengers] = React.useState(1);

  React.useEffect(() => {
    ApiService.getRoutes()
      .then((data) => setRoutes(data))
      .catch((err) => console.error('Error loading initial routes:', err));

    // If driver token is already stored in local state
    if (ApiService.getUserRole() === 'DRIVER') {
      const storedName = localStorage.getItem('safariline_driver_name') || 'Frankline Orora';
      const storedId = localStorage.getItem('safariline_driver_id') || 'drv-frankline';
      setDriverData({ id: storedId, name: storedName, licenseNumber: 'DL-8492019', email: '' });
    } else if (ApiService.getUserRole() === 'MANAGER') {
      setManagerData({ name: 'Director Frankline Orora', email: 'manager@transcarrongai.co.ke' });
    }
  }, []);

  const handleLogout = () => {
    ApiService.logout();
    setUserRole('CUSTOMER_PUBLIC');
    setDriverData(null);
    setManagerData(null);
    setCurrentView('home');
  };

  const handleDriverLoginSuccess = (driver: any) => {
    setUserRole('DRIVER');
    setDriverData(driver);
    setCurrentView('driver-portal');
  };

  const handleManagerLoginSuccess = (manager: any) => {
    setUserRole('MANAGER');
    setManagerData(manager);
    setCurrentView('manager-portal');
  };

  const handleStartSearch = (origin?: string, destination?: string, date?: string, passengers?: number) => {
    if (origin) setSearchOrigin(origin);
    if (destination) setSearchDestination(destination);
    if (date) setSearchDate(date);
    if (passengers) setSearchPassengers(passengers);
    setCurrentView('search');
  };

  const handleSelectTripForBooking = (trip: Trip) => {
    setSelectedTripForBooking(trip);
    setCurrentView('booking');
  };

  const handleTrackBusFromRef = (ref: string) => {
    setTrackingCode(ref);
    setCurrentView('tracking');
  };

  const handleBookFromRoute = (route: Route) => {
    setSearchOrigin(route.origin);
    setSearchDestination(route.destination);
    setCurrentView('search');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-100 font-sans text-slate-900 selection:bg-amber-500 selection:text-slate-950 overflow-x-clip relative gpu-accelerated [backface-visibility:hidden] [transform:translateZ(0)]">
      {/* Global Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        userRole={userRole}
        onLogout={handleLogout}
        driverName={driverData?.name}
        managerName={managerData?.name}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {currentView === 'home' && (
          <HomePage
            routes={routes}
            onStartSearch={handleStartSearch}
            onTrackBus={() => setCurrentView('tracking')}
            onRetrieveTicket={() => setCurrentView('retrieve-ticket')}
            onSelectRoute={handleBookFromRoute}
          />
        )}

        {currentView === 'search' && (
          <TripSearchPage
            defaultOrigin={searchOrigin}
            defaultDestination={searchDestination}
            defaultDate={searchDate}
            defaultPassengers={searchPassengers}
            onSelectTrip={handleSelectTripForBooking}
          />
        )}

        {currentView === 'booking' && (
          <BookingFlow
            initialTrip={selectedTripForBooking}
            onDone={() => setCurrentView('home')}
            onTrackBus={handleTrackBusFromRef}
            onOpenDriverPortal={() => {
              if (!driverData) {
                setDriverData({ name: 'Frankline Orora', licenseNumber: 'DL-8492019' });
                setUserRole('DRIVER');
              }
              setCurrentView('driver-portal');
            }}
          />
        )}

        {currentView === 'tracking' && (
          <TripTrackingPage
            initialCode={trackingCode}
            onBookNow={() => setCurrentView('search')}
          />
        )}

        {currentView === 'retrieve-ticket' && (
          <TicketRetrievalPage
            onBackToHome={() => setCurrentView('home')}
            onTrackBus={handleTrackBusFromRef}
          />
        )}

        {(currentView === 'about' ||
          currentView === 'services' ||
          currentView === 'routes' ||
          currentView === 'safety' ||
          currentView === 'policies' ||
          currentView === 'terms' ||
          currentView === 'privacy') && (
          <CompanyPages
            page={currentView as any}
            routes={routes}
            onBookRoute={handleBookFromRoute}
          />
        )}

        {currentView === 'driver-login' && (
          <DriverLogin
            onLoginSuccess={handleDriverLoginSuccess}
            onCancel={() => setCurrentView('home')}
          />
        )}

        {currentView === 'driver-portal' && (
          <DriverPortal driverData={driverData} onLogout={handleLogout} />
        )}

        {currentView === 'manager-login' && (
          <ManagerLogin
            onLoginSuccess={handleManagerLoginSuccess}
            onCancel={() => setCurrentView('home')}
          />
        )}

        {currentView === 'manager-portal' && (
          <ManagerPortal managerData={managerData} onLogout={handleLogout} />
        )}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={(view) => setCurrentView(view)} />

      {/* Offline Status Notification Banner */}
      <OfflineBanner />

      {/* WhatsApp Floating Widget */}
      <a
        href="https://chat.whatsapp.com/D2cFnWdMPDaIWyu335cW2U"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-green-500 rounded-full shadow-xl hover:bg-green-600 transition-all hover:scale-110 border-2 border-white group cursor-pointer"
        title="Join our WhatsApp Group"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 sm:w-8 sm:h-8 fill-white"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.441-1.273.605-1.446c.163-.173.354-.217.473-.217l.354.006c.109.006.255-.041.4.312.152.373.497 1.218.541 1.305.044.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827zM11.994 2C6.476 2 2 6.477 2 11.996c0 1.954.515 3.824 1.492 5.485L2 22l4.646-1.218C8.257 21.734 10.095 22 11.994 22 17.513 22 22 17.523 22 11.996S17.513 2 11.994 2zm0 18.399c-1.635 0-3.232-.42-4.636-1.214l-.333-.188-3.033.795.811-2.956-.206-.327C3.766 14.887 3.332 13.454 3.332 11.996 3.332 7.214 7.219 3.33 11.994 3.33c4.774 0 8.66 3.884 8.66 8.666 0 4.783-3.886 8.667-8.66 8.667z" />
        </svg>
        <span className="hidden sm:block absolute right-16 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Join WhatsApp Group
        </span>
      </a>
    </div>
  );
}

