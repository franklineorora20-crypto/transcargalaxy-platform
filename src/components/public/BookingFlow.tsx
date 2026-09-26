import React from 'react';
import {
  Bus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Phone,
  User,
  Mail,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  X,
  RefreshCw,
  CreditCard,
  QrCode,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Trip, Booking } from '../../types';
import { SeatSelector } from './SeatSelector';
import { DigitalTicket } from './DigitalTicket';
import { ApiService } from '../../services/api';
import { validatePassengerDetailsOrThrow } from '../../utils/validation';

const errorMap: Record<string, { en: string; sw: string }> = {
  timeout: { en: 'Payment timed out. Please try again.', sw: 'Malipo yamechelewa, tafadhali jaribu tena.' },
  stk_failed: { en: 'M-Pesa prompt cancelled or failed.', sw: 'Umekataa au umeshindwa kukamilisha malipo ya M-Pesa.' },
  no_seats: { en: 'Selected seats were just reserved by another passenger. Bus full.', sw: 'Viti vimejaa, tafadhali chagua viti vingine.' },
  invalid_code: { en: 'Invalid M-Pesa confirmation code. Must be 8-12 alphanumeric characters.', sw: 'Msimbo wa M-Pesa sio sahihi. Lazima uwe tarakimu 8-12.' },
  generic: { en: 'Could not secure seat reservation.', sw: 'Hitilafu imetokea wakati wa kuhifadhi siti.' },
};

const getLocalizedError = (msg: string): string => {
  if (!msg) return `${errorMap.generic.en} (${errorMap.generic.sw})`;
  const lower = msg.toLowerCase();
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('pending')) {
    return `${errorMap.timeout.en} • ${errorMap.timeout.sw}`;
  }
  if (lower.includes('cancel') || lower.includes('prompt') || lower.includes('reject')) {
    return `${errorMap.stk_failed.en} • ${errorMap.stk_failed.sw}`;
  }
  if (lower.includes('reserved by another') || lower.includes('full') || lower.includes('conflict')) {
    return `${errorMap.no_seats.en} • ${errorMap.no_seats.sw}`;
  }
  if (lower.includes('alphanumeric') || lower.includes('confirmation code')) {
    return `${errorMap.invalid_code.en} • ${errorMap.invalid_code.sw}`;
  }
  return msg;
};

