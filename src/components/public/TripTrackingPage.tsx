import React from 'react';
import {
  Navigation,
  Bus,
  MapPin,
  Clock,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { TrackingData } from '../../types';
import { ApiService } from '../../services/api';
import { TrackingMap } from './TrackingMap';

interface TripTrackingPageProps {
  initialCode?: string;
  onBookNow?: () => void;
}

export const TripTrackingPage: React.FC<TripTrackingPageProps> = ({
  initialCode = 'TRP-48291',
  onBookNow,
}) => {
  const [searchCode, setSearchCode] = React.useState(initialCode);
  const [trackingData, setTrackingData] = React.useState<TrackingData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTracking = React.useCallback(async (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const data = await ApiService.trackBus(codeToSearch.trim());
      setTrackingData(data);
    } catch (err: any) {
      setError(err.message || 'No journey was found for this code. Try TRP-48291 or SL-NBO-MBS-0700.');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (initialCode) {
      fetchTracking(initialCode);
    }
  }, [initialCode, fetchTracking]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(searchCode);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Tracker Banner */}
      <div className="bg-black p-6 sm:p-8 rounded-3xl text-white shadow-xl border-2 border-amber-400/40">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-400 text-black text-xs font-black mb-3 border border-black">
            <Navigation className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>LIVE TRACKING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-white">
            Track Your Journey Live
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1 font-medium">
            Enter your Booking Reference (e.g. TRP-48291), Trip Code (e.g. SL-NBO-MBS-0700), or Bus Plate (e.g. KDA 123A) to view real-time location and arrival ETA.
          </p>
        </div>

        {/* Tracking Input Form */}
        <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
            <input
              id="tracking-search-input"
              type="text"
              required
              placeholder="e.g. TRP-48291 or KDA 123A"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              className="w-full pl-10 pr-4 py-3 bg-neutral-900 border-2 border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 font-mono font-bold text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <button
            id="tracking-search-btn"
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 border border-black cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <Navigation className="w-4 h-4 text-black stroke-[2.5]" />}
            <span>Track Status</span>
          </button>
        </form>

        {/* Quick Demo links */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 font-medium">
          <span>Quick Demo Tracking:</span>
          <button
            type="button"
            onClick={() => {
              setSearchCode('TRP-48291');
              fetchTracking('TRP-48291');
            }}
            className="underline hover:text-amber-400 font-mono text-neutral-300 cursor-pointer"
          >
            TRP-48291 (In Transit to Mombasa)
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setSearchCode('SL-NBO-KSM-0800');
              fetchTracking('SL-NBO-KSM-0800');
            }}
            className="underline hover:text-amber-400 font-mono text-neutral-300 cursor-pointer"
          >
            SL-NBO-KSM-0800 (In Transit to Kisumu)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-neutral-900 border-2 border-rose-500 text-rose-300 text-sm rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Tracking Status Dashboard */}
      {trackingData && (
        <div className="bg-white rounded-3xl border-2 border-neutral-200 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8">
          {/* Top Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b-2 border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-black bg-amber-400 px-2.5 py-0.5 rounded border border-black">
                  {trackingData.tripCode}
                </span>
                <span className="text-xs font-mono font-black text-black bg-white px-2.5 py-0.5 rounded border-2 border-neutral-300">
                  Bus: {trackingData.busRegistration}
                </span>
              </div>
              <h2 className="text-2xl font-black text-black mt-1 font-serif">
                {trackingData.route}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm bg-black text-amber-400 border border-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>{trackingData.status.replace('_', ' ')}</span>
              </span>

              <button
                onClick={() => fetchTracking(searchCode)}
                className="p-2 rounded-xl border-2 border-neutral-300 text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Refresh Telematics"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Telematics Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-50 border-2 border-neutral-200">
              <span className="text-[11px] font-black text-neutral-500 uppercase tracking-wider block">Current Location</span>
              <p className="text-base font-black text-black mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-black flex-shrink-0" />
                <span className="truncate">{trackingData.currentStop}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border-2 border-neutral-200">
              <span className="text-[11px] font-black text-neutral-500 uppercase tracking-wider block">Next Scheduled Stop</span>
              <p className="text-base font-black text-black mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="truncate">{trackingData.nextStop}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border-2 border-neutral-200">
              <span className="text-[11px] font-black text-neutral-500 uppercase tracking-wider block">Estimated Arrival</span>
              <p className="text-base font-black text-black mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>
                  {new Date(trackingData.estimatedArrivalTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border-2 border-neutral-200">
              <span className="text-[11px] font-black text-neutral-500 uppercase tracking-wider block">Governed Speed</span>
              <p className="text-base font-black text-black mt-1 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-black flex-shrink-0" />
                <span>{trackingData.speedKmH} km/h (Max 80)</span>
              </p>
            </div>
          </div>

          {/* Delay Notification Alert */}
          {trackingData.delayMinutes > 0 ? (
            <div className="p-4 bg-black text-amber-400 border-2 border-amber-400 rounded-2xl text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <span className="font-black text-white">Minor Delay: +{trackingData.delayMinutes} minutes</span>
                <p className="text-neutral-300 mt-0.5">{trackingData.delayReason || 'Traffic slowdown on highway corridor'}</p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-neutral-950 text-white border-2 border-amber-400/50 rounded-2xl text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span className="font-medium">Journey is running strictly on schedule with verified satellite telematics.</span>
            </div>
          )}

          {/* Visual Interactive Corridor Progress Bar */}
          <div className="p-6 bg-black text-white rounded-2xl space-y-4 border-2 border-amber-400/40">
            <div className="flex items-center justify-between text-xs text-neutral-300 font-bold">
              <span>Origin: <strong className="text-white">{trackingData.origin}</strong></span>
              <span>Progress: <strong className="text-amber-400 font-mono font-black">{trackingData.percentCompleted}%</strong></span>
              <span>Destination: <strong className="text-white">{trackingData.destination}</strong></span>
            </div>

            <div className="relative w-full h-3 bg-neutral-800 rounded-md overflow-hidden border border-neutral-700">
              <div
                className="h-full bg-amber-400 rounded-md transition-all duration-700"
                style={{ width: `${trackingData.percentCompleted}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white" />
                Departed: {new Date(trackingData.departureTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-amber-400 font-black">
                Current Position: {trackingData.currentStop}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                ETA: {new Date(trackingData.estimatedArrivalTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          
          {/* Interactive Route Map */}
          <TrackingMap trackingData={trackingData} />

          {/* Privacy & Security Guarantee Banner */}
          <div className="pt-2 text-xs text-neutral-500 flex items-center justify-between border-t-2 border-neutral-200">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Public Passenger Telematics Feed (Driver personal details and financial records protected).</span>
            </div>
            <span className="font-bold text-neutral-700">Last GPS ping: {new Date(trackingData.lastUpdated).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};
