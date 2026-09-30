import React from 'react';
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
  HelpCircle,
  Clock,
  Bus,
  MapPin,
  Home,
} from 'lucide-react';

export interface MobileMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  userRole: 'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER';
  onLogout: () => void;
  driverName?: string;
  managerName?: string;
  onOpenTutorial?: () => void;
}

export const MobileMenuDropdown: React.FC<MobileMenuDropdownProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  userRole,
  onLogout,
  driverName,
  managerName,
  onOpenTutorial,
}) => {
  if (!isOpen) return null;

  const handleSelect = (view: string) => {
    onClose();
    onNavigate(view);
  };

  const handleTutorial = () => {
    onClose();
    if (onOpenTutorial) {
      onOpenTutorial();
    }
  };

  const navItems = [
    { id: 'nav-home', view: 'home', label: 'Home', icon: Home },
    { id: 'header-find-trip-btn', view: 'search', label: 'Book a Trip', icon: Search },
    { id: 'nav-routes', view: 'routes', label: 'Routes', icon: MapPin },
    { id: 'nav-schedules', view: 'schedules', label: 'Schedules', icon: Clock },
    { id: 'nav-tracking', view: 'tracking', label: 'Track Bus', icon: Navigation },
    { id: 'nav-boarding-pass', view: 'retrieve-ticket', label: 'Boarding Pass', icon: Ticket },
    { id: 'nav-fleet', view: 'fleet', label: 'Fleet (11, 14 & 16-Seater)', icon: Bus },
    { id: 'nav-safety', view: 'safety', label: 'Safety Standards', icon: Shield },
    { id: 'nav-services', view: 'services', label: 'Parcel & Charter', icon: Bus },
    { id: 'nav-contact', view: 'about', label: 'Contact & About', icon: PhoneCall },
    { id: 'nav-terms', view: 'terms', label: 'Terms & Policies', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Backdrop below header */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-x-0 top-14 bottom-0 bg-slate-950/40 backdrop-blur-[1px] z-[9998] md:hidden"
      />

      {/* Dropdown Menu: Fixed full-screen below header on mobile, absolute 280px right-aligned card on desktop */}
      <div
        id="mobile-menu-dropdown"
        role="menu"
        aria-label="Navigation Menu"
        className="fixed top-14 left-0 right-0 bottom-0 w-full max-w-[100vw] border-t border-slate-200 md:absolute md:top-full md:left-auto md:right-0 md:bottom-auto md:mt-2 md:w-[280px] md:min-w-[280px] md:max-w-[calc(100vw-32px)] md:max-h-[calc(100vh-5rem)] md:rounded-2xl md:border bg-white text-slate-900 overflow-y-auto shadow-2xl z-[9999] p-4 space-y-4"
      >
      {/* Navigation Links */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 pb-1">
          Passenger Navigation
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.view;
            return (
              <button
                key={item.view}
                id={item.id}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(item.view)}
                className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-amber-400'
                    : 'text-slate-800 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {onOpenTutorial && (
            <button
              id="header-help-tutorial-btn"
              type="button"
              role="menuitem"
              onClick={handleTutorial}
              className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-left text-slate-800 hover:bg-slate-100 border border-slate-100 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">How It Works Guide</span>
            </button>
          )}
        </div>
      </div>

      {/* Staff Access Section */}
      <div className="pt-3 border-t border-slate-200 space-y-2 pb-4 md:pb-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
          Staff Access
        </div>

        {userRole === 'CUSTOMER_PUBLIC' ? (
          <div className="grid grid-cols-1 gap-2">
            <button
              id="driver-login-dropdown-btn"
              type="button"
              role="menuitem"
              onClick={() => handleSelect('driver-login')}
              className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Driver Login</span>
            </button>
            <button
              id="staff-login-dropdown-btn"
              type="button"
              role="menuitem"
              onClick={() => handleSelect('manager-login')}
              className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4 text-slate-700 shrink-0" />
              <span>Manager Login</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                handleSelect(userRole === 'DRIVER' ? 'driver-portal' : 'manager-portal')
              }
              className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-amber-400 flex items-center justify-between cursor-pointer"
            >
              <span className="truncate">
                {userRole === 'DRIVER'
                  ? driverName || 'Driver Portal'
                  : managerName || 'Manager Portal'}
              </span>
              <span className="text-[10px] uppercase tracking-wider">Open</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
