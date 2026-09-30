import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  PhoneCall,
  HelpCircle,
  Mail,
  MapPin,
  Menu,
  X,
  Package,
} from 'lucide-react';
import { BrandName } from '../common/BrandName';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { MobileMenuDropdown } from './MobileMenuDropdown';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNav = (view: string) => {
    setMenuOpen(false);
    setCurrentView(view);
  };

  return (
    <header className="sticky top-0 z-[1000] bg-white border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Left: Brand Logo Only */}
          <button
            id="brand-logo-btn"
            type="button"
            onClick={() => handleNav('home')}
            className="inline-flex items-center text-left min-h-[44px] px-1 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-transform active:scale-[0.99] shrink-0 min-w-0 cursor-pointer"
          >
            <BrandName className="font-extrabold text-base sm:text-lg tracking-tight text-slate-950" />
          </button>

          {/* Right: PWAInstallButton + Hamburger Button Only */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />

            <div ref={menuRef} className="relative">
              <button
                id="services-dashboard-dropdown-btn"
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu-dropdown"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                  menuOpen
                    ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
                }`}
              >
                {menuOpen ? (
                  <X className="w-5 h-5 text-slate-950 shrink-0" />
                ) : (
                  <Menu className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <span>Menu</span>
              </button>

              <MobileMenuDropdown
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                currentView={currentView}
                onNavigate={handleNav}
                userRole={userRole}
                onLogout={onLogout}
                driverName={driverName}
                managerName={managerName}
                onOpenTutorial={onOpenTutorial}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Footer: React.FC<{
  onNavigate: (view: string) => void;
  onOpenTutorial?: () => void;
}> = ({ onNavigate, onOpenTutorial }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs mt-auto w-full max-w-[100vw] overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Trust & Parcel Services Summary Strip (Moved off Homepage) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 border-b border-slate-800/80">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>NTSA Regulated Passenger Safety</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calibrated 80 km/h speed governors, real-time GPS tracking, and licensed PSV captains across all Rongai, Nairobi, and Kisii corridors.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Package className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Same-Day Express Parcel & Courier</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dispatched daily along the Nairobi · Rongai · Kisii corridor with SMS collection verification. Parcel Desk: +254 717 747626.
            </p>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-slate-800/80">
          {/* 1. Brand Info */}
          <div className="space-y-3">
            <BrandName className="font-extrabold text-xl tracking-tight text-white" />
            <p className="text-slate-300 font-semibold text-xs leading-snug">
              Premier Intercity & Rongai Regional Express Transportation
            </p>
            <p className="text-slate-400 leading-relaxed text-xs">
              Daily express passenger shuttles connecting Ongata Rongai, Nairobi, Ngong, Kiserian, Kisii, Rongo, Awendo, Migori, Sirare, and Kehancha.
            </p>
          </div>

          {/* 2. Passenger Links */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Passenger Links</h4>
            <div className="grid grid-cols-1 gap-1">
              <button
                type="button"
                onClick={() => onNavigate('search')}
                className="w-full min-h-[44px] text-left flex items-center hover:text-amber-400 transition-colors cursor-pointer"
              >
                Find a Trip
              </button>
              <button
                type="button"
                onClick={() => onNavigate('routes')}
                className="w-full min-h-[44px] text-left flex items-center hover:text-amber-400 transition-colors cursor-pointer"
              >
                Routes & Corridors
              </button>
              <button
                type="button"
                onClick={() => onNavigate('schedules')}
                className="w-full min-h-[44px] text-left flex items-center hover:text-amber-400 transition-colors cursor-pointer"
              >
                Schedules
              </button>
              <button
                type="button"
                onClick={() => onNavigate('fleet')}
                className="w-full min-h-[44px] text-left flex items-center hover:text-amber-400 transition-colors cursor-pointer"
              >
                Fleet (11, 14 & 16-Seater)
              </button>
              {onOpenTutorial && (
                <button
                  type="button"
                  onClick={onOpenTutorial}
                  className="w-full min-h-[44px] text-left flex items-center gap-1.5 text-amber-400 font-semibold hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>How It Works / FAQ Guide</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Support & Contact */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Support & Contact</h4>
            <div className="space-y-2 text-slate-300 text-xs">
              <a
                href="tel:+254724626199"
                className="w-full min-h-[44px] flex items-center gap-2 font-mono text-amber-400 font-bold hover:underline"
              >
                <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                <span>Primary: +254 724 626199</span>
              </a>
              <a
                href="tel:+254717747626"
                className="w-full min-h-[44px] flex items-center gap-2 font-mono text-slate-200 font-semibold hover:text-amber-400 hover:underline"
              >
                <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Parcel: +254 717 747626</span>
              </a>
              <a
                href="mailto:support@transcarrongai.co.ke"
                className="w-full min-h-[44px] flex items-center gap-2 hover:text-amber-400 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">support@transcarrongai.co.ke</span>
              </a>
              <p className="flex items-start gap-2 text-slate-400 pt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Next to Isalu Center (Ongata Rongai), Nairobi Central & Kisii Main Stage.</span>
              </p>
            </div>
          </div>

          {/* 4. Manage Booking & Staff Access */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Manage & Staff</h4>
            <div className="grid grid-cols-1 gap-1">
              <button
                type="button"
                onClick={() => onNavigate('retrieve-ticket')}
                className="w-full min-h-[44px] text-left flex items-center hover:text-amber-400 transition-colors cursor-pointer"
              >
                Retrieve Boarding Pass
              </button>
              <button
                type="button"
                onClick={() => onNavigate('tracking')}
                className="w-full min-h-[44px] text-left flex items-center hover:text-amber-400 transition-colors cursor-pointer"
              >
                Live Bus Tracking
              </button>
              <button
                type="button"
                onClick={() => onNavigate('terms')}
                className="w-full min-h-[44px] text-left flex items-center hover:text-amber-400 transition-colors cursor-pointer"
              >
                Terms & Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => onNavigate('driver-login')}
                className="w-full min-h-[44px] text-left flex items-center text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                Driver Portal
              </button>
              <button
                type="button"
                onClick={() => onNavigate('manager-login')}
                className="w-full min-h-[44px] text-left flex items-center text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                Manager Portal
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} TransCar Rongai Ltd. All rights reserved.</p>
          <span>NTSA Licensed PSV Operator</span>
        </div>
      </div>
    </footer>
  );
};
