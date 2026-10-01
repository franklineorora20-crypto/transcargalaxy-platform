import React, { lazy, Suspense } from 'react';
import { Search } from 'lucide-react';
import { Header, Footer } from './components/layout/Header';
import { OfflineBanner } from './components/common/OfflineBanner';
import { PWAInstallManager } from './components/common/PWAInstallButton';
import { ToastProvider } from './components/common/Toast';
import { RoleGuard } from './components/common/RoleGuard';
import { HomePage } from './components/public/HomePage';
import { TripSearchPage } from './components/public/TripSearchPage';
import { BookingFlow } from './components/public/BookingFlow';
import { OnboardingTutorial } from './components/public/OnboardingTutorial';

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

type ManagerTab =
  | 'overview'
  | 'reports'
  | 'announcements'
  | 'routes'
  | 'trips'
  | 'bookings'
  | 'fleet'
  | 'drivers'
  | 'inspections'
  | 'finance'
  | 'incidents'
  | 'audit';

interface RouteMatch {
  view: string;
  managerTab?: ManagerTab;
  origin?: string;
  destination?: string;
  verifyToken?: string;
  pathUrl?: string;
}

function resolveRouteFromPath(rawPathname: string, currentRole: 'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER'): RouteMatch {
  const path = rawPathname.toLowerCase().replace(/\/$/, '') || '/';

  // 1. Verification deep link
  if (path.startsWith('/ticket/verify/') && rawPathname.length > 15) {
    const tokenPart = decodeURIComponent(rawPathname.slice('/ticket/verify/'.length).replace(/\/$/, ''));
    if (currentRole === 'DRIVER' || currentRole === 'MANAGER') {
      return { view: 'driver-portal', verifyToken: tokenPart, pathUrl: rawPathname };
    }
    return { view: 'driver-login', verifyToken: tokenPart, pathUrl: '/driver/login' };
  }

  // 2. Corridors
  if (path.startsWith('/booking/') && path.length > 9) {
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
      return { view: 'search', origin: matched.origin, destination: matched.destination, pathUrl: path };
    }
    return { view: 'search', pathUrl: '/search' };
  }

  // 3. Manager routes (Protected)
  if (
    path === '/manager' ||
    path === '/manager-portal' ||
    path.startsWith('/manager/') ||
    path === '/admin' ||
    path.startsWith('/admin/')
  ) {
    if (path === '/manager/login' || path === '/admin/login' || path === '/manager-login') {
      return { view: 'manager-login', pathUrl: '/manager/login' };
    }

    let tab: ManagerTab = 'overview';
    if (path.includes('/finance') || path.includes('/revenue') || path.includes('/expenses') || path.includes('/payroll')) {
      tab = 'finance';
    } else if (path.includes('/drivers') || path.includes('/driver-management')) {
      tab = 'drivers';
    } else if (path.includes('/vehicles') || path.includes('/fleet')) {
      tab = 'fleet';
    } else if (path.includes('/routes')) {
      tab = 'routes';
    } else if (path.includes('/trips')) {
      tab = 'trips';
    } else if (path.includes('/bookings')) {
      tab = 'bookings';
    } else if (path.includes('/inspections')) {
      tab = 'inspections';
    } else if (path.includes('/incidents')) {
      tab = 'incidents';
    } else if (path.includes('/reports')) {
      tab = 'reports';
    } else if (path.includes('/audit')) {
      tab = 'audit';
    } else if (path.includes('/announcements')) {
      tab = 'announcements';
    }

    if (currentRole === 'MANAGER') {
      return { view: 'manager-portal', managerTab: tab, pathUrl: path };
    }
    // If unauthenticated (CUSTOMER_PUBLIC) -> redirect to manager-login
    if (currentRole === 'CUSTOMER_PUBLIC') {
      return { view: 'manager-login', pathUrl: '/manager/login' };
    }
    // If DRIVER -> route to manager-portal guarded by RoleGuard to display 403 Unauthorized
    return { view: 'manager-portal', managerTab: tab, pathUrl: path };
  }

  // 4. Driver routes (Protected)
  if (
    path === '/driver' ||
    path === '/driver-portal' ||
    path.startsWith('/driver/')
  ) {
    if (path === '/driver/login' || path === '/driver-login') {
      return { view: 'driver-login', pathUrl: '/driver/login' };
    }

    if (currentRole === 'DRIVER' || currentRole === 'MANAGER') {
      return { view: 'driver-portal', pathUrl: path };
    }
    // If unauthenticated: redirect to driver-login
    return { view: 'driver-login', pathUrl: '/driver/login' };
  }

  // 5. Public routes
  if (path === '/search' || path === '/booking' || path === '/book') return { view: 'search', pathUrl: '/search' };
  if (path === '/schedules') return { view: 'schedules', pathUrl: '/schedules' };
  if (path === '/routes') return { view: 'routes', pathUrl: '/routes' };
  if (path === '/fleet' || path === '/vehicles') return { view: 'fleet', pathUrl: '/fleet' };
  if (path === '/services') return { view: 'services', pathUrl: '/services' };
  if (path === '/about') return { view: 'about', pathUrl: '/about' };
  if (path === '/safety') return { view: 'safety', pathUrl: '/safety' };
  if (path === '/terms' || path === '/policies') return { view: 'terms', pathUrl: '/terms' };
  if (path === '/privacy') return { view: 'privacy', pathUrl: '/privacy' };
  if (path === '/tracking' || path === '/track') return { view: 'tracking', pathUrl: '/tracking' };
  if (path === '/retrieve-ticket' || path === '/tickets') return { view: 'retrieve-ticket', pathUrl: '/retrieve-ticket' };

  return { view: 'home', pathUrl: '/' };
}

