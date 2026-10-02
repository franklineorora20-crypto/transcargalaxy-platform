import React from 'react';
import { Ticket, Phone, Search, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { Booking } from '../../types';
import { ApiService } from '../../services/api';
import { DigitalTicket } from './DigitalTicket';
import { useToast } from '../common/Toast';

interface TicketRetrievalPageProps {
  onBackToHome: () => void;
  onTrackBus: (bookingRef: string) => void;
  onOpenDriverPortal?: (verifyToken?: string, tripId?: string) => void;
}

export const TicketRetrievalPage: React.FC<TicketRetrievalPageProps> = ({
  onBackToHome,
  onTrackBus,
}) => {
  const toast = useToast();
  const [bookingReference, setBookingReference] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retrievedBooking, setRetrievedBooking] = React.useState<Booking | null>(null);

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingReference.trim() || !phone.trim()) {
      const msg = 'Both Booking Reference and Phone Number are required.';
      setError(msg);
      toast.warning('Missing Details', msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await ApiService.retrieveTicket(bookingReference, phone);
      setRetrievedBooking(data);
      toast.success(
        'Booking Confirmed',
        `Boarding pass ${data.bookingReference} (${data.routeOrigin} → ${data.routeDestination}) retrieved.`
      );
    } catch (err: any) {
      const msg = err.message || 'No booking matching this reference and phone number was found.';
      setError(msg);
      toast.error('Ticket Not Found', msg);
    } finally {
      setLoading(false);
    }
  };

  if (retrievedBooking) {
    return (
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 mb-4">
          <button
            onClick={() => setRetrievedBooking(null)}
            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 hover:text-amber-600 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Search Another Ticket</span>
          </button>
        </div>
        <DigitalTicket
          booking={retrievedBooking}
          onTrackBus={(ref) => onTrackBus(ref)}
          onDone={onBackToHome}
        />
      </div>
    );
  }

  return (
    <div className="relative max-w-xl mx-auto px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 w-[420px] h-[260px] rounded-full bg-amber-400/15 blur-3xl"
      />

      <div className="relative z-10 bg-white/85 supports-[backdrop-filter]:bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/90 ring-1 ring-slate-900/10 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.12)] p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 border border-slate-800 flex items-center justify-center mx-auto shadow-sm">
            <Ticket className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Retrieve Your Boarding Pass
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-sm mx-auto">
            Enter your Ticket ID or Booking Reference and the phone number used during reservation to download your digital boarding pass.
          </p>
        </div>

        <form onSubmit={handleRetrieve} className="space-y-4">
          <div>
            <label
              htmlFor="retrieve-ref"
              className="block text-xs font-bold text-slate-800 mb-1.5"
            >
              Ticket ID or Booking Reference *
            </label>
            <div className="relative">
              <Ticket className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
              <input
                id="retrieve-ref"
                type="text"
                required
                placeholder="e.g. TCR-7X4K9P2M or TRP-48291"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value.toUpperCase())}
                className="w-full min-h-[44px] pl-10 pr-3 py-2.5 text-sm uppercase font-mono font-bold border border-slate-300 bg-white/90 rounded-xl text-slate-950 focus:ring-2 focus:ring-amber-400/60 focus:border-slate-900 focus:outline-none transition-all"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block font-medium">
              Included in your M-Pesa confirmation SMS or receipt
            </span>
          </div>

          <div>
            <label
              htmlFor="retrieve-phone"
              className="block text-xs font-bold text-slate-800 mb-1.5"
            >
              Passenger Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
              <input
                id="retrieve-phone"
                type="tel"
                required
                placeholder="e.g. 0722 998 877"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-h-[44px] pl-10 pr-3 py-2.5 text-sm border border-slate-300 bg-white/90 rounded-xl text-slate-950 focus:ring-2 focus:ring-amber-400/60 focus:border-slate-900 focus:outline-none font-semibold transition-all"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block font-medium">
              Used to verify passenger ticket ownership
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50/90 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              id="retrieve-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Locating Ticket...</span>
              ) : (
                <>
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Retrieve Boarding Pass</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Offline Cached Tickets Quick Selection */}
        {ApiService.getOfflineSavedTickets().length > 0 && (
          <div className="pt-4 border-t border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 block">
              Saved Boarding Passes on This Device
            </span>
            <div className="space-y-1.5">
              {ApiService.getOfflineSavedTickets().slice(0, 3).map((saved) => (
                <button
                  key={saved.id || saved.bookingReference}
                  type="button"
                  onClick={() => {
                    setRetrievedBooking(saved);
                    toast.success('Ticket Loaded', `Boarding pass ${saved.bookingReference} opened.`);
                  }}
                  className="w-full p-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/90 text-left flex items-center justify-between transition-colors text-xs cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-slate-950 block">{saved.bookingReference}</span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {saved.routeOrigin || 'Rongai'} → {saved.routeDestination || 'Kisii'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 shrink-0">
                    Open Pass →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>QR Boarding Verification Ready</span>
          </span>
          <a href="tel:+254724626199" className="font-mono font-semibold text-slate-700 hover:text-slate-950">
            Support: +254 724 626199
          </a>
        </div>
      </div>
    </div>
  );
};
