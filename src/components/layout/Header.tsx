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
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 text-neutral-900 shadow-sm">
      <div className="bg-neutral-950 text-neutral-200 text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center sm:justify-between gap-3 text-center">
          <span>Call: <a href="tel:+254724626199" className="font-bold text-white hover:text-amber-300">+254 724 626199</a></span>
          <span className="hidden sm:inline text-neutral-600">|</span>
          <span className="hidden sm:inline">M-Pesa Till: XXXXX</span>
          <span className="hidden sm:inline text-neutral-600">|</span>
          <span className="font-semibold text-amber-300">Departure 1AM Daily</span>
        </div>
      </div>
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <button
            id="brand-logo-btn"
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="flex flex-col group-hover:scale-[1.02] transition-transform">
              <BrandName className="font-extrabold text-2xl tracking-tight text-neutral-950 font-serif" />
              <p className="text-[11px] text-neutral-500 font-medium tracking-wide mt-1">
                Intercity & Rongai Regional Express
              </p>
            </div>
          </button>

          {/* Right Side Navigation & Actions */}
          <div className="flex items-center gap-4 lg:gap-8">
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
              id="nav-home"
              onClick={() => handleNav('home')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'home'
                  ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-400/20'
                  : 'text-neutral-700 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => handleNav('routes')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'routes' ? 'bg-amber-400 text-black font-bold' : 'text-neutral-700 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              Routes
            </button>

            <button
              type="button"
              onClick={() => handleNav('services')}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-neutral-700 hover:text-amber-700 hover:bg-amber-50 transition-all"
            >
              Fleet
            </button>

            <a
              href="tel:+254724626199"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-neutral-700 hover:text-amber-700 hover:bg-amber-50 transition-all"
            >
              Contact
            </a>

            <div className="relative group">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={servicesOpen}
                onClick={() => setServicesOpen((open) => !open)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  ['search', 'booking', 'tracking', 'retrieve-ticket', 'routes', 'services', 'about'].includes(currentView)
                    ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-400/20'
                    : 'text-neutral-700 hover:text-amber-700 hover:bg-amber-50'
                }`}
              >
                Services
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              
              <div className={`absolute top-full left-0 w-56 pt-2 transition-all duration-200 z-50 ${servicesOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
                <div className="bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden flex flex-col py-2">
                  <button
                    onClick={() => handleNav('search')}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors w-full text-left ${
                      currentView === 'search' || currentView === 'booking'
                        ? 'bg-neutral-900 text-amber-400'
                        : 'text-neutral-700 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    <Search className={`w-4 h-4 ${currentView === 'search' || currentView === 'booking' ? 'text-amber-400' : 'text-neutral-400'}`} />
                    Book Journey
                  </button>

                  <button
                    onClick={() => handleNav('tracking')}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors w-full text-left ${
                      currentView === 'tracking'
                        ? 'bg-neutral-900 text-amber-400'
                        : 'text-neutral-700 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    <Navigation className={`w-4 h-4 ${currentView === 'tracking' ? 'text-amber-400' : 'text-neutral-400'}`} />
                    Track Bus
                  </button>

                  <button
                    onClick={() => handleNav('retrieve-ticket')}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors w-full text-left ${
                      currentView === 'retrieve-ticket'
                        ? 'bg-neutral-900 text-amber-400'
                        : 'text-neutral-700 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    <Ticket className={`w-4 h-4 ${currentView === 'retrieve-ticket' ? 'text-amber-400' : 'text-neutral-400'}`} />
                    My Trips & Tickets
                  </button>

                  <div className="h-px bg-neutral-800 my-1 mx-2"></div>

                  <button
                    onClick={() => handleNav('routes')}
                    className={`px-4 py-2.5 text-sm font-semibold transition-colors w-full text-left ${
                      currentView === 'routes'
                        ? 'bg-neutral-900 text-amber-400'
                        : 'text-neutral-700 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    Routes & Fares
                  </button>

                  <button
                    onClick={() => handleNav('services')}
                    className={`px-4 py-2.5 text-sm font-semibold transition-colors w-full text-left ${
                      currentView === 'services'
                        ? 'bg-neutral-900 text-amber-400'
                        : 'text-neutral-700 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    Our Services
                  </button>

                  <button
                    onClick={() => handleNav('about')}
                    className={`px-4 py-2.5 text-sm font-semibold transition-colors w-full text-left ${
                      currentView === 'about'
                        ? 'bg-neutral-900 text-amber-400'
                        : 'text-neutral-700 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    About Us
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* User Role Portals & Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            {userRole === 'DRIVER' ? (
              <div className="flex items-center gap-2">
                <button
                  id="driver-portal-btn"
                  onClick={() => handleNav('driver-portal')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 hover:bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shadow-sm transition-all"
                >
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>Driver Cockpit ({driverName || 'John Mwangi'})</span>
                </button>
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 rounded-lg bg-neutral-100 hover:bg-amber-50 text-neutral-500 hover:text-amber-700 transition-colors border border-neutral-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : userRole === 'MANAGER' ? (
              <div className="flex items-center gap-2">
                <button
                  id="manager-portal-btn"
                  onClick={() => handleNav('manager-portal')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-sm font-black shadow-md shadow-amber-400/20 transition-all"
                >
                  <Lock className="w-4 h-4 text-black" />
                  <span>Manager Portal</span>
                </button>
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 rounded-lg bg-neutral-100 hover:bg-amber-50 text-neutral-500 hover:text-amber-700 transition-colors border border-neutral-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="header-book-now-btn"
                  onClick={() => handleNav('search')}
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-sm font-black shadow-sm transition-all"
                >
                  Book Now
                </button>
                <button
                  id="login-driver-btn"
                  onClick={() => handleNav('driver-login')}
                  className="px-2 py-1 text-neutral-600 hover:text-amber-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Driver Login</span>
                </button>
                <button
                  id="login-manager-btn"
                  onClick={() => handleNav('manager-login')}
                  className="px-2 py-1 text-neutral-600 hover:text-amber-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Manager Login</span>
                </button>
              </div>
            )}
          </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-neutral-100 text-neutral-700 hover:text-amber-700 border border-neutral-200 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-neutral-200 px-4 pt-2 pb-6 space-y-2 shadow-lg">
          <button
            onClick={() => handleNav('home')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-amber-50 hover:text-amber-700"
          >
            Home
          </button>
          <button
            onClick={() => handleNav('search')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-amber-400" /> Book Journey
          </button>
          <button
            onClick={() => handleNav('tracking')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2"
          >
            <Navigation className="w-4 h-4 text-amber-400" /> Track My Bus
          </button>
          <button
            onClick={() => handleNav('retrieve-ticket')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2"
          >
            <Ticket className="w-4 h-4 text-amber-400" /> My Trips & Tickets
          </button>
          <button
            onClick={() => handleNav('routes')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-amber-50 hover:text-amber-700"
          >
            Routes & Schedules
          </button>
          <button
            onClick={() => handleNav('services')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-neutral-800 hover:bg-amber-50 hover:text-amber-700"
          >
            Services & Parcel Cargo
          </button>
          <button
            onClick={() => handleNav('about')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-white hover:bg-neutral-900 hover:text-amber-400"
          >
            About & Corporate
          </button>

          <div className="pt-4 border-t border-neutral-800 space-y-2">
            {userRole === 'DRIVER' ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleNav('driver-portal')}
                  className="w-full py-2.5 px-4 bg-neutral-900 border border-amber-400/50 text-amber-400 rounded-lg font-bold text-sm text-center"
                >
                  Driver Cockpit ({driverName})
                </button>
                <button
                  onClick={onLogout}
                  className="w-full py-2 px-4 bg-neutral-900 text-neutral-300 rounded-lg font-semibold text-sm text-center"
                >
                  Logout
                </button>
              </div>
            ) : userRole === 'MANAGER' ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleNav('manager-portal')}
                  className="w-full py-2.5 px-4 bg-amber-400 text-black rounded-lg font-extrabold text-sm text-center shadow-md"
                >
                  Manager Portal
                </button>
                <button
                  onClick={onLogout}
                  className="w-full py-2 px-4 bg-neutral-900 text-neutral-300 rounded-lg font-semibold text-sm text-center"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleNav('driver-login')}
                  className="py-2.5 px-3 bg-neutral-900 border border-neutral-700 text-white rounded-lg text-xs font-semibold text-center hover:border-amber-400"
                >
                  Driver Login
                </button>
                <button
                  onClick={() => handleNav('manager-login')}
                  className="py-2.5 px-3 bg-amber-400 text-black font-black rounded-lg text-xs text-center shadow-sm"
                >
                  Manager Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export const Footer: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-black text-neutral-300 border-t-2 border-amber-500/30 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company Bio */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <BrandName className="font-extrabold text-2xl tracking-tight text-white font-serif" />
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed pr-6">
              East Africa's premier scheduled passenger coach and Rongai regional express service.
              Connecting Rongai, Kiserian, Ngong, Suswa, Kisii, Kisumu with speed-governed,
              telematics-monitored executive vehicles.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="px-3 py-1.5 rounded-md bg-amber-400 text-black text-xs font-black shadow-sm">
                NTSA Compliant
              </div>
              <div className="px-3 py-1.5 rounded-md bg-white text-black text-xs font-black shadow-sm">
                M-Pesa 247247 Paybill
              </div>
              <div className="px-3 py-1.5 rounded-md bg-neutral-900 border border-amber-400 text-amber-400 text-xs font-black shadow-sm">
                GPS Live Telematics
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-amber-400 font-extrabold text-xs uppercase tracking-widest">Passenger Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onNavigate('search')} className="text-white hover:text-amber-400 transition-colors">
                  Search & Book Seats
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('tracking')} className="text-white hover:text-amber-400 transition-colors">
                  Live Bus Tracking
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('retrieve-ticket')} className="text-white hover:text-amber-400 transition-colors">
                  My Trips & Tickets
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('routes')} className="text-white hover:text-amber-400 transition-colors">
                  Timetables & Fares
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="text-white hover:text-amber-400 transition-colors">
                  Parcel & Cargo Logistics
                </button>
              </li>
            </ul>
          </div>

          {/* Regional Terminals */}
          <div className="space-y-3">
            <h4 className="text-amber-400 font-extrabold text-xs uppercase tracking-widest">Main Terminals</h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li>
                <span className="text-white font-bold">Rongai Terminal:</span> Maasai Mall Stage
              </li>
              <li>
                <span className="text-white font-bold">Kisii Central:</span> Kisii Central Shuttle Station
              </li>
              <li>
                <span className="text-white font-bold">Kisumu Western:</span> Mega Plaza Station
              </li>
            </ul>
          </div>

          {/* Portals & Governance */}
          <div className="space-y-3">
            <h4 className="text-amber-400 font-extrabold text-xs uppercase tracking-widest">Internal Portals</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onNavigate('driver-login')} className="text-white hover:text-amber-400 transition-colors flex items-center gap-1.5 font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Driver Operations Portal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('manager-login')} className="text-white hover:text-amber-400 transition-colors flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Manager Executive Portal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="text-neutral-300 hover:text-white transition-colors">
                  Fleet Safety Standards
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('policies')} className="text-neutral-300 hover:text-white transition-colors">
                  Luggage & Refund Policies
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-neutral-300">© {new Date().getFullYear()} TransCar rongai Ltd. All rights reserved.</p>
            <span className="hidden sm:inline text-neutral-600">•</span>
            <span className="text-amber-400 font-mono text-[11px] bg-neutral-900 px-2.5 py-0.5 rounded-md border border-amber-400/40 font-bold">
              Domain: transcarrongai.co.ke
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button onClick={() => onNavigate('policies')} className="text-neutral-300 hover:text-amber-400 transition-colors">
              Policies
            </button>
            <button onClick={() => onNavigate('terms')} className="text-white hover:text-amber-400 font-bold transition-colors">
              Terms & Conditions
            </button>
            <button onClick={() => onNavigate('privacy')} className="text-white hover:text-amber-400 font-bold transition-colors">
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