export default function App() {
  const [userRole, setUserRole] = React.useState<'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER'>(
    ApiService.getUserRole()
  );
  const [driverData, setDriverData] = React.useState<any>(null);
  const [managerData, setManagerData] = React.useState<any>(null);
  const [managerActiveTab, setManagerActiveTab] = React.useState<ManagerTab>('overview');

  const [currentView, setCurrentViewState] = React.useState<string>('home');
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
    (nextView: string, customUrl?: string) => {
      setCurrentViewState(nextView);
      scrollToPageTop();

      if (typeof window !== 'undefined') {
        const viewUrlMap: Record<string, string> = {
          home: '/',
          search: '/search',
          schedules: '/schedules',
          booking: '/booking',
          tracking: '/tracking',
          'retrieve-ticket': '/retrieve-ticket',
          routes: '/routes',
          fleet: '/fleet',
          services: '/services',
          about: '/about',
          safety: '/safety',
          terms: '/terms',
          privacy: '/privacy',
          'driver-login': '/driver/login',
          'driver-portal': '/driver',
          'manager-login': '/manager/login',
          'manager-portal': '/manager',
        };

        const targetUrl = customUrl || viewUrlMap[nextView] || '/';
        if (window.location.pathname !== targetUrl) {
          window.history.pushState({ view: nextView }, '', targetUrl);
        }
      }
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

  // Synchronize routing and initial auth state on mount and on popstate
  React.useEffect(() => {
    const role = ApiService.getUserRole();
    setUserRole(role);

    if (role === 'DRIVER') {
      const storedName = localStorage.getItem('safariline_driver_name') || 'Captain Frankline Orora';
      const storedId = localStorage.getItem('safariline_driver_id') || 'drv-frankline';
      setDriverData({ id: storedId, name: storedName, licenseNumber: 'DL-FRK8492', email: 'driver@transcarrongai.co.ke' });
    } else if (role === 'MANAGER') {
      const storedName = localStorage.getItem('safariline_manager_name') || 'Director Frankline Orora';
      setManagerData({ name: storedName, email: 'manager@transcarrongai.co.ke' });
    }

    const currentPath = window.location.pathname;
    const match = resolveRouteFromPath(currentPath, role);

    if (match.origin) setSearchOrigin(match.origin);
    if (match.destination) setSearchDestination(match.destination);
    if (match.managerTab) setManagerActiveTab(match.managerTab);
    if (match.verifyToken) setInitialVerifyToken(match.verifyToken);

    setCurrentViewState(match.view);
    if (match.pathUrl && match.pathUrl !== currentPath) {
      window.history.replaceState({ view: match.view }, '', match.pathUrl);
    }

    ApiService.getRoutes()
      .then((data) => setRoutes(data))
      .catch((err) => console.error('Error loading initial routes:', err));

    const handlePopState = () => {
      const currentRole = ApiService.getUserRole();
      setUserRole(currentRole);
      const popped = resolveRouteFromPath(window.location.pathname, currentRole);
      if (popped.origin) setSearchOrigin(popped.origin);
      if (popped.destination) setSearchDestination(popped.destination);
      if (popped.managerTab) setManagerActiveTab(popped.managerTab);
      if (popped.verifyToken) setInitialVerifyToken(popped.verifyToken);
      setCurrentViewState(popped.view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogout = () => {
    ApiService.logout();
    setUserRole('CUSTOMER_PUBLIC');
    setDriverData(null);
    setManagerData(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
    setCurrentViewState('home');
    scrollToPageTop();
  };

  const handleDriverLoginSuccess = (driver: any) => {
    setUserRole('DRIVER');
    setDriverData(driver);
    setCurrentView('driver-portal', '/driver');
  };

  const handleManagerLoginSuccess = (manager: any) => {
    setUserRole('MANAGER');
    setManagerData(manager);
    setCurrentView('manager-portal', '/manager');
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
    setCurrentView('search', '/search');
  };

  const handleSelectTripForBooking = (trip: Trip, chosenCarSeatView?: 11 | 14 | 16) => {
    setSelectedTripForBooking(trip);
    if (chosenCarSeatView) {
      setSearchCarSeatView(chosenCarSeatView);
    } else {
      const cap = trip.vehicle?.seatingCapacity || trip.totalSeats;
      setSearchCarSeatView(cap === 11 ? 11 : cap === 16 ? 16 : 14);
    }
    setCurrentView('booking', '/booking');
  };

  const handleTrackBusFromRef = (ref: string) => {
    setTrackingCode(ref);
    setCurrentView('tracking', '/tracking');
  };

  const handleBookFromRoute = (route: Route) => {
    setSearchOrigin(route.origin);
    setSearchDestination(route.destination);
    setCurrentView('search', '/search');
  };

  return (
    <ToastProvider>
      <div className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-100 font-sans text-slate-900 selection:bg-[#FFC300] selection:text-[#0A0A0A] overflow-x-hidden relative">
        <div
          ref={topSentinelRef}
          id="app-top-sentinel"
          className="h-0 w-full pointer-events-none"
          aria-hidden="true"
        />
        {/* Global Header / Navbar */}
        <Header
          currentView={currentView}
          setCurrentView={(v) => setCurrentView(v)}
          userRole={userRole}
          onLogout={handleLogout}
          driverName={driverData?.name}
          managerName={managerData?.name}
          onOpenTutorial={() => setIsTutorialOpen(true)}
        />

        {/* Main Content Area */}
        <main key={currentView} className="flex-grow animate-in fade-in duration-150 overflow-x-hidden">
          <Suspense
            fallback={
              <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-800">
                <div className="w-8 h-8 border-4 border-amber-400 border-t-slate-900 rounded-full animate-spin"></div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">Loading TransCar rongai...</span>
              </div>
            }
          >
            {currentView === 'home' && (
              <HomePage
                routes={routes}
                onStartSearch={handleStartSearch}
                onSelectTrip={handleSelectTripForBooking}
                onTrackBus={() => setCurrentView('tracking', '/tracking')}
                onRetrieveTicket={() => setCurrentView('retrieve-ticket', '/retrieve-ticket')}
                onSelectRoute={handleBookFromRoute}
                onOpenTutorial={() => setIsTutorialOpen(true)}
                onOpenSchedules={() => setCurrentView('schedules', '/schedules')}
                onOpenFleet={() => setCurrentView('fleet', '/fleet')}
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
                onDone={() => setCurrentView('home', '/')}
                onTrackBus={handleTrackBusFromRef}
                onOpenDriverPortal={(verifyToken?: string, tripId?: string) => {
                  if (verifyToken) setInitialVerifyToken(verifyToken);
                  if (tripId) setInitialVerifyTripId(tripId);
                  if (userRole === 'DRIVER' || userRole === 'MANAGER') {
                    setCurrentView('driver-portal', '/driver');
                  } else {
                    setCurrentView('driver-login', '/driver/login');
                  }
                }}
              />
            )}

            {currentView === 'tracking' && (
              <TripTrackingPage
                initialCode={trackingCode}
                onBookNow={() => setCurrentView('search', '/search')}
              />
            )}

            {currentView === 'retrieve-ticket' && (
              <TicketRetrievalPage
                onBackToHome={() => setCurrentView('home', '/')}
                onTrackBus={handleTrackBusFromRef}
                onOpenDriverPortal={(verifyToken?: string, tripId?: string) => {
                  if (verifyToken) setInitialVerifyToken(verifyToken);
                  if (tripId) setInitialVerifyTripId(tripId);
                  if (userRole === 'DRIVER' || userRole === 'MANAGER') {
                    setCurrentView('driver-portal', '/driver');
                  } else {
                    setCurrentView('driver-login', '/driver/login');
                  }
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
                onCancel={() => setCurrentView('home', '/')}
              />
            )}

            {currentView === 'driver-portal' && (
              <RoleGuard
                allowedRoles={['DRIVER', 'MANAGER']}
                currentRole={userRole}
                onRedirectToLogin={() => setCurrentView('driver-login', '/driver/login')}
                onRedirectHome={() => setCurrentView('home', '/')}
                fallbackMessage="The Driver Operations Cockpit is restricted to authorized TransCar drivers. Please log in with your Driver account."
              >
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
              </RoleGuard>
            )}

            {currentView === 'manager-login' && (
              <ManagerLogin
                onLoginSuccess={handleManagerLoginSuccess}
                onCancel={() => setCurrentView('home', '/')}
              />
            )}

            {currentView === 'manager-portal' && (
              <RoleGuard
                allowedRoles={['MANAGER']}
                currentRole={userRole}
                onRedirectToLogin={() => setCurrentView('manager-login', '/manager/login')}
                onRedirectHome={() => setCurrentView('home', '/')}
                fallbackMessage="The Executive Operations & Financial Management Portal is strictly restricted to authorized Managers."
              >
                <ManagerPortal
                  managerData={managerData}
                  onLogout={handleLogout}
                  initialTab={managerActiveTab}
                />
              </RoleGuard>
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
            setCurrentView('search', '/search');
          }}
        />

        {/* Offline Status Notification Banner */}
        <OfflineBanner />

        {/* Mobile-Only Sticky Bottom CTA Bar */}
        {['home', 'routes', 'fleet', 'safety', 'about', 'services', 'policies', 'terms', 'privacy', 'tracking', 'retrieve-ticket'].includes(currentView) && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 shadow-lg">
            <button
              id="mobile-sticky-book-btn"
              type="button"
              onClick={() => setCurrentView('search', '/search')}
              className="w-full h-12 max-h-12 craft-btn-amber text-sm font-extrabold flex items-center justify-center gap-2 touch-manipulation cursor-pointer shadow-md active:scale-[0.99] transition-transform"
            >
              <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Book Your Seat</span>
            </button>
          </div>
        )}

        {/* Global PWA Install Banner & Unified Device-Aware Install Modal */}
        <PWAInstallManager />
      </div>
    </ToastProvider>
  );
}
