import React, { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { BrandName } from '../common/BrandName';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { MobileMenuDropdown } from './MobileMenuDropdown';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  userRole: 'CUSTOMER_PUBLIC' | 'DRIVER' | 'MANAGER';
  onLogout: () => void;
  driverName?: string;
  managerName?: string;
  onOpenTutorial?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  userRole,
  onLogout,
  driverName,
  managerName,
  onOpenTutorial,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = (view: string) => {
    setIsMenuOpen(false);
    setCurrentView(view);
  };

  const primaryNavLinks = [
    { view: 'home', label: 'Home' },
    { view: 'search', label: 'Book Seat', activeMatch: ['search', 'booking'] },
    { view: 'schedules', label: 'Schedules' },
    { view: 'tracking', label: 'Live Track' },
    { view: 'retrieve-ticket', label: 'My Ticket' },
  ];

  return (
    <header className="sticky top-0 z-40 relative">
      {/* Frosted Glass Surface Layer (kept separate so fixed children/portals are never trapped by backdrop-filter) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-white/80 supports-[backdrop-filter]:bg-white/75 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_4px_24px_-6px_rgba(15,23,42,0.06)]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Zone 1: Brand Wordmark */}
          <button
            id="brand-logo-btn"
            type="button"
            onClick={() => handleNavigate('home')}
            className="flex items-center text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl py-1 px-1 -ml-1 cursor-pointer shrink-0"
          >
            <BrandName className="font-extrabold text-base sm:text-lg tracking-tight text-slate-950" />
          </button>

          {/* Zone 2: Clean Desktop Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600"
          >
            {primaryNavLinks.map((item) => {
              const isActive = item.activeMatch
                ? item.activeMatch.includes(currentView)
                : currentView === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleNavigate(item.view)}
                  className={`py-1.5 transition-colors cursor-pointer whitespace-nowrap relative ${
                    isActive
                      ? 'text-slate-950 font-bold after:content-[""] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-amber-400 after:rounded-full'
                      : 'hover:text-slate-950'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions & Universal All-Device Dropdown Trigger */}
          <div className="flex items-center gap-2">
            <PWAInstallButton variant="header" />

            <button
              id="main-hamburger-menu-btn"
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
              aria-haspopup="dialog"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                isMenuOpen
                  ? 'bg-slate-950 text-amber-400 border-slate-950 shadow-sm'
                  : 'bg-white/70 hover:bg-white text-slate-800 hover:text-slate-950 border-slate-200/90 shadow-xs'
              }`}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 shrink-0" />
              ) : (
                <Menu className="w-5 h-5 shrink-0" />
              )}
              <span className="hidden sm:inline whitespace-nowrap">Menu</span>
              <ChevronDown
                className={`hidden sm:inline w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                  isMenuOpen ? 'rotate-180 text-amber-400' : 'text-slate-400'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Universal Responsive Navigation Dropdown */}
      <MobileMenuDropdown
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigate}
        currentView={currentView}
        userRole={userRole}
        onLogout={onLogout}
        driverName={driverName}
        managerName={managerName}
        onOpenTutorial={onOpenTutorial}
      />
    </header>
  );
};
