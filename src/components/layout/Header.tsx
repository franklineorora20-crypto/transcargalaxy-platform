import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Ticket,
  Search,
  PhoneCall,
  UserCheck,
  Lock,
  LogOut,
  Navigation,
  FileText,
  ChevronDown,
  HelpCircle,
  Clock,
  Bus,
  Mail,
  MapPin,
  LayoutGrid,
  Home,
} from 'lucide-react';
import { BrandName } from '../common/BrandName';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  userRole: 'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER';
  onLogout: () => void;
  driverName?: string;
  managerName?: string;
  onOpenTutorial?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  userRole,
  onLogout,
  driverName,
  managerName,
  onOpenTutorial,
}) => {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dashboardRef.current && !dashboardRef.current.contains(e.target as Node)) {
        setDashboardOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (view: string) => {
    setDashboardOpen(false);
    setCurrentView(view);
  };

  const handleOpenTutorial = () => {
    setDashboardOpen(false);
    if (onOpenTutorial) {
      onOpenTutorial();
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-surface border-b border-slate-200/80 transition-colors gpu-accelerated [backface-visibility:hidden] [transform:translateZ(0)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 sm:h-14 gap-2">
          {/* Brand Wordmark */}
          <button
            id="brand-logo-btn"
            type="button"
            onClick={() => handleNav('home')}
            className="flex items-center text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl py-1 px-1 -ml-1 transition-transform active:scale-[0.99] shrink-0 min-w-0 cursor-pointer"
          >
            <BrandName className="font-extrabold text-base sm:text-lg tracking-tight text-slate-950" />
          </button>

          {/* Small Install Button + Single Menu Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <PWAInstallButton />

            <div ref={dashboardRef} className="relative">
              <button
                id="services-dashboard-dropdown-btn"
                type="button"
                aria-haspopup="menu"
                aria-expanded={dashboardOpen}
                onClick={() => setDashboardOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 h-7 sm:h-8 min-h-[28px] rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  dashboardOpen
                    ? 'bg-slate-950 text-amber-400 border-slate-950 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
                }`}
              >
                <LayoutGrid className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Menu</span>
                <ChevronDown
                  className={`w-3 h-3 text-amber-400 transition-transform duration-150 ${
                    dashboardOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {dashboardOpen && (
                <div
                  role="menu"
                  aria-label="Services Dashboard"
                  className="absolute top-full right-0 mt-2 w-72 sm:w-80 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3"
                >
                  {/* Dashboard Header + Quick Find Trip */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      All Services & Tools
                    </span>
                    <button
                      id="header-find-trip-btn"
                      type="button"
                      onClick={() => handleNav('search')}
                      className="craft-btn-amber text-[11px] px-2.5 py-1 h-7 rounded-lg inline-flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Search className="w-3 h-3 shrink-0" />
                      <span>Find a Trip</span>
                    </button>
                  </div>

                  {/* Quick Action: Help / Interactive Booking Guide */}
                  {onOpenTutorial && (
                    <div>
                      <button
                        id="header-help-tutorial-btn"
                        type="button"
                        onClick={handleOpenTutorial}
                        title="Open Interactive Booking Guide"
                        className="craft-btn-secondary w-full justify-center text-[11px] px-2.5 py-1 h-8 min-h-[32px] rounded-lg inline-flex items-center gap-1 whitespace-nowrap font-semibold cursor-pointer"
                      >
                        <HelpCircle className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>Help / How It Works Guide</span>
                      </button>
                    </div>
                  )}

                  {/* Primary Navigation & Services Grid */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      id="nav-home"
                      type="button"
                      role="menuitem"
                      onClick={() => handleNav('home')}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        currentView === 'home'
                          ? 'bg-slate-900 text-amber-400'
                          : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Home</span>
                    </button>

                    <button
                      id="nav-routes"
                      type="button"
                      role="menuitem"
                      onClick={() => handleNav('routes')}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        currentView === 'routes'
                          ? 'bg-slate-900 text-amber-400'
                          : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Routes</span>
                    </button>

                    <button
                      id="nav-schedules"
                      type="button"
                      role="menuitem"
                      onClick={() => handleNav('schedules')}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        currentView === 'schedules'
                          ? 'bg-slate-900 text-amber-400'
                          : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Schedules</span>
                    </button>

                    <button
                      id="nav-fleet"
                      type="button"
                      role="menuitem"
                      onClick={() => handleNav('fleet')}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        currentView === 'fleet'
                          ? 'bg-slate-900 text-amber-400'
                          : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <Bus className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Fleet</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleNav('tracking')}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        currentView === 'tracking'
                          ? 'bg-slate-900 text-amber-400'
                          : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Live Tracking</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleNav('retrieve-ticket')}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        currentView === 'retrieve-ticket'
                          ? 'bg-slate-900 text-amber-400'
                          : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <Ticket className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Boarding Pass</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleNav('services')}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        currentView === 'services'
                          ? 'bg-slate-900 text-amber-400'
                          : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <Bus className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Parcel & Charter</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleNav('about')}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        currentView === 'about'
                          ? 'bg-slate-900 text-amber-400'
                          : 'text-slate-700 hover:bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">About Us</span>
                    </button>
                  </div>

                  {/* Secondary Links & Staff Portals */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <button
                        type="button"
                        onClick={() => handleNav('terms')}
                        className="hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>Terms & Policies</span>
                      </button>
                      <a
                        href="tel:+254724626199"
                        className="font-mono text-slate-700 hover:text-amber-600 font-semibold flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3 text-amber-500" />
                        <span>+254 724 626199</span>
                      </a>
                    </div>

                    {userRole === 'CUSTOMER_PUBLIC' ? (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleNav('driver-login')}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>Driver Login</span>
                        </button>
                        <button
                          id="staff-login-dropdown-btn"
                          type="button"
                          role="menuitem"
                          onClick={() => handleNav('manager-login')}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Lock className="w-3 h-3 text-slate-600 shrink-0" />
                          <span>Manager Login</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleNav(userRole === 'DRIVER' ? 'driver-portal' : 'manager-portal')}
                          className="text-left hover:opacity-80 cursor-pointer"
                        >
                          <span className="text-xs font-bold text-slate-900 block">
                            {userRole === 'DRIVER' ? driverName || 'Driver' : managerName || 'Manager'}
                          </span>
                          <span className="text-[10px] text-amber-600 font-semibold uppercase">
                            Open {userRole === 'DRIVER' ? 'Driver' : 'Manager'} Portal
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onLogout();
                            setDashboardOpen(false);
                          }}
                          className="craft-btn-secondary text-[11px] px-2.5 py-1 h-7 text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <LogOut className="w-3 h-3 mr-1" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Footer: React.FC<{ onNavigate: (view: string) => void; onOpenTutorial?: () => void }> = ({
  onNavigate,
  onOpenTutorial,
}) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
          {/* 1. Brand Info */}
          <div className="space-y-3">
            <BrandName className="font-extrabold text-xl tracking-tight text-white" />
            <p className="text-slate-300 font-semibold text-xs leading-snug">
              Premier Intercity & Rongai Regional Express Transportation
            </p>
            <p className="text-slate-400 leading-relaxed text-xs">
              Daily express passenger shuttles connecting Ongata Rongai, Nairobi, Ngong, Kiserian, Kisii, Rongo, Awendo, Migori, Sirare, and Kehancha.
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-amber-400">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>NTSA Licensed PSV Operator</span>
            </div>
          </div>

          {/* 2. Customer Links */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Passenger Links</h4>
            <ul className="space-y-2">
              <li>
                <button type="button" onClick={() => onNavigate('search')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Find a Trip
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('routes')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Routes
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('schedules')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Schedules
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('fleet')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Fleet (11, 14 & 16-Seater)
                </button>
              </li>
              {onOpenTutorial && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenTutorial}
                    className="hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    How It Works
                  </button>
                </li>
              )}
              <li>
                <button type="button" onClick={() => onNavigate('services')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Services
                </button>
              </li>
              <li>
                <PWAInstallButton variant="footer" />
              </li>
              {onOpenTutorial && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenTutorial}
                    className="text-amber-400 font-semibold hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Help</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* 3. Support & Contact (Includes Primary & Secondary Phone Numbers) */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Support & Contact</h4>
            <div className="space-y-2 text-slate-300 text-xs">
              <p className="flex items-center gap-2 font-mono">
                <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Primary: <a href="tel:+254724626199" className="text-amber-400 font-bold hover:underline">+254 724 626199</a></span>
              </p>
              <p className="flex items-center gap-2 font-mono">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Secondary: <a href="tel:+254717747626" className="text-slate-200 font-semibold hover:text-amber-400 hover:underline">+254 717 747626</a></span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href="mailto:support@transcarrongai.co.ke" className="hover:text-amber-400 transition-colors">
                  support@transcarrongai.co.ke
                </a>
              </p>
              <p className="flex items-start gap-2 text-slate-400 pt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Next to Isalu Center (Ongata Rongai), Nairobi Central & Kisii Main Stage. Daily operations.</span>
              </p>
            </div>
          </div>

          {/* 4. Booking Tools & Staff Access */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Manage Booking & Staff</h4>
            <ul className="space-y-2">
              <li>
                <button type="button" onClick={() => onNavigate('retrieve-ticket')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Retrieve Boarding Pass
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('tracking')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Live Bus Tracking
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('terms')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('privacy')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5">
                  Staff Login
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('driver-login')}
                    className="text-slate-400 hover:text-amber-400 transition-colors font-medium cursor-pointer"
                  >
                    Driver Portal
                  </button>
                  <span className="text-slate-700" aria-hidden="true">•</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('manager-login')}
                    className="text-slate-400 hover:text-amber-400 transition-colors font-medium cursor-pointer"
                  >
                    Manager Portal
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} TransCar Rongai Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Premier Intercity & Rongai Regional Express Transportation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
