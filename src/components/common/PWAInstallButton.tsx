import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop install flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="craft-btn-amber text-xs px-3 py-1.5 flex items-center gap-1.5 shadow-sm"
        title="Install TransCar App for fast offline access"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (WebKit manual add to home screen)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="craft-btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5"
          title="Add TransCar to iPhone Home Screen"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-500" />
          <span>Add to Phone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-950">Install TransCar on iOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add TransCar to your iPhone home screen to view your booked tickets and timetables even without an active internet connection:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2">
                <p>1. Tap the <strong>Share</strong> button at the bottom of Safari.</p>
                <p>2. Scroll down and select <strong>Add to Home Screen</strong>.</p>
                <p>3. Tap <strong>Add</strong> in the top right corner.</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full craft-btn-primary text-xs py-2.5"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
