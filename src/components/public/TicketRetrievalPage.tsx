import React from 'react';
import { Ticket, Phone, Search, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { Booking } from '../../types';
import { ApiService } from '../../services/api';
import { DigitalTicket } from './DigitalTicket';

interface TicketRetrievalPageProps {
  onBackToHome: () => void;
  onTrackBus: (bookingRef: string) => void;
}

export const TicketRetrievalPage: React.FC<TicketRetrievalPageProps> = ({
  onBackToHome,
  onTrackBus,
}) => {
  const [bookingReference, setBookingReference] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retrievedBooking, setRetrievedBooking] = React.useState<Booking | null>(null);

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingReference.trim() || !phone.trim()) {
      setError('Both Booking Reference and Phone Number are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await ApiService.retrieveTicket(bookingReference, phone);
      setRetrievedBooking(data);
    } catch (err: any) {
      setError(err.message || 'No booking matching this reference and phone number was found.');
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
            className="flex items-center gap-1.5 text-xs font-black text-black hover:text-amber-500 cursor-pointer"
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
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border-2 border-neutral-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-black text-amber-400 border border-amber-400 flex items-center justify-center mx-auto shadow-md">
            <Ticket className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-black font-serif">My Trips & Tickets</h2>
          <p className="text-xs text-neutral-600 font-medium max-w-sm mx-auto">
            View your upcoming trips and retrieve your digital tickets. Enter your Booking Reference and phone number used during checkout.
          </p>
        </div>

        <form onSubmit={handleRetrieve} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Booking Reference *
            </label>
            <div className="relative">
              <Ticket className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
              <input
                id="retrieve-ref"
                type="text"
                required
                placeholder="e.g. TRP-48291"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-3 py-2.5 text-sm uppercase font-mono font-bold border-2 border-neutral-300 bg-neutral-50 rounded-xl text-black focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block font-medium">Found on your M-Pesa SMS or booking confirmation screen</span>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
              Passenger Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
              <input
                id="retrieve-phone"
                type="tel"
                required
                placeholder="e.g. 0722 998 877 or 254..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-neutral-300 bg-neutral-50 rounded-xl text-black focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none font-semibold"
              />
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block font-medium">Used to verify ticket ownership</span>
          </div>

          {error && (
            <div className="p-3 bg-neutral-900 border-2 border-rose-500 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              id="retrieve-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 border border-black cursor-pointer"
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
          <div className="pt-4 border-t border-neutral-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Saved Offline Boarding Passes
            </span>
            <div className="space-y-1.5">
              {ApiService.getOfflineSavedTickets().slice(0, 3).map((saved) => (
                <button
                  key={saved.id || saved.bookingReference}
                  type="button"
                  onClick={() => setRetrievedBooking(saved)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-colors text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-slate-950 block">{saved.bookingReference}</span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {saved.routeOrigin || 'Rongai'} → {saved.routeDestination || 'Kisii'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex-shrink-0">
                    Open Ticket
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Demo Help */}
        <div className="pt-4 border-t-2 border-neutral-200 text-xs bg-black text-neutral-300 p-4 rounded-2xl border border-neutral-800 space-y-1.5">
          <p className="font-black text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> Demo Sample Verification Credentials:
          </p>
          <div className="font-mono text-[11px] space-y-1 text-neutral-300">
            <p>Reference: <strong className="text-amber-400">TRP-48291</strong> • Phone: <strong className="text-white">0722998877</strong></p>
            <p>Reference: <strong className="text-amber-400">TRP-91042</strong> • Phone: <strong className="text-white">0701234567</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};
