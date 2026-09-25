import React from 'react';
import {
  Bus,
  Shield,
  MapPin,
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
  Info,
  ChevronDown,
  Sparkles,
  ArrowUpRight,
  Heart,
} from 'lucide-react';
import { BrandName } from '../common/BrandName';
import { ApiService } from '../../services/api';

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  userRole: 'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER';
  onLogout: () => void;
  driverName?: string;
  managerName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  userRole,
  onLogout,
  driverName,
  managerName,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [servicesOpen, setServicesOpen] = React.useState(false);

  const handleNav = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    setServicesOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 glass-surface border-b border-slate-200/80 transition-colors">
      {/* Precision Top Telemetry Bar */}
      <div className="bg-slate-950 text-slate-300 text-[10px] sm:text-xs border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="craft-badge-pulse text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 text-[10px] sm:text-xs">
              <span className="dot bg-emerald-400"></span>
              Live Operations
            </span>
            <span className="hidden md:inline text-slate-500 font-mono">|</span>
            <span className="hidden md:inline text-slate-300">Daily Departures: <strong className="text-amber-400 font-mono">1:00 AM</strong> & <strong className="text-amber-400 font-mono">Hourly</strong></span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 font-mono text-[10px] sm:text-[11px]">
            <a href="tel:+254724626199" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span>+254 724 626199</span>
            </a>
            <span className="text-slate-700 hidden xs:inline">/</span>
            <a href="tel:+254717747626" className="hover:text-amber-400 transition-colors hidden sm:inline">
              +254 717 747626
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo with Tactile Lift */}
          <button
            id="brand-logo-btn"
            onClick={() => handleNav('home')}
            className="flex items-center gap-2 sm:gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl p-1 -ml-1 transition-transform active:scale-[0.98] min-w-0"
          >
            <div className="flex flex-col min-w-0">
              <BrandName className="font-extrabold text-lg xs:text-xl sm:text-2xl tracking-tight text-slate-950 truncate" />
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-wide flex items-center gap-1.5 mt-0.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                <span className="truncate">Intercity & Rongai Express</span>
              </p>
            </div>
          </button>

          {/* Right Side Navigation & Actions */}
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Desktop Navigation Segmented Pill */}
            <nav className="hidden lg:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 craft-shadow-sm">
              <button
                id="nav-home"
                onClick={() => handleNav('home')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 ${
                  currentView === 'home'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/90 font-bold'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                Home
              </button>

              <button
                type="button"
                onClick={() => handleNav('routes')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 ${
                  currentView === 'routes'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/90 font-bold'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                Routes
              </button>

              <button
                type="button"
                onClick={() => handleNav('services')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 ${
                  currentView === 'services'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/90 font-bold'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                Fleet
              </button>

              <button
                type="button"
                onClick={() => handleNav('about')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 ${
                  currentView === 'about'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/90 font-bold'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                About
              </button>

              {/* Services Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={servicesOpen}
                  onClick={() => setServicesOpen((open) => !open)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 ${
                    ['search', 'booking', 'tracking', 'retrieve-ticket', 'terms', 'privacy'].includes(currentView)
                      ? 'bg-white text-slate-950 shadow-sm border border-slate-200/90 font-bold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                  }`}
                >
                  Services
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>

                {servicesOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 p-1.5 bg-white border border-slate-200/90 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => handleNav('search')}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight w-full text-left transition-colors ${
                        currentView === 'search' || currentView === 'booking'
                          ? 'bg-slate-900 text-amber-400'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5 text-amber-500" />
                      Book Journey
                    </button>

                    <button
                      onClick={() => handleNav('tracking')}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight w-full text-left transition-colors ${
                        currentView === 'tracking'
                          ? 'bg-slate-900 text-amber-400'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5 text-amber-500" />
                      Live Bus Radar
                    </button>

                    <button
                      onClick={() => handleNav('retrieve-ticket')}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight w-full text-left transition-colors ${
                        currentView === 'retrieve-ticket'
                          ? 'bg-slate-900 text-amber-400'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Ticket className="w-3.5 h-3.5 text-amber-500" />
                      Retrieve Boarding Pass
                    </button>

                    <div className="h-px bg-slate-100 my-1"></div>

                    <button
                      onClick={() => handleNav('terms')}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 w-full text-left"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Booking Terms
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* Quick Action CTA Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNav('search')}
                className="craft-btn-amber text-xs px-3.5 py-2 hidden sm:inline-flex"
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                Book Seats
              </button>

              {userRole !== 'CUSTOMER_PUBLIC' ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {userRole === 'DRIVER' ? driverName || 'Driver' : managerName || 'Manager'}
                    </span>
                    <span className="text-[10px] text-amber-600 uppercase font-semibold">
                      {userRole === 'DRIVER' ? 'Captain' : 'Ops Admin'}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="craft-btn-secondary text-xs p-2 sm:px-3 text-red-600 hover:bg-red-50 hover:border-red-200"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline ml-1">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleNav('driver-login')}
                    className="craft-btn-secondary text-xs px-2.5 py-1.5 hidden md:inline-flex"
                    title="Driver Portal"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    Driver
                  </button>
                  <button
                    onClick={() => handleNav('manager-login')}
                    className="craft-btn-primary text-xs px-2.5 py-1.5"
                    title="Manager Portal"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1" />
                    Manager
                  </button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none active:scale-95"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu & Backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-[115px] sm:top-[125px] bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden relative z-50 border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2.5 shadow-2xl animate-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 pb-2">
              <button
                onClick={() => handleNav('search')}
                className="craft-btn-amber text-xs py-2.5 w-full min-h-[44px]"
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                Book Seats
              </button>
              <button
                onClick={() => handleNav('tracking')}
                className="craft-btn-secondary text-xs py-2.5 w-full min-h-[44px]"
              >
                <Navigation className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                Live Radar
              </button>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleNav('home')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center ${
                  currentView === 'home' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => handleNav('routes')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center ${
                  currentView === 'routes' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Scheduled Routes & Fares
              </button>
              <button
                onClick={() => handleNav('services')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center ${
                  currentView === 'services' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Executive Fleet Showcase
              </button>
              <button
                onClick={() => handleNav('retrieve-ticket')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center ${
                  currentView === 'retrieve-ticket' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Retrieve Ticket / Boarding Pass
              </button>
              <button
                onClick={() => handleNav('about')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] flex items-center ${
                  currentView === 'about' ? 'bg-slate-900 text-amber-400' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                About TransCar Galaxy
              </button>
            </div>

            {/* Portal Access for Mobile Users & Operators */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-3 tracking-wider block">
                Portals & Dispatch
              </span>
              {userRole === 'CUSTOMER_PUBLIC' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleNav('driver-login')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 min-h-[44px]"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>Driver Portal</span>
                  </button>
                  <button
                    onClick={() => handleNav('manager-login')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-amber-400 border border-slate-950 flex items-center gap-1.5 min-h-[44px]"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Manager</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {userRole === 'DRIVER' ? driverName || 'Captain' : managerName || 'Manager'}
                    </span>
                    <span className="text-[10px] text-amber-600 font-semibold uppercase">
                      {userRole === 'DRIVER' ? 'Captain On Duty' : 'Operations Admin'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="craft-btn-secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 min-h-[40px]"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500 px-1">
              <span>Direct Hotline:</span>
              <a href="tel:+254724626199" className="font-bold text-slate-900 hover:text-amber-600">
                +254 724 626199
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export const Footer: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <BrandName className="font-extrabold text-xl tracking-tight text-white" />
            <p className="text-slate-400 leading-relaxed text-xs">
              Kenya’s premier intercity and regional passenger shuttle network servicing Rongai, Kiserian, Narok, Bomet, Kisii and beyond.
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-amber-400">
              <Shield className="w-3.5 h-3.5" />
              <span>NTSA Licensed PSV Operator</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-amber-400 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('search')} className="hover:text-amber-400 transition-colors">
                  Book Seats
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('routes')} className="hover:text-amber-400 transition-colors">
                  Routes & Schedules
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-amber-400 transition-colors">
                  Fleet Showcase
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('tracking')} className="hover:text-amber-400 transition-colors">
                  Live Bus Tracking
                </button>
              </li>
            </ul>
          </div>

          {/* Passenger Support */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Passenger Support</h4>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onNavigate('retrieve-ticket')} className="hover:text-amber-400 transition-colors">
                  Retrieve Digital Ticket
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-amber-400 transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-amber-400 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-amber-400 transition-colors">
                  About the Company
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Direct Dispatch</h4>
            <div className="space-y-2 text-slate-300 font-mono text-[11px]">
              <p>Hotline: <a href="tel:+254724626199" className="text-amber-400 font-bold hover:underline">+254 724 626199</a></p>
              <p>Logistics: <a href="tel:+254717747626" className="text-amber-400 font-bold hover:underline">+254 717 747626</a></p>
              <p className="text-slate-400 font-sans text-xs pt-1">Terminals in Rongai, Kiserian & Kisii Main Stage.</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} TransCar Galaxy Shuttle Transport. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono">Engineered with precision for Kenyan transit</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
