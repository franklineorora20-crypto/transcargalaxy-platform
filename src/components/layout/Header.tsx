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
  Menu,
  X,
  FileText,
  ChevronDown,
  HelpCircle,
  Clock,
  Bus,
  Mail,
  MapPin,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [staffLoginOpen, setStaffLoginOpen] = useState(false);

  const servicesRef = useRef<HTMLDivElement>(null);
  const staffRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
      if (staffRef.current && !staffRef.current.contains(e.target as Node)) {
        setStaffLoginOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (view: string) => {
    setMobileMenuOpen(false);
    setServicesOpen(false);
    setStaffLoginOpen(false);
    setCurrentView(view);
  };

  const handleOpenTutorial = () => {
    setMobileMenuOpen(false);
    setServicesOpen(false);
    setStaffLoginOpen(false);
    if (onOpenTutorial) {
      onOpenTutorial();
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-surface border-b border-slate-200/80 transition-colors gpu-accelerated [backface-visibility:hidden] [transform:translateZ(0)]">
      {/* 1. Simplified Top Information Bar */}
      <div className="bg-slate-950 text-slate-300 text-[11px] sm:text-xs border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-2">
          {/* Left: Live Operations */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></span>
              <span>Live Operations</span>
            </span>
          </div>

          {/* Center: Synchronized Schedule Summary */}
          <div className="hidden md:flex items-center justify-center text-slate-300 font-medium truncate">
            <span>Daily scheduled departures • Rongai ↔ Kisii & Western corridors</span>
          </div>

          {/* Right: Help | Primary Phone Number */}
          <div className="flex items-center gap-2.5 sm:gap-3 font-mono text-[11px] shrink-0">
            {onOpenTutorial && (
              <>
                <button
                  type="button"
                  onClick={handleOpenTutorial}
                  className="text-slate-200 hover:text-amber-400 transition-colors flex items-center gap-1 font-sans font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
                  title="Open How It Works Passenger Guide"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Help</span>
                </button>
                <span className="text-slate-700" aria-hidden="true">|</span>
              </>
            )}
            <a
              href="tel:+254724626199"
              className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-slate-200 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
            >
              <PhoneCall className="w-3 h-3 text-amber-400 shrink-0" />
              <span>+254 724 626199</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2 & 3. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px] gap-1.5 sm:gap-2">
          {/* Brand Logo Hierarchy with Sufficient Breathing Room */}
          <button
            id="brand-logo-btn"
            type="button"
            onClick={() => handleNav('home')}
            className="flex items-center text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl py-1.5 px-1 sm:px-1.5 -ml-1 sm:-ml-1.5 transition-transform active:scale-[0.99] shrink-0 min-w-0"
          >
            <div className="flex flex-col min-w-0">
              <BrandName className="font-extrabold text-base sm:text-2xl tracking-tight text-slate-950" />
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-wide hidden sm:flex items-center gap-1.5 mt-1 pl-11 sm:pl-12 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true"></span>
                <span className="truncate">Intercity & Rongai Express</span>
              </p>
            </div>
          </button>

          {/* Primary Customer Navigation (Desktop) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80"
          >
            <button
              id="nav-home"
              type="button"
              onClick={() => handleNav('home')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 whitespace-nowrap cursor-pointer ${
                currentView === 'home'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200/90 font-bold'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              Home
            </button>

            <button
              id="nav-routes"
              type="button"
              onClick={() => handleNav('routes')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 whitespace-nowrap cursor-pointer ${
                currentView === 'routes'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200/90 font-bold'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              Routes
            </button>

            <button
              id="nav-schedules"
              type="button"
              onClick={() => handleNav('schedules')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 whitespace-nowrap cursor-pointer ${
                currentView === 'schedules'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200/90 font-bold'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              Schedules
            </button>

            <button
              id="nav-fleet"
              type="button"
              onClick={() => handleNav('fleet')}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 whitespace-nowrap cursor-pointer ${
                currentView === 'fleet'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200/90 font-bold'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              Fleet
            </button>

            {onOpenTutorial && (
              <button
                id="nav-how-it-works"
                type="button"
                onClick={handleOpenTutorial}
                className="px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 text-slate-600 hover:text-slate-950 hover:bg-white/60 whitespace-nowrap cursor-pointer"
              >
                How It Works
              </button>
            )}

            {/* Services Dropdown */}
            <div ref={servicesRef} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={servicesOpen}
                onClick={() => setServicesOpen((open) => !open)}
                className={`flex items-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  ['services', 'tracking', 'retrieve-ticket', 'about', 'terms', 'privacy', 'policies'].includes(currentView)
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/90 font-bold'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                <span>Services</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>

              {servicesOpen && (
                <div
                  role="menu"
                  className="absolute top-full right-0 mt-2 w-56 p-1.5 bg-white border border-slate-200/90 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNav('tracking')}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight w-full text-left transition-colors cursor-pointer ${
                      currentView === 'tracking'
                        ? 'bg-slate-900 text-amber-400'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-500" />
                    <span>Live Bus Tracking</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNav('retrieve-ticket')}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight w-full text-left transition-colors cursor-pointer ${
                      currentView === 'retrieve-ticket'
                        ? 'bg-slate-900 text-amber-400'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Ticket className="w-3.5 h-3.5 text-amber-500" />
                    <span>Retrieve Boarding Pass</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNav('services')}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight w-full text-left transition-colors cursor-pointer ${
                      currentView === 'services'
                        ? 'bg-slate-900 text-amber-400'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Bus className="w-3.5 h-3.5 text-amber-500" />
                    <span>Parcel & Charter Services</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNav('about')}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight w-full text-left transition-colors cursor-pointer ${
                      currentView === 'about'
                        ? 'bg-slate-900 text-amber-400'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span>About TransCar rongai</span>
                  </button>

                  <div className="h-px bg-slate-100 my-1"></div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNav('terms')}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 w-full text-left cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Terms & Conditions</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Right Side Actions: Help | Find a Trip | Staff Login */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {onOpenTutorial && (
              <button
                id="header-help-tutorial-btn"
                type="button"
                onClick={handleOpenTutorial}
                title="Open Interactive Booking Guide"
                className="craft-btn-secondary text-xs px-2.5 py-2 hidden xl:inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Help</span>
              </button>
            )}

            <PWAInstallButton />

            {/* Primary CTA: Find a Trip */}
            <button
              id="header-find-trip-btn"
              type="button"
              onClick={() => handleNav('search')}
              className="craft-btn-amber text-xs px-2.5 sm:px-3.5 py-2 inline-flex items-center gap-1.5 whitespace-nowrap font-bold cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span>Find a Trip</span>
            </button>

            {/* Visually Separate Staff Login Area */}
            {userRole !== 'CUSTOMER_PUBLIC' ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => handleNav(userRole === 'DRIVER' ? 'driver-portal' : 'manager-portal')}
                  className="hidden sm:flex flex-col text-right hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {userRole === 'DRIVER' ? driverName || 'Driver' : managerName || 'Manager'}
                  </span>
                  <span className="text-[10px] text-amber-600 uppercase font-semibold">
                    {userRole === 'DRIVER' ? 'Driver Portal' : 'Manager Portal'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="craft-btn-secondary text-xs p-2 sm:px-3 text-red-600 hover:bg-red-50 hover:border-red-200 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline ml-1">Sign Out</span>
                </button>
              </div>
            ) : (
              <div ref={staffRef} className="relative hidden md:block pl-2 border-l border-slate-200">
                <button
                  id="staff-login-dropdown-btn"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={staffLoginOpen}
                  onClick={() => setStaffLoginOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Staff Login</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${staffLoginOpen ? 'rotate-180' : ''}`} />
                </button>

                {staffLoginOpen && (
                  <div
                    role="menu"
                    aria-label="Staff Portals"
                    className="absolute top-full right-0 mt-2 w-48 p-1.5 bg-white border border-slate-200/90 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Authorized Staff Only
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleNav('driver-login')}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 w-full text-left transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>Driver Portal</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleNav('manager-login')}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 w-full text-left transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-700" />
                      <span>Manager Portal</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu & Backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-[98px] bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden relative z-50 border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-105px)] overflow-y-auto">
            {/* Primary Mobile Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleNav('search')}
                className="craft-btn-amber text-xs py-2.5 w-full min-h-[44px] font-bold"
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                <span>Find a Trip</span>
              </button>
              <button
                type="button"
                onClick={() => handleNav('schedules')}
                className="craft-btn-secondary text-xs py-2.5 w-full min-h-[44px]"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                <span>Schedules</span>
              </button>
            </div>

            <div className="pt-0.5">
              <PWAInstallButton />
            </div>

            {/* Customer Navigation Links */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleNav('home')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center ${
                  currentView === 'home' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => handleNav('routes')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center ${
                  currentView === 'routes' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Routes
              </button>
              <button
                type="button"
                onClick={() => handleNav('schedules')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center ${
                  currentView === 'schedules' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Schedules & Departures
              </button>
              <button
                type="button"
                onClick={() => handleNav('fleet')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center ${
                  currentView === 'fleet' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Fleet (11, 14 & 16-Seater)
              </button>
              {onOpenTutorial && (
                <button
                  type="button"
                  onClick={handleOpenTutorial}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center gap-2 text-slate-900 bg-amber-50 border border-amber-200 hover:bg-amber-100"
                >
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>How It Works / Help</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleNav('services')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center ${
                  currentView === 'services' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Services (Parcel & Charter)
              </button>
              <button
                type="button"
                onClick={() => handleNav('tracking')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center ${
                  currentView === 'tracking' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Live Bus Tracking
              </button>
              <button
                type="button"
                onClick={() => handleNav('retrieve-ticket')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center ${
                  currentView === 'retrieve-ticket' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Retrieve Boarding Pass
              </button>
            </div>

            {/* Visually Separate Staff Login Section */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-3 tracking-wider block">
                Staff Login
              </span>
              {userRole === 'CUSTOMER_PUBLIC' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleNav('driver-login')}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 min-h-[44px]"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Driver Portal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNav('manager-login')}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 min-h-[44px]"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Manager Portal</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {userRole === 'DRIVER' ? driverName || 'Driver' : managerName || 'Manager'}
                    </span>
                    <span className="text-[10px] text-amber-600 font-semibold uppercase">
                      {userRole === 'DRIVER' ? 'Driver Portal' : 'Manager Portal'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="craft-btn-secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 min-h-[40px]"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
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
              Daily express passenger shuttles connecting Ongata Rongai, Nairobi, Ngong, Kiserian, Kisii, Oyugis, Kendu Bay, and Rongo.
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
                <span>Maasai Mall Stage (Ongata Rongai), Nairobi Central & Kisii Main Stage. Daily operations.</span>
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
