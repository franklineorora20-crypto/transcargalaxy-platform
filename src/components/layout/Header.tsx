import React from 'react';
import {
  Shield,
  PhoneCall,
  Mail,
  MapPin,
  HelpCircle,
  Bus,
  Sparkles,
  FileText,
} from 'lucide-react';
import { BrandName } from '../common/BrandName';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { Navbar } from './Navbar';

export { Navbar } from './Navbar';

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
  return (
    <Navbar
      currentView={currentView}
      setCurrentView={setCurrentView}
      userRole={userRole}
      onLogout={onLogout}
      driverName={driverName}
      managerName={managerName}
      onOpenTutorial={onOpenTutorial}
    />
  );
};

export const Footer: React.FC<{ onNavigate: (view: string) => void; onOpenTutorial?: () => void }> = ({
  onNavigate,
  onOpenTutorial,
}) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs mt-auto pb-16 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800/80">
          {/* 1. Brand & NTSA License */}
          <div className="space-y-3">
            <BrandName className="font-extrabold text-xl tracking-tight text-white" />
            <p className="text-slate-300 font-semibold text-xs leading-snug">
              Premier Intercity & Rongai Regional Express Transportation
            </p>
            <p className="text-slate-400 leading-relaxed text-xs">
              Daily express passenger shuttles connecting Ongata Rongai, Nairobi, Ngong, Kiserian, Kisii, Rongo, Awendo, Migori, Sirare, and Kehancha.
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-amber-400">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>NTSA Licensed PSV Operator</span>
            </div>
          </div>

          {/* 2. Secondary Pages: Fleet, Safety, Services, About */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Company & Fleet</h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('fleet')}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Fleet (11, 14 & 16-Seater)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('safety')}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Passenger Safety & Compliance
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('services')}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Parcel & Private Charter Services
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  About TransCar Rongai
                </button>
              </li>
              {onOpenTutorial && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenTutorial}
                    className="hover:text-amber-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>How Booking Works Guide</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* 3. Support & Contact */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Support & Stations</h4>
            <div className="space-y-2 text-slate-300 text-xs">
              <p className="flex items-center gap-2 font-mono">
                <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Hotline: <a href="tel:+254724626199" className="text-amber-400 font-bold hover:underline">+254 724 626199</a></span>
              </p>
              <p className="flex items-center gap-2 font-mono">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Parcel: <a href="tel:+254717747626" className="text-slate-200 font-semibold hover:text-amber-400 hover:underline">+254 717 747626</a></span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href="mailto:support@transcarrongai.co.ke" className="hover:text-amber-400 transition-colors">
                  support@transcarrongai.co.ke
                </a>
              </p>
              <p className="flex items-start gap-2 text-slate-400 pt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Next to Isalu Center (Ongata Rongai), Nairobi Central & Kisii Main Stage.</span>
              </p>
            </div>
          </div>

          {/* 4. Booking Tools & Staff Portal Access */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Tools & Legal</h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('retrieve-ticket')}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Retrieve Boarding Pass
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('tracking')}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Live Bus Tracking
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                  Staff Login
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('driver-login')}
                    className="text-slate-400 hover:text-amber-400 transition-colors font-medium cursor-pointer"
                  >
                    Driver Login
                  </button>
                  <span className="text-slate-700" aria-hidden="true">•</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('manager-login')}
                    className="text-slate-400 hover:text-amber-400 transition-colors font-medium cursor-pointer"
                  >
                    Manager Login
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} TransCar Rongai Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Premier Intercity & Rongai Regional Express Transportation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
