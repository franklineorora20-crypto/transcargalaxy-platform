import React from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-slate-950 text-amber-400 border border-amber-500/40 px-3.5 py-2 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3 duration-200 backdrop-blur-md"
    >
      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
      <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <span>Offline Mode — Using cached routes & tickets.</span>
    </div>
  );
};
