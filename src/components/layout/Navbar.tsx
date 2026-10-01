import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BrandName } from '../common/BrandName';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { MobileMenuDropdown } from '../common/MobileMenuDropdown';

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
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = (view: string) => {
    setIsMenuOpen(false);
    setCurrentView(view);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Top Bar Left: Logo Only */}
          <button
            id="brand-logo-btn"
            type="button"
            onClick={() => handleNavigate('home')}
            className="flex items-center text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl py-1 px-1 -ml-1 cursor-pointer shrink-0"
          >
            <BrandName className="font-extrabold text-base sm:text-lg tracking-tight text-slate-950" />
          </button>

          {/* Top Bar Right: PWAInstallButton ONLY + 1 Hamburger Icon */}
          <div className="flex items-center gap-2">
            <PWAInstallButton variant="header" />

            {/* Hamburger Menu Toggle Button (min 44x44px touch target) */}
            <button
              id="main-hamburger-menu-btn"
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-800 hover:text-slate-950 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center justify-center touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Dropdown Component */}
      <MobileMenuDropdown
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigate}
        currentView={currentView}
        userRole={userRole}
        onLogout={onLogout}
        driverName={driverName}
        managerName={managerName}
      />
    </header>
  );
};
