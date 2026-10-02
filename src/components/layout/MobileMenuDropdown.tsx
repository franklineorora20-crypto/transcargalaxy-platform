import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Sparkles,
  ChevronRight,
  X,
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
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside of the menu container or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const hamburger = document.getElementById('main-hamburger-menu-btn');
      if (hamburger && hamburger.contains(target)) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Lock background scroll on small viewports while menu is open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 640) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

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
    {
      id: 'header-find-trip-btn',
      view: 'search',
      label: 'Book a Trip',
      icon: Search,
      isActive: currentView === 'search' || currentView === 'booking',
    },
    { id: 'nav-routes', view: 'routes', label: 'Corridor Routes', icon: MapPin },
    { id: 'nav-schedules', view: 'schedules', label: 'Departure Schedules', icon: Clock },
    { id: 'nav-tracking', view: 'tracking', label: 'Live Bus Tracking', icon: Navigation },
    { id: 'nav-boarding-pass', view: 'retrieve-ticket', label: 'Retrieve Boarding Pass', icon: Ticket },
    { id: 'nav-fleet', view: 'fleet', label: 'Fleet (11, 14 & 16-Seater)', icon: Bus },
    { id: 'nav-safety', view: 'safety', label: 'Safety & Compliance', icon: Shield },
    { id: 'nav-services', view: 'services', label: 'Parcel & Charter Services', icon: Sparkles },
    { id: 'nav-contact', view: 'about', label: 'About & Terminals', icon: PhoneCall },
    { id: 'nav-terms', view: 'terms', label: 'Terms & Conditions', icon: FileText },
  ];

  const dropdownContent = (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Frosted Glass Dimmed Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="pointer-events-auto fixed inset-0 bg-slate-950/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      {/* Responsive Glassmorphic Dropdown Panel (works across phones, tablets, laptops & desktops) */}
      <div
        ref={menuRef}
        id="mobile-menu-dropdown"
        role="dialog"
        aria-modal="true"
        aria-label="TransCar Navigation Menu"
        className="pointer-events-auto fixed left-3 right-3 top-16 max-h-[calc(100dvh-5rem)] sm:left-auto sm:right-4 lg:right-8 sm:top-[4.5rem] sm:w-[380px] sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100dvh-5.5rem)] rounded-2xl sm:rounded-3xl bg-white/90 supports-[backdrop-filter]:bg-white/85 backdrop-blur-2xl text-slate-900 border border-white/80 ring-1 ring-slate-900/10 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25)] overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header Row inside Dropdown */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
          <div>
            <span className="text-xs font-extrabold text-slate-900 tracking-tight block">
              Passenger & Fleet Directory
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              NTSA Licensed Express Network
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="min-h-[38px] min-w-[38px] rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-950 flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="space-y-1">
          <div className="grid grid-cols-1 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive !== undefined ? item.isActive : currentView === item.view;
              return (
                <button
                  key={item.id}
                  id={item.id}
                  type="button"
                  onClick={() => handleSelect(item.view)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between text-left transition-all cursor-pointer touch-manipulation ${
                    active
                      ? 'bg-slate-950 text-amber-400 shadow-sm border border-slate-900'
                      : 'text-slate-800 hover:bg-slate-900/5 active:bg-slate-900/10 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-400' : 'text-amber-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 opacity-40 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                </button>
              );
            })}

            {onOpenTutorial && (
              <button
                id="header-help-tutorial-btn"
                type="button"
                onClick={handleTutorial}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between text-left text-slate-800 hover:bg-slate-900/5 active:bg-slate-900/10 transition-all cursor-pointer touch-manipulation border border-transparent"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">How Booking Works Guide</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 opacity-40" />
              </button>
            )}
          </div>
        </div>

        {/* Staff Portals Section */}
        <div className="pt-3 border-t border-slate-200/70 space-y-2">
          <div className="px-1 text-[11px] font-bold text-slate-500">
            Authorized Staff Portals
          </div>

          {userRole === 'CUSTOMER_PUBLIC' ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                id="driver-login-dropdown-btn"
                type="button"
                onClick={() => handleSelect('driver-login')}
                className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-bold bg-white/80 hover:bg-white active:bg-slate-100 text-slate-900 border border-slate-200/90 shadow-xs flex items-center justify-between transition-all cursor-pointer touch-manipulation"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">Driver Login</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 opacity-50" />
              </button>

              <button
                id="staff-login-dropdown-btn"
                type="button"
                onClick={() => handleSelect('manager-login')}
                className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-bold bg-white/80 hover:bg-white active:bg-slate-100 text-slate-900 border border-slate-200/90 shadow-xs flex items-center justify-between transition-all cursor-pointer touch-manipulation"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="w-4 h-4 text-slate-700 shrink-0" />
                  <span className="truncate">Manager Login</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 opacity-50" />
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-950/95 backdrop-blur-md text-white rounded-2xl space-y-3 shadow-md border border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-amber-400 block">
                    {userRole === 'DRIVER' ? 'Driver Cockpit Active' : 'Manager Portal Active'}
                  </span>
                  <span className="text-[11px] text-slate-300 font-medium truncate block">
                    {userRole === 'DRIVER' ? driverName || 'Assigned Captain' : managerName || 'Operations Manager'}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-emerald-400 shrink-0">
                  ● Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    handleSelect(userRole === 'DRIVER' ? 'driver-portal' : 'manager-portal')
                  }
                  className="craft-btn-amber text-xs py-2 px-3 font-extrabold min-h-[42px] flex items-center justify-center cursor-pointer rounded-xl whitespace-nowrap"
                >
                  <span>Open Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="text-xs py-2 px-3 text-rose-300 hover:text-white border border-slate-800 bg-slate-900 hover:bg-rose-500/20 min-h-[42px] flex items-center justify-center gap-1.5 cursor-pointer rounded-xl font-bold transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(dropdownContent, document.body);
};
