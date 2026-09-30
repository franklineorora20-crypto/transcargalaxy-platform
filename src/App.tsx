import React, { lazy, Suspense } from 'react';
import { Header, Footer } from './components/layout/Header';
import { OfflineBanner } from './components/common/OfflineBanner';
import { PWAInstallManager } from './components/common/PWAInstallButton';
import { ToastProvider } from './components/common/Toast';
import { HomePage } from './components/public/HomePage';
import { TripSearchPage } from './components/public/TripSearchPage';
import { BookingFlow } from './components/public/BookingFlow';
import { OnboardingTutorial, ONBOARDING_STORAGE_KEY } from './components/public/OnboardingTutorial';

// Code-split heavy administration, driver, tracking, and auxiliary pages
const TripTrackingPage = lazy(() => import('./components/public/TripTrackingPage').then(m => ({ default: m.TripTrackingPage })));
const TicketRetrievalPage = lazy(() => import('./components/public/TicketRetrievalPage').then(m => ({ default: m.TicketRetrievalPage })));
const CompanyPages = lazy(() => import('./components/public/CompanyPages').then(m => ({ default: m.CompanyPages })));
const DriverLogin = lazy(() => import('./components/driver/DriverLogin').then(m => ({ default: m.DriverLogin })));
const DriverPortal = lazy(() => import('./components/driver/DriverPortal').then(m => ({ default: m.DriverPortal })));
const ManagerLogin = lazy(() => import('./components/manager/ManagerLogin').then(m => ({ default: m.ManagerLogin })));
const ManagerPortal = lazy(() => import('./components/manager/ManagerPortal').then(m => ({ default: m.ManagerPortal })));

import { Route, Trip } from './types';
import { ApiService } from './services/api';

