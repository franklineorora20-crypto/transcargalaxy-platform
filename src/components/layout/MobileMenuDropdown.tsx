import React, { useEffect, useRef } from 'react';
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

  // Close when clicking outside of the menu container
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      // If clicking inside menu or the hamburger button, don't trigger outside click
      const hamburger = document.getElementById('main-hamburger-menu-btn');
      if (hamburger && hamburger.contains(event.target as Node)) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Lock background scroll on mobile while menu is open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

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

  return (
    <>
      {/* Dimmed Backdrop for smooth modal/dropdown dismiss */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 top-14 sm:top-16 bg-slate-950/40 backdrop-blur-[2px] z-[9998] transition-opacity animate-in fade-in duration-150"
      />

      {/* Dropdown Container */}
      <div
        ref={menuRef}
        id="mobile-menu-dropdown"
        role="dialog"
        aria-modal="true"
        aria-label="TransCar Navigation Menu"
        className="fixed inset-x-0 top-14 sm:top-16 bottom-0 w-full max-w-full bg-white text-slate-900 border-t border-slate-200 overflow-y-auto z-[9999] shadow-2xl p-4 sm:p-5 space-y-4 animate-in slide-in-from-top-2 duration-150 md:fixed md:inset-auto md:top-16 md:right-4 lg:md:right-8 md:w-[320px] md:max-w-[calc(100vw-32px)] md:max-h-[calc(100vh-5rem)] md:rounded-2xl md:border md:shadow-2xl md:p-3"
      >
        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Passenger Services
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
              NTSA Certified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-1">
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
                      : 'text-slate-800 hover:bg-slate-100/90 active:bg-slate-200/80 border border-transparent'
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
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between text-left text-slate-800 hover:bg-slate-100/90 active:bg-slate-200/80 transition-all cursor-pointer touch-manipulation border border-transparent"
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

        {/* Staff Access Section */}
        <div className="pt-3 border-t border-slate-200 space-y-2 pb-6 md:pb-1">
          <div className="px-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Staff Portals
          </div>

          {userRole === 'CUSTOMER_PUBLIC' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
              <button
                id="driver-login-dropdown-btn"
                type="button"
                onClick={() => handleSelect('driver-login')}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-50 hover:bg-slate-100 active:bg-slate-200/80 text-slate-900 border border-slate-200 flex items-center justify-between transition-all cursor-pointer touch-manipulation"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Driver Login</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 opacity-40" />
              </button>

              <button
                id="staff-login-dropdown-btn"
                type="button"
                onClick={() => handleSelect('manager-login')}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-50 hover:bg-slate-100 active:bg-slate-200/80 text-slate-900 border border-slate-200 flex items-center justify-between transition-all cursor-pointer touch-manipulation"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>Manager Login</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 opacity-40" />
              </button>
            </div>
          ) : (
            <div className="p-3 bg-slate-950 text-white rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-400 block">
                    {userRole === 'DRIVER' ? 'Driver Cockpit Active' : 'Manager Portal Active'}
                  </span>
                  <span className="text-[11px] text-slate-300 font-semibold truncate block max-w-[200px]">
                    {userRole === 'DRIVER' ? driverName || 'Frankline Orora' : managerName || 'Executive Director'}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-mono font-bold">
                  Online
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleSelect(userRole === 'DRIVER' ? 'driver-portal' : 'manager-portal')
                  }
                  className="craft-btn-amber text-xs py-2 px-3 font-black min-h-[44px] flex items-center justify-center cursor-pointer rounded-xl"
                >
                  <span>Open Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="craft-btn-secondary text-xs py-2 px-3 text-red-400 border-slate-800 bg-slate-900 hover:bg-red-500/10 min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer rounded-xl font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