interface BookingFlowProps {
  initialTrip?: Trip | null;
  onDone?: () => void;
  onTrackBus?: (ref: string) => void;
  onOpenDriverPortal?: () => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  initialTrip,
  onDone,
  onTrackBus,
  onOpenDriverPortal,
}) => {
  const [step, setStep] = React.useState<number>(initialTrip ? 1 : 0);
  const [selectedTrip, setSelectedTrip] = React.useState<Trip | null>(initialTrip || null);
  const [availableTrips, setAvailableTrips] = React.useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = React.useState(!initialTrip);

  // Seat selection & real-time configuration
  const [selectedSeats, setSelectedSeats] = React.useState<string[]>([]);
  const [passengersCount, setPassengersCount] = React.useState<number>(1);
  const [activeChassisCapacity, setActiveChassisCapacity] = React.useState<11 | 14 | 16>(14);
  const [isSyncingAvailability, setIsSyncingAvailability] = React.useState(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date>(new Date());
  const [realtimeNotification, setRealtimeNotification] = React.useState<string | null>(null);

  // Dynamic initialization of chassis capacity when selectedTrip changes
  React.useEffect(() => {
    if (selectedTrip) {
      const cap = selectedTrip.vehicle?.seatingCapacity || selectedTrip.totalSeats;
      if (cap === 11) setActiveChassisCapacity(11);
      else if (cap === 16) setActiveChassisCapacity(16);
      else if (selectedTrip.vehicle?.registrationNumber?.replace(/\s/g, '').toUpperCase() === 'KDE416Q') setActiveChassisCapacity(11);
      else setActiveChassisCapacity(14);

      // Inject / update dynamic JSON-LD structured data for this corridor
      try {
        let scriptTag = document.getElementById('dynamic-bus-schema') as HTMLScriptElement | null;
        if (!scriptTag) {
          scriptTag = document.createElement('script');
          scriptTag.id = 'dynamic-bus-schema';
          scriptTag.type = 'application/ld+json';
          document.head.appendChild(scriptTag);
        }
        scriptTag.text = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BusTrip',
          'provider': {
            '@type': 'Organization',
            'name': 'TransCar Rongai Express',
            'url': 'https://transcargalaxy-platform.vercel.app',
          },
          'departureBusStop': {
            '@type': 'BusStation',
            'name': `${selectedTrip.route?.origin || 'Maasai Mall, Rongai'} Terminal`,
          },
          'arrivalBusStop': {
            '@type': 'BusStation',
            'name': `${selectedTrip.route?.destination || 'Kisii'} Terminal`,
          },
          'departureTime': selectedTrip.departureTime,
          'offers': {
            '@type': 'Offer',
            'price': selectedTrip.fareKsh,
            'priceCurrency': 'KES',
            'availability': selectedTrip.availableSeats > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
          },
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [selectedTrip?.id, selectedTrip?.vehicle?.seatingCapacity, selectedTrip?.totalSeats, selectedTrip?.vehicle?.registrationNumber]);

  // Real-time availability status tracking & polling
  const syncTripAvailability = React.useCallback(async (tripId: string, showSpinner = false) => {
    if (showSpinner) setIsSyncingAvailability(true);
    try {
      const refreshed = await ApiService.getTripDetails(tripId);
      if (refreshed) {
        setSelectedTrip((prev) => {
          if (!prev) return refreshed;
          return {
            ...prev,
            ...refreshed,
            bookedSeatNumbers: refreshed.bookedSeatNumbers || prev.bookedSeatNumbers,
            availableSeats: refreshed.availableSeats ?? prev.availableSeats,
          };
        });
        setLastSyncedAt(new Date());

        // Check if any currently selected seat has been booked by another user
        const newBookedSet = new Set(refreshed.bookedSeatNumbers || []);
        setSelectedSeats((currSelected) => {
          const conflicts = currSelected.filter((s) => newBookedSet.has(s));
          if (conflicts.length > 0) {
            setRealtimeNotification(
              `Seat ${conflicts.join(', ')} was just reserved by another passenger. Please select an alternative seat.`
            );
            setTimeout(() => setRealtimeNotification(null), 7000);
            setPassengersData((pData) => pData.filter((p) => !conflicts.includes(p.seatNumber)));
            return currSelected.filter((s) => !conflicts.includes(s));
          }
          return currSelected;
        });
      }
    } catch (err) {
      console.warn('Real-time trip availability sync check failed:', err);
    } finally {
      if (showSpinner) setIsSyncingAvailability(false);
    }
  }, []);

  // Periodic real-time background sync when on Seat Selection step (step 1)
  React.useEffect(() => {
    if (step !== 1 || !selectedTrip?.id) return;

    // Initial sync
    syncTripAvailability(selectedTrip.id, false);

    // Poll every 6.5 seconds
    const interval = setInterval(() => {
      syncTripAvailability(selectedTrip.id, false);
    }, 6500);

    return () => clearInterval(interval);
  }, [step, selectedTrip?.id, syncTripAvailability]);

  // Passenger & contact form
  const [passengersData, setPassengersData] = React.useState<
    Array<{ fullName: string; idNumber: string; seatNumber: string }>
  >([]);
  const [contactName, setContactName] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [emergencyContactName, setEmergencyContactName] = React.useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState('');

  // Payment state
  const paymentMethod = 'MPESA' as const;
  const [fareQuote, setFareQuote] = React.useState<{ fare: number; serviceFee: number; total: number } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [paymentStatusText, setPaymentStatusText] = React.useState('');
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [activeBooking, setActiveBooking] = React.useState<Booking | null>(null);
  const [mpesaCodeInput, setMpesaCodeInput] = React.useState('');
  const [copiedPaybill, setCopiedPaybill] = React.useState(false);
  const [copiedAccount, setCopiedAccount] = React.useState(false);

  // Confirmed booking
  const [confirmedBooking, setConfirmedBooking] = React.useState<Booking | null>(null);

  React.useEffect(() => {
    if (!initialTrip) {
      ApiService.searchTrips({})
        .then((data) => {
          setAvailableTrips(data);
          setLoadingTrips(false);
        })
        .catch(() => setLoadingTrips(false));
    }
  }, [initialTrip]);

  // Adjust passengers list when selected seats change
  const handleSeatToggle = (seatNumber: string) => {
    // Safety check: Never allow selecting a seat that is already booked in trip
    if (selectedTrip?.bookedSeatNumbers?.includes(seatNumber)) {
      setRealtimeNotification(`Seat ${seatNumber} is already booked and unavailable.`);
      setTimeout(() => setRealtimeNotification(null), 5000);
      return;
    }

    if (selectedSeats.includes(seatNumber)) {
      const updated = selectedSeats.filter((s) => s !== seatNumber);
      setSelectedSeats(updated);
      setPassengersData((prev) => prev.filter((p) => p.seatNumber !== seatNumber));
    } else {
      if (selectedSeats.length >= passengersCount) {
        setPassengersCount(selectedSeats.length + 1);
      }
      const updated = [...selectedSeats, seatNumber];
      setSelectedSeats(updated);

      // Add a passenger entry for this seat
      setPassengersData((prev) => [
        ...prev,
        {
          fullName: prev.length === 0 ? contactName : '',
          idNumber: '',
          seatNumber,
        },
      ]);
    }
  };

  React.useEffect(() => {
    if (!selectedTrip || selectedSeats.length === 0) {
      setFareQuote(null);
      return;
    }
    ApiService.calculateFare({ tripId: selectedTrip.id, seatNumbers: selectedSeats })
      .then(setFareQuote)
      .catch(() => setFareQuote(null));
  }, [selectedTrip, selectedSeats]);

  const calculateTotalFare = () => fareQuote?.total || (selectedTrip ? selectedSeats.length * selectedTrip.fareKsh : 0);

  const handlePassengerChange = (index: number, field: 'fullName' | 'idNumber', value: string) => {
    const updated = [...passengersData];
    if (!updated[index]) return;
    updated[index][field] = value;
    setPassengersData(updated);
  };

  const handleProceedToPassengers = async () => {
    if (!selectedTrip || selectedSeats.length === 0) return;

    // Verify live availability before leaving seat selection step
    setIsSyncingAvailability(true);
    try {
      const refreshed = await ApiService.getTripDetails(selectedTrip.id);
      if (refreshed) {
        const bookedSet = new Set(refreshed.bookedSeatNumbers || []);
        const conflicts = selectedSeats.filter((s) => bookedSet.has(s));
        if (conflicts.length > 0) {
          setRealtimeNotification(
            `Seat(s) ${conflicts.join(', ')} were just reserved by another passenger. Please select alternative seats.`
          );
          setSelectedSeats((prev) => prev.filter((s) => !conflicts.includes(s)));
          setPassengersData((pData) => pData.filter((p) => !conflicts.includes(p.seatNumber)));
          setSelectedTrip(refreshed);
          return;
        }
      }
      setStep(2);
    } catch (err) {
      console.warn('Seat check error:', err);
      setStep(2);
    } finally {
      setIsSyncingAvailability(false);
    }
  };

  const validatePassengerDetails = () => {
    if (!contactName.trim() || !contactPhone.trim() || !contactEmail.trim()) {
      setPaymentError('Please provide the primary contact person details (Name, Phone number, and Email).');
      return false;
    }
    try {
      validatePassengerDetailsOrThrow({
        passengers: passengersData,
        contactName,
        contactPhone,
      });
      return true;
    } catch (err: any) {
      setPaymentError(err.message || 'Invalid passenger details');
      return false;
    }
  };

  // Step 2 -> Step 3: Create Booking Reservation
  const handleProceedToPayment = async () => {
    if (!validatePassengerDetails() || !selectedTrip) return;

    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentStatusText('Securing your seat reservation...');

    try {
      const { booking } = await ApiService.createBooking({
        tripId: selectedTrip.id,
        passengers: passengersData,
        contactName,
        contactPhone,
        contactEmail,
        emergencyContactName,
        emergencyContactPhone,
        paymentMethod,
        frontendTotal: fareQuote?.total,
      });

      setActiveBooking(booking);
      setStep(3);
    } catch (err: any) {
      setPaymentError(getLocalizedError(err.message || 'Could not secure seat reservation.'));
      // If conflicting seats, alert and return to step 1
      if (err.message && err.message.includes('reserved by another passenger')) {
        setRealtimeNotification(getLocalizedError(err.message));
        if (selectedTrip) syncTripAvailability(selectedTrip.id, true);
        setStep(1);
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Confirm payment using M-Pesa Transaction Code
  const handleVerifyMpesaCode = async () => {
    const code = mpesaCodeInput.trim().toUpperCase();
    if (!code) {
      setPaymentError(getLocalizedError('Please enter your 10-character M-Pesa confirmation code'));
      return;
    }

    if (!/^[A-Z0-9]{8,12}$/.test(code)) {
      setPaymentError(getLocalizedError('M-Pesa confirmation code must be 8-12 alphanumeric characters (e.g. QGH8491KLR).'));
      return;
    }

    if (!activeBooking) {
      setPaymentError(getLocalizedError('Booking reservation not found. Please try again.'));
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentStatusText(`Verifying M-Pesa code ${code}...`);

    try {
      const res = await ApiService.verifyPayment({
        bookingReference: activeBooking.bookingReference,
        transactionCode: code,
      });

      if (res.success && res.booking) {
        setConfirmedBooking(res.booking);
        setStep(4);
      } else {
        setPaymentError(getLocalizedError(res.message || 'Payment verification could not be completed.'));
      }
    } catch (err: any) {
      setPaymentError(getLocalizedError(err.message || 'Failed to verify M-Pesa code.'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCopy = (text: string, type: 'paybill' | 'account') => {
    navigator.clipboard.writeText(text);
    if (type === 'paybill') {
      setCopiedPaybill(true);
      setTimeout(() => setCopiedPaybill(false), 2000);
    } else {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleUseSampleCode = () => {
    const letters = 'QWERTYUPADFGHJKZXCVBNM';
    const randomCode = 'QGH' + Math.floor(1000 + Math.random() * 9000) + letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
    setMpesaCodeInput(randomCode.toUpperCase());
    setPaymentError(null);
  };

  if (confirmedBooking) {
    return (
      <DigitalTicket
        booking={confirmedBooking}
        onTrackBus={(ref) => onTrackBus && onTrackBus(ref)}
        onDone={onDone}
        onOpenDriverPortal={onOpenDriverPortal}
      />
    );
  }

  const accountRef = activeBooking?.bookingReference || (selectedTrip ? `TRANSCAR-${selectedTrip.tripCode.split('-')[1] || 'GALAXY'}` : 'TRANSCAR');

  return (
    <div className="max-w-4xl mx-auto my-3 sm:my-8 px-2.5 sm:px-4">
      {/* Step Indicator */}
      <div className="mb-4 sm:mb-8 bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[280px] sm:min-w-0 max-w-2xl mx-auto gap-2">
          {[
            { num: 1, label: 'Trip' },
            { num: 2, label: 'Seats' },
            { num: 3, label: 'Details' },
            { num: 4, label: 'Payment' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors flex-shrink-0 ${
                  step === s.num
                    ? 'bg-amber-400 text-black ring-2 sm:ring-4 ring-amber-400/30 border border-black'
                    : step > s.num
                    ? 'bg-black text-amber-400 border border-amber-400'
                    : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : s.num}
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-neutral-700 whitespace-nowrap">{s.label}</span>
              {idx < 3 && <div className="hidden sm:block w-4 sm:w-8 h-px bg-neutral-200 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 0: Select Trip (if none pre-selected) */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-black">Select an Available Scheduled Trip</h2>
          {loadingTrips ? (
            <div className="p-8 text-center text-neutral-500 font-bold">Loading trips...</div>
          ) : (
            <div className="grid gap-4">
              {availableTrips.map((t) => {
                const vehicleCap = t.vehicle?.seatingCapacity || t.totalSeats || (t.vehicle?.registrationNumber?.replace(/\s/g, '').toUpperCase() === 'KDE416Q' ? 11 : 14);
                const bookedCount = t.bookedSeatNumbers?.length || 0;
                const freeCount = Math.max(0, vehicleCap - bookedCount);

                return (
                  <div
                    key={t.id}
                    className="p-5 bg-white rounded-2xl border-2 border-neutral-200 shadow-sm hover:border-amber-400 flex flex-wrap items-center justify-between gap-4 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-amber-400 bg-black px-2 py-0.5 rounded border border-neutral-800">
                          {t.tripCode}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                          {vehicleCap === 11 ? '11-Seater VIP' : vehicleCap === 16 ? '16-Seater Maxi' : '14-Seater Standard'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          {freeCount} seats free
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-black mt-1">
                        {t.route.origin} → {t.route.destination}
                      </h3>
                      <p className="text-xs text-neutral-600 font-medium">
                        Departure: {new Date(t.departureTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} • Bus: {t.vehicle.registrationNumber} ({t.vehicle.model || 'Toyota HiAce'})
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-neutral-500 font-bold block">From</span>
                        <span className="text-lg font-black text-black">KES {t.fareKsh.toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTrip(t);
                          const cap = t.vehicle?.seatingCapacity || t.totalSeats || (t.vehicle?.registrationNumber?.replace(/\s/g, '').toUpperCase() === 'KDE416Q' ? 11 : 14);
                          setActiveChassisCapacity(cap === 11 ? 11 : cap === 16 ? 16 : 14);
                          setStep(1);
                        }}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-black shadow transition-colors border border-black cursor-pointer"
                      >
                        Select Trip
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 1: Seat Selection */}
      {step === 1 && selectedTrip && (
        <div className="space-y-6">
          {/* Real-Time Notification Alert */}
          {realtimeNotification && (
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-center justify-between gap-3 text-amber-950 text-xs font-bold shadow-md animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>{realtimeNotification}</span>
              </div>
              <button
                type="button"
                onClick={() => setRealtimeNotification(null)}
                className="p-1 hover:bg-amber-200/60 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="p-4 bg-black text-white rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl border-2 border-amber-400/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-black bg-amber-400 font-black px-2 py-0.5 rounded">
                  {selectedTrip.tripCode}
                </span>
                <span className="text-xs text-neutral-300 font-bold">Express Scheduled Shuttle</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <h2 className="text-xl font-black font-serif text-white mt-1">
                {selectedTrip.route.origin} → {selectedTrip.route.destination}
              </h2>
              <p className="text-xs text-neutral-400 font-medium">
                Departure: {new Date(selectedTrip.departureTime).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                {new Date(selectedTrip.departureTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} • Bus: {selectedTrip.vehicle?.registrationNumber || 'KDA 123A'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => syncTripAvailability(selectedTrip.id, true)}
                disabled={isSyncingAvailability}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh real-time seat availability"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAvailability ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync Seats</span>
              </button>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-amber-400">Passengers:</label>
                <select
                  value={passengersCount}
                  onChange={(e) => setPassengersCount(Number(e.target.value))}
                  className="bg-neutral-900 border border-neutral-700 text-white font-bold text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Seat' : 'Seats'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <SeatSelector
            trip={selectedTrip}
            selectedSeats={selectedSeats}
            onSeatToggle={handleSeatToggle}
            maxSeats={passengersCount}
            configCapacity={activeChassisCapacity}
            onConfigChange={(newCap) => setActiveChassisCapacity(newCap)}
            isSyncing={isSyncingAvailability}
            onRefreshAvailability={() => syncTripAvailability(selectedTrip.id, true)}
            lastSyncedAt={lastSyncedAt}
          />

          <div className="p-4 sm:p-5 bg-white rounded-2xl border-2 border-neutral-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-neutral-600">Selected Seats: </span>
              <span className="text-sm font-black text-black font-mono">
                {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected yet'}
              </span>
              <div className="text-xs text-neutral-600 mt-1">
                Subtotal:{' '}
                <span className="text-base font-black text-black bg-amber-400 px-2 py-0.5 rounded">
                  KES {calculateTotalFare().toLocaleString()}
                </span>
                <p className="text-[11px] text-neutral-500 font-medium mt-1">
                  All fares inclusive of 16% Statutory VAT as per Kenya Tax Laws
                </p>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 sm:gap-3">
              {!initialTrip && (
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2.5 border-2 border-neutral-300 rounded-xl text-xs font-bold text-black hover:bg-neutral-100 cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Change Trip
                </button>
              )}
              <button
                disabled={selectedSeats.length === 0 || isSyncingAvailability}
                onClick={handleProceedToPassengers}
                className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all min-h-[44px] ${
                  selectedSeats.length > 0 && !isSyncingAvailability
                    ? 'bg-amber-400 hover:bg-amber-300 text-black border border-black cursor-pointer'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {isSyncingAvailability ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                    <span>Checking Seat Availability...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Passenger Details</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Passenger Information */}
      {step === 2 && selectedTrip && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-neutral-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-lg font-black text-black">Primary Contact Information</h3>
              <p className="text-xs text-neutral-600">
                Booking confirmation and your digital boarding pass will be delivered here.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-black mb-1">Contact Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frankline Orora"
                    value={contactName}
                    onChange={(e) => {
                      setContactName(e.target.value);
                      if (passengersData[0] && !passengersData[0].fullName) {
                        handlePassengerChange(0, 'fullName', e.target.value);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm border-2 border-neutral-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">M-Pesa Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="0724 626 199"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border-2 border-neutral-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="franklineorora20@gmail.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border-2 border-neutral-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-neutral-700 mb-1">Emergency Contact Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Frankline Orora"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-neutral-700 mb-1">Emergency Contact Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Passenger Names & IDs */}
          <div className="bg-white p-6 rounded-2xl border-2 border-neutral-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-lg font-black text-black">Passenger Manifest Details</h3>
              <p className="text-xs text-neutral-600">
                NTSA interstate transit regulations require full passenger legal names and ID/Passport numbers.
              </p>
            </div>

            <motion.div layout className="space-y-4">
              <AnimatePresence>
                {passengersData.map((p, idx) => (
                  <motion.div
                    key={p.seatNumber}
                    layout
                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="p-4 rounded-xl bg-neutral-50 border-2 border-neutral-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center overflow-hidden"
                  >
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-neutral-500 uppercase font-black block">Seat</span>
                      <span className="text-base font-black font-mono text-amber-400 bg-black px-2.5 py-1 rounded border border-neutral-800 inline-block">
                        {p.seatNumber}
                      </span>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-xs font-black text-black mb-1">
                        Passenger {idx + 1} Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Frankline Orora"
                        value={p.fullName}
                        onChange={(e) => handlePassengerChange(idx, 'fullName', e.target.value)}
                        className="w-full px-3 py-2 text-sm border-2 border-neutral-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-black text-black mb-1">
                        National ID / Passport No. *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 28941029"
                        value={p.idNumber}
                        onChange={(e) => handlePassengerChange(idx, 'idNumber', e.target.value)}
                        className="w-full px-3 py-2 text-sm border-2 border-neutral-300 rounded-lg bg-white font-mono font-bold focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>

          {paymentError && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-2 border-neutral-300 rounded-xl text-xs font-bold text-black hover:bg-neutral-100 cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Seats</span>
            </button>

            <button
              disabled={isProcessingPayment}
              onClick={handleProceedToPayment}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all border border-black cursor-pointer min-h-[44px]"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>{paymentStatusText || 'Securing Reservation...'}</span>
                </>
              ) : (
                <>
                  <span>Review & Pay (KES {calculateTotalFare().toLocaleString()})</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: M-Pesa Payment via Confirmation Code */}
      {step === 3 && selectedTrip && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-neutral-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                  Booking Reference: {activeBooking?.bookingReference || 'TRP-PENDING'}
                </span>
                <h3 className="text-lg font-black text-black">
                  Lipa na M-Pesa Payment
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-neutral-500 block font-medium">Total Amount Due</span>
                <span className="text-xl font-black font-mono text-black bg-amber-400 px-3 py-0.5 rounded-lg border border-black">
                  KES {calculateTotalFare().toLocaleString()}
                </span>
                <p className="text-[11px] text-neutral-500 font-medium mt-1">
                  All fares inclusive of 16% Statutory VAT as per Kenya Tax Laws
                </p>
              </div>
            </div>

            {/* Trip Details Brief */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="font-bold text-neutral-500 block">Journey</span>
                <span className="font-black text-slate-900 text-sm">
                  {selectedTrip.route.origin} → {selectedTrip.route.destination}
                </span>
              </div>
              <div>
                <span className="font-bold text-neutral-500 block">Departure</span>
                <span className="font-mono font-bold text-slate-900">
                  {new Date(selectedTrip.departureTime).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(selectedTrip.departureTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="font-bold text-neutral-500 block">Reserved Seats</span>
                <span className="font-mono font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  {selectedSeats.join(', ')}
                </span>
              </div>
            </div>

            {/* Official M-Pesa Payment Instructions Card */}
            <div className="p-5 bg-slate-950 text-white rounded-2xl border-2 border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider font-mono">
                    Safaricom Lipa Na M-Pesa Instructions
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Official Merchant Paybill</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Paybill Number */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Business No (Paybill)</span>
                    <span className="font-mono font-black text-amber-400 text-base">400200</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('400200', 'paybill')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                    title="Copy Paybill Number"
                  >
                    {copiedPaybill ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Account Number */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Account No</span>
                    <span className="font-mono font-black text-white text-base block">
                      867845
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('867845', 'account')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                    title="Copy Account Number"
                  >
                    {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Exact Amount */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">3. Amount</span>
                  <span className="font-mono font-black text-amber-400 text-base">
                    KES {calculateTotalFare().toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="pt-2 text-xs text-slate-300 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <p className="font-bold text-amber-300 text-[11px]">How to Complete Payment on your phone:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-300 font-medium">
                  <li>Go to M-Pesa on your mobile phone → Select <strong>Lipa na M-Pesa</strong> → <strong>Paybill</strong>.</li>
                  <li>Enter Business No: <strong className="text-white font-mono">400200</strong> & Account No: <strong className="text-white font-mono">867845</strong>.</li>
                  <li>Enter Amount: <strong className="text-white font-mono">KES {calculateTotalFare().toLocaleString()}</strong> and enter your M-Pesa PIN.</li>
                  <li>You will receive an SMS confirmation from <strong>MPESA</strong> with your 10-character Transaction Code (e.g. <span className="font-mono text-amber-400 font-bold">QGH8491KLR</span>).</li>
                </ol>
              </div>
            </div>

            {/* Enter M-Pesa Confirmation Code Form */}
            <div className="p-5 bg-amber-50/70 rounded-2xl border-2 border-amber-300 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label htmlFor="mpesa-code" className="block text-xs font-black text-slate-950 uppercase tracking-wider">
                    Enter M-Pesa Transaction Code *
                  </label>
                  <p className="text-[11px] text-slate-600">
                    Type the 10-character code from your Safaricom M-Pesa SMS to confirm your ticket immediately.
                  </p>
                </div>

                {/* Quick Fill Test Code Button */}
                <button
                  type="button"
                  onClick={handleUseSampleCode}
                  className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-lg border border-amber-400/80 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  ⚡ Auto-Fill Demo Code
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <input
                    id="mpesa-code"
                    type="text"
                    required
                    maxLength={12}
                    placeholder="e.g. QGH8491KLR"
                    value={mpesaCodeInput}
                    onChange={(e) => {
                      setMpesaCodeInput(e.target.value.toUpperCase());
                      setPaymentError(null);
                    }}
                    className="w-full px-4 py-3 text-base sm:text-lg font-mono font-black tracking-widest text-slate-950 bg-white border-2 border-amber-400 rounded-xl focus:ring-3 focus:ring-amber-400/40 focus:outline-none placeholder:text-slate-400 uppercase shadow-inner"
                  />
                </div>

                <button
                  type="button"
                  id="confirm-mpesa-code-btn"
                  disabled={isProcessingPayment || !mpesaCodeInput.trim()}
                  onClick={handleVerifyMpesaCode}
                  className={`px-6 py-3 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px] ${
                    mpesaCodeInput.trim() && !isProcessingPayment
                      ? 'bg-slate-950 hover:bg-slate-900 text-amber-400 border-2 border-slate-950 cursor-pointer hover:shadow-lg'
                      : 'bg-neutral-300 text-neutral-500 cursor-not-allowed border-2 border-neutral-300'
                  }`}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>{paymentStatusText || 'Verifying Code...'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                      <span>Verify Code & Confirm Booking</span>
                    </>
                  )}
                </button>
              </div>

              {paymentError && (
                <div className="p-3 bg-rose-900/90 border border-rose-600 text-rose-100 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{paymentError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={isProcessingPayment}
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-neutral-300 rounded-xl text-xs font-bold text-black hover:bg-neutral-100 disabled:opacity-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Passenger Details</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
