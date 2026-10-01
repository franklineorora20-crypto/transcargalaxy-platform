import React, { useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  PhoneCall,
  Bus,
  Shield,
  Sparkles,
  Info,
  Lock,
  UserCheck,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react';

interface MobileMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
  userRole: 'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER';
  onLogout: () => void;
  driverName?: string;
  managerName?: string;
}

export const MobileMenuDropdown: React.FC<MobileMenuDropdownProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentView,
  userRole,
  onLogout,
  driverName,
  managerName,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent background scroll on mobile when open
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLinkClick = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const handleContactClick = () => {
    onClose();
    const footerEl = document.querySelector('footer');
    if (footerEl) {
      footerEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = 'tel:+254724626199';
    }
  };

  const navLinks = [
    { id: 'routes', label: 'Routes', icon: MapPin, action: () => handleLinkClick('routes') },
    { id: 'search', label: 'Book', icon: Search, action: () => handleLinkClick('search') },
    { id: 'tracking', label: 'Track', icon: Navigation, action: () => handleLinkClick('tracking') },
    { id: 'contact', label: 'Contact', icon: PhoneCall, action: handleContactClick },
    { id: 'fleet', label: 'Fleet', icon: Bus, action: () => handleLinkClick('fleet') },
    { id: 'safety', label: 'Safety', icon: Shield, action: () => handleLinkClick('safety') },
    { id: 'services', label: 'Services', icon: Sparkles, action: () => handleLinkClick('services') },
    { id: 'about', label: 'About', icon: Info, action: () => handleLinkClick('about') },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dropdown Container */}
      <div
        ref={dropdownRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site Navigation Menu"
        className={`
          z-50 bg-white shadow-xl border border-slate-200 transition-all duration-150
          /* Mobile full menu layout */
          fixed inset-0 top-14 sm:top-16 w-full h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] overflow-y-auto p-4 pb-28
          /* Desktop compact dropdown layout */
          md:absolute md:right-4 lg:md:right-8 md:top-full md:mt-2 md:w-[280px] md:max-w-[calc(100vw-32px)] md:h-auto md:max-h-[85vh] md:rounded-2xl md:p-2 md:shadow-xl
        `}
      >
        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === 'search' && currentView === 'booking');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className={`
                    w-full min-h-[44px] px-4 py-3 rounded-xl text-left text-sm font-bold flex items-center justify-between transition-colors cursor-pointer touch-manipulation
                    ${
                      isActive
                        ? 'bg-slate-950 text-amber-400 font-extrabold shadow-sm'
                        : 'text-slate-800 hover:bg-slate-50 active:bg-slate-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-amber-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 opacity-40 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Staff Access Section */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
          <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Staff Access
          </div>

          {userRole !== 'CUSTOMER_PUBLIC' ? (
            <div className="p-3 bg-slate-950 text-white rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-400 block">
                    {userRole === 'DRIVER' ? 'Driver Portal Active' : 'Manager Portal Active'}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    {userRole === 'DRIVER' ? driverName || 'Driver' : managerName || 'Manager'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleLinkClick(userRole === 'DRIVER' ? 'driver-portal' : 'manager-portal')}
                  className="craft-btn-amber text-xs py-2 px-2.5 font-bold min-h-[44px] flex items-center justify-center cursor-pointer"
                >
                  <span>Open Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="craft-btn-secondary text-xs py-2 px-2.5 text-red-500 border-slate-800 bg-slate-900 hover:bg-red-500/10 min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-1.5">
              <button
                type="button"
                id="menu-manager-login-btn"
                onClick={() => handleLinkClick('manager-login')}
                className="w-full min-h-[44px] px-4 py-3 rounded-xl text-left text-sm font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 flex items-center justify-between transition-colors cursor-pointer touch-manipulation"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>Manager Login</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                id="menu-driver-login-btn"
                onClick={() => handleLinkClick('driver-login')}
                className="w-full min-h-[44px] px-4 py-3 rounded-xl text-left text-sm font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 flex items-center justify-between transition-colors cursor-pointer touch-manipulation"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Driver Login</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