export default function App() {
  const [currentView, setCurrentViewState] = React.useState<string>('home');
  const [userRole, setUserRole] = React.useState<'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER'>(
    (ApiService.getUserRole() as any) || 'CUSTOMER_PUBLIC'
  );
  const [driverData, setDriverData] = React.useState<any>(null);
  const [managerData, setManagerData] = React.useState<any>(null);
  const topSentinelRef = React.useRef<HTMLDivElement>(null);

  const scrollToPageTop = React.useCallback(() => {
    const resetViewportToTop = () => {
      const htmlEl = document.documentElement;
      const bodyEl = document.body;
      const scrollingEl = document.scrollingElement || htmlEl;

      const prevHtmlScrollBehavior = htmlEl.style.scrollBehavior;
      htmlEl.style.scrollBehavior = 'auto';

      window.scrollTo(0, 0);
      if (scrollingEl) {
        scrollingEl.scrollTop = 0;
        scrollingEl.scrollLeft = 0;
      }
      htmlEl.scrollTop = 0;
      bodyEl.scrollTop = 0;

      if (topSentinelRef.current) {
        topSentinelRef.current.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
      }

      htmlEl.style.scrollBehavior = prevHtmlScrollBehavior;
    };

    resetViewportToTop();
    const rafId = window.requestAnimationFrame(() => {
      resetViewportToTop();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const setCurrentView = React.useCallback(
    (nextView: string) => {
      setCurrentViewState(nextView);
      scrollToPageTop();
    },
    [scrollToPageTop]
  );

  // Synchronously position viewport at the absolute top before browser paint on any view change
  React.useLayoutEffect(() => {
    return scrollToPageTop();
  }, [currentView, scrollToPageTop]);

  // Global routes cache
  const [routes, setRoutes] = React.useState<Route[]>([]);
  const [selectedTripForBooking, setSelectedTripForBooking] = React.useState<Trip | null>(null);
  const [trackingCode, setTrackingCode] = React.useState<string>('TRP-48291');
  const [initialVerifyToken, setInitialVerifyToken] = React.useState<string | null>(null);
  const [initialVerifyTripId, setInitialVerifyTripId] = React.useState<string | null>(null);

  // Search defaults
  const [searchOrigin, setSearchOrigin] = React.useState('');
  const [searchDestination, setSearchDestination] = React.useState('');
  const [searchDate, setSearchDate] = React.useState('');
  const [searchCarSeatView, setSearchCarSeatView] = React.useState<11 | 14 | 16 | null>(null);

  // Interactive Onboarding Tutorial state (opened on user request via How It Works / Help)
  const [isTutorialOpen, setIsTutorialOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    ApiService.getRoutes()
      .then((data) => {
        setRoutes(data);

        // Check if there is a deep link in window.location.pathname
        const rawPath = window.location.pathname;
        const path = rawPath.toLowerCase();

        if (path.startsWith('/ticket/verify/') && rawPath.length > 15) {
          const tokenPart = decodeURIComponent(rawPath.slice('/ticket/verify/'.length).replace(/\/$/, ''));
          if (tokenPart) {
            setInitialVerifyToken(tokenPart);
            setCurrentView('driver-portal');
          }
        } else if (path.startsWith('/booking/') && path.length > 9) {
          const slug = path.replace('/booking/', '').replace(/\/$/, '');
          const slugMap: Record<string, { origin: string; destination: string }> = {
            'massai-mall-kisii': { origin: 'Rongai', destination: 'Kisii' },
            'ongata-rongai-kisii': { origin: 'Rongai', destination: 'Kisii' },
            'kisii-massai-mall': { origin: 'Kisii', destination: 'Rongai' },
            'kisii-ongata-rongai': { origin: 'Kisii', destination: 'Rongai' },
            'ngong-kisii': { origin: 'Ngong', destination: 'Kisii' },
            'kisii-ngong': { origin: 'Kisii', destination: 'Ngong' },
            'kiserian-kisii': { origin: 'Kiserian', destination: 'Kisii' },
            'kisii-kiserian': { origin: 'Kisii', destination: 'Kiserian' },
            'massai-mall-sirare': { origin: 'Rongai', destination: 'Sirare' },
            'ongata-rongai-sirare': { origin: 'Rongai', destination: 'Sirare' },
            'sirare-massai-mall': { origin: 'Sirare', destination: 'Rongai' },
            'massai-mall-migori': { origin: 'Rongai', destination: 'Migori' },
            'ongata-rongai-migori': { origin: 'Rongai', destination: 'Migori' },
            'migori-massai-mall': { origin: 'Migori', destination: 'Rongai' },
            'massai-mall-awendo': { origin: 'Rongai', destination: 'Awendo' },
            'ongata-rongai-awendo': { origin: 'Rongai', destination: 'Awendo' },
            'awendo-massai-mall': { origin: 'Awendo', destination: 'Rongai' },
            'massai-mall-rongo': { origin: 'Rongai', destination: 'Rongo' },
            'rongo-massai-mall': { origin: 'Rongo', destination: 'Rongai' },
            'massai-mall-kehancha': { origin: 'Rongai', destination: 'Kehancha' },
            'kehancha-massai-mall': { origin: 'Kehancha', destination: 'Rongai' },
          };

          const matched = slugMap[slug];
          if (matched) {
            setSearchOrigin(matched.origin);
            setSearchDestination(matched.destination);
            setCurrentView('search');
            document.title = `Book Shuttle: ${matched.origin} to ${matched.destination} | TransCar Rongai Express`;
          } else {
            setCurrentView('search');
          }
        } else if (path === '/booking' || path === '/book') {
          setCurrentView('search');
        } else if (path === '/retrieve-ticket' || path === '/tickets') {
          setCurrentView('retrieve-ticket');
        } else if (path === '/tracking' || path === '/track') {
          setCurrentView('tracking');
        } else if (path === '/routes') {
          setCurrentView('routes');
        } else if (path === '/schedules') {
          setCurrentView('schedules');
        } else if (path === '/fleet') {
          setCurrentView('fleet');
        } else if (path === '/services') {
          setCurrentView('services');
        } else if (path === '/driver/login' || path === '/driver-login') {
          setCurrentView('driver-login');
        } else if (path === '/manager/login' || path === '/manager-login') {
          setCurrentView('manager-login');
        } else if (path === '/safety') {
          setCurrentView('safety');
        }
      })
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

  const handleStartSearch = (
    origin?: string,
    destination?: string,
    date?: string,
    carSeatView?: 11 | 14 | 16 | null
  ) => {
    if (origin !== undefined) setSearchOrigin(origin);
    if (destination !== undefined) setSearchDestination(destination);
    if (date !== undefined) setSearchDate(date);
    setSearchCarSeatView(carSeatView ?? null);
    setCurrentView('search');
  };

  const handleSelectTripForBooking = (trip: Trip, chosenCarSeatView?: 11 | 14 | 16) => {
    setSelectedTripForBooking(trip);
    if (chosenCarSeatView) {
      setSearchCarSeatView(chosenCarSeatView);
    } else {
      const cap = trip.vehicle?.seatingCapacity || trip.totalSeats;
      setSearchCarSeatView(cap === 11 ? 11 : cap === 16 ? 16 : 14);
    }
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
    <ToastProvider>
      <div className="min-h-screen min-h-[100dvh] w-full max-w-[100vw] flex flex-col bg-slate-100 font-sans text-slate-900 selection:bg-[#FFC300] selection:text-[#0A0A0A] overflow-x-hidden relative">
      <div
        ref={topSentinelRef}
        id="app-top-sentinel"
        className="h-0 w-full pointer-events-none"
        aria-hidden="true"
      />
      {/* Global Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        userRole={userRole}
        onLogout={handleLogout}
        driverName={driverData?.name}
        managerName={managerData?.name}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Main Content Area */}
      <main key={currentView} className="flex-grow animate-in fade-in duration-150">
        <Suspense fallback={
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-800">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-slate-900 rounded-full animate-spin"></div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-700">Loading TransCar rongai...</span>
          </div>
        }>
          {currentView === 'home' && (
            <HomePage
              routes={routes}
              onStartSearch={handleStartSearch}
              onSelectTrip={handleSelectTripForBooking}
              onTrackBus={() => setCurrentView('tracking')}
              onRetrieveTicket={() => setCurrentView('retrieve-ticket')}
              onSelectRoute={handleBookFromRoute}
              onOpenTutorial={() => setIsTutorialOpen(true)}
              onOpenSchedules={() => setCurrentView('schedules')}
              onOpenFleet={() => setCurrentView('fleet')}
            />
          )}

          {(currentView === 'search' || currentView === 'schedules') && (
            <TripSearchPage
              defaultOrigin={searchOrigin}
              defaultDestination={searchDestination}
              defaultDate={searchDate}
              defaultCarSeatView={searchCarSeatView}
              onSelectTrip={handleSelectTripForBooking}
            />
          )}

          {currentView === 'booking' && (
            <BookingFlow
              initialTrip={selectedTripForBooking}
              initialCarSeatView={searchCarSeatView}
              onDone={() => setCurrentView('home')}
              onTrackBus={handleTrackBusFromRef}
              onOpenDriverPortal={(verifyToken?: string, tripId?: string) => {
                if (verifyToken) setInitialVerifyToken(verifyToken);
                if (tripId) setInitialVerifyTripId(tripId);
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
              onOpenDriverPortal={(verifyToken?: string, tripId?: string) => {
                if (verifyToken) setInitialVerifyToken(verifyToken);
                if (tripId) setInitialVerifyTripId(tripId);
                setCurrentView('driver-portal');
              }}
            />
          )}

          {(currentView === 'about' ||
            currentView === 'services' ||
            currentView === 'routes' ||
            currentView === 'fleet' ||
            currentView === 'safety' ||
            currentView === 'policies' ||
            currentView === 'terms' ||
            currentView === 'privacy') && (
            <CompanyPages
              page={currentView as any}
              routes={routes}
              onBookRoute={handleBookFromRoute}
              onSelectVehicleFilter={(cap) => handleStartSearch('', '', undefined, cap)}
            />
          )}

          {currentView === 'driver-login' && (
            <DriverLogin
              onLoginSuccess={handleDriverLoginSuccess}
              onCancel={() => setCurrentView('home')}
            />
          )}

          {currentView === 'driver-portal' && (
            userRole === 'DRIVER' || userRole === 'MANAGER' ? (
              <DriverPortal
                driverData={driverData}
                onLogout={handleLogout}
                initialVerifyToken={initialVerifyToken}
                initialVerifyTripId={initialVerifyTripId}
                onClearInitialVerify={() => {
                  setInitialVerifyToken(null);
                  setInitialVerifyTripId(null);
                }}
              />
            ) : (
              <DriverLogin
                onLoginSuccess={handleDriverLoginSuccess}
                onCancel={() => setCurrentView('home')}
              />
            )
          )}

          {currentView === 'manager-login' && (
            <ManagerLogin
              onLoginSuccess={handleManagerLoginSuccess}
              onCancel={() => setCurrentView('home')}
            />
          )}

          {currentView === 'manager-portal' && (
            userRole === 'MANAGER' ? (
              <ManagerPortal managerData={managerData} onLogout={handleLogout} />
            ) : (
              <ManagerLogin
                onLoginSuccess={handleManagerLoginSuccess}
                onCancel={() => setCurrentView('home')}
              />
            )
          )}
        </Suspense>
      </main>

      {/* Global Footer */}
      <Footer
        onNavigate={(view) => setCurrentView(view)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* First-Time User Interactive Onboarding Tutorial */}
      <OnboardingTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onStartBookingNow={() => {
          setIsTutorialOpen(false);
          setCurrentView('search');
        }}
      />

      {/* Offline Status Notification Banner */}
      <OfflineBanner />

      {/* Global PWA Install Banner & Unified Device-Aware Install Modal */}
      <PWAInstallManager />
      </div>
    </ToastProvider>
  );
}

