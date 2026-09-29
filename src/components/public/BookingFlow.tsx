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
  Banknote,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Trip, Booking } from '../../types';
import { SeatSelector, CAR_SEAT_VIEW_SEATS, isValidSeatForCarView } from './SeatSelector';
import { DigitalTicket } from './DigitalTicket';
import { ApiService } from '../../services/api';
import { validatePassengerDetailsOrThrow } from '../../utils/validation';
import { useToast } from '../common/Toast';

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
  initialCarSeatView?: 11 | 14 | 16 | null;
  onDone?: () => void;
  onTrackBus?: (ref: string) => void;
  onOpenDriverPortal?: () => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  initialTrip,
  initialCarSeatView = null,
  onDone,
  onTrackBus,
  onOpenDriverPortal,
}) => {
  const toast = useToast();
  const [step, setStep] = React.useState<number>(initialTrip ? 1 : 0);
  const [selectedTrip, setSelectedTrip] = React.useState<Trip | null>(initialTrip || null);
  const [availableTrips, setAvailableTrips] = React.useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = React.useState(!initialTrip);

  // Scroll to top whenever booking step changes
  React.useLayoutEffect(() => {
    const htmlEl = document.documentElement;
    const prevBehavior = htmlEl.style.scrollBehavior;
    htmlEl.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    htmlEl.scrollTop = 0;
    document.body.scrollTop = 0;
    htmlEl.style.scrollBehavior = prevBehavior;
  }, [step]);

  // Seat selection & real-time configuration
  const [selectedSeats, setSelectedSeats] = React.useState<string[]>([]);
  const [activeChassisCapacity, setActiveChassisCapacity] = React.useState<11 | 14 | 16>(
    initialCarSeatView && [11, 14, 16].includes(initialCarSeatView) ? initialCarSeatView : 14
  );
  const [isSyncingAvailability, setIsSyncingAvailability] = React.useState(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date>(new Date());
  const [realtimeNotification, setRealtimeNotification] = React.useState<string | null>(null);

  // Dynamic initialization of chassis capacity when selectedTrip changes
  React.useEffect(() => {
    if (selectedTrip) {
      if (initialCarSeatView && [11, 14, 16].includes(initialCarSeatView)) {
        setActiveChassisCapacity(initialCarSeatView);
      } else {
        const cap = selectedTrip.vehicle?.seatingCapacity || selectedTrip.totalSeats;
        if (cap === 11) setActiveChassisCapacity(11);
        else if (cap === 16) setActiveChassisCapacity(16);
        else if (selectedTrip.vehicle?.registrationNumber?.replace(/\s/g, '').toUpperCase() === 'KDE416Q') setActiveChassisCapacity(11);
        else setActiveChassisCapacity(14);
      }

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
  const [paymentMethod, setPaymentMethod] = React.useState<'MPESA' | 'CASH'>('MPESA');
  const [cashReceiptInput, setCashReceiptInput] = React.useState('');
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

  // Switch Seat Configuration: strictly reset any seats selected from another configuration
  const handleCarSeatViewChange = (newCap: 11 | 14 | 16) => {
    if (newCap === activeChassisCapacity) return;
    const hadSelectedSeats = selectedSeats.length > 0;
    setActiveChassisCapacity(newCap);
    setSelectedSeats([]);
    setPassengersData([]);
    if (hadSelectedSeats) {
      setRealtimeNotification(
        `Switched to ${newCap}-Seater configuration. Previous seat selections were cleared so you only select seats from this layout.`
      );
      setTimeout(() => setRealtimeNotification(null), 5000);
    }
  };

  // Adjust passengers list when selected seats change — strictly validated against chosen Seat Configuration
  const handleSeatToggle = (seatNumber: string) => {
    const cleanSeat = String(seatNumber || '').trim().toUpperCase();

    // Enforce that seat belongs to the specific Seat Configuration the customer chose
    if (!isValidSeatForCarView(cleanSeat, activeChassisCapacity)) {
      setRealtimeNotification(
        `Seat ${cleanSeat} is not available in the ${activeChassisCapacity}-Seater configuration. Please select a seat from the active ${activeChassisCapacity}-Seater layout.`
      );
      setTimeout(() => setRealtimeNotification(null), 5000);
      return;
    }

    // Safety check: Never allow selecting a seat that is already booked in trip
    if (selectedTrip?.bookedSeatNumbers?.includes(cleanSeat)) {
      setRealtimeNotification(`Seat ${cleanSeat} is already booked and unavailable.`);
      setTimeout(() => setRealtimeNotification(null), 5000);
      return;
    }

    if (selectedSeats.includes(cleanSeat)) {
      const updated = selectedSeats.filter((s) => s !== cleanSeat && isValidSeatForCarView(s, activeChassisCapacity));
      setSelectedSeats(updated);
      setPassengersData((prev) =>
        prev.filter((p) => p.seatNumber !== cleanSeat && isValidSeatForCarView(p.seatNumber, activeChassisCapacity))
      );
    } else {
      const validExisting = selectedSeats.filter((s) => isValidSeatForCarView(s, activeChassisCapacity));
      const updated = [...validExisting, cleanSeat];
      setSelectedSeats(updated);

      // Add a passenger entry for this seat
      setPassengersData((prev) => {
        const filteredPrev = prev.filter((p) => isValidSeatForCarView(p.seatNumber, activeChassisCapacity));
        return [
          ...filteredPrev,
          {
            fullName: filteredPrev.length === 0 ? contactName : '',
            idNumber: '',
            seatNumber: cleanSeat,
          },
        ];
      });
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
    if (!contactName.trim() || !contactPhone.trim()) {
      setPaymentError('Please provide the primary passenger full name and M-Pesa phone number.');
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
      const validPassengers = passengersData.filter((p) =>
        CAR_SEAT_VIEW_SEATS[activeChassisCapacity].includes(p.seatNumber)
      );
      const { booking } = await ApiService.createBooking({
        tripId: selectedTrip.id,
        passengers: validPassengers,
        contactName,
        contactPhone,
        contactEmail: contactEmail.trim() || 'passenger@transcarrongai.co.ke',
        emergencyContactName,
        emergencyContactPhone,
        paymentMethod,
        carSeatView: activeChassisCapacity,
        frontendTotal: fareQuote?.total,
      });

      setActiveBooking(booking);
      setStep(3);
      toast.info(
        'Seat Reservation Held',
        `Booking reference ${booking.bookingReference} reserved for 10 minutes. Choose M-Pesa or Pay in Cash to confirm.`
      );
    } catch (err: any) {
      const errMsg = getLocalizedError(err.message || 'Could not secure seat reservation.');
      setPaymentError(errMsg);
      toast.error('Reservation Failed', errMsg);
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
      const msg = getLocalizedError('Please enter your 10-character M-Pesa confirmation code');
      setPaymentError(msg);
      toast.warning('M-Pesa Code Required', msg);
      return;
    }

    if (!/^[A-Z0-9]{8,12}$/.test(code)) {
      const msg = getLocalizedError('M-Pesa confirmation code must be 8-12 alphanumeric characters (e.g. QGH8491KLR).');
      setPaymentError(msg);
      toast.warning('Invalid M-Pesa Code', msg);
      return;
    }

    if (!activeBooking) {
      const msg = getLocalizedError('Booking reservation not found. Please try again.');
      setPaymentError(msg);
      toast.error('Booking Not Found', msg);
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
        toast.success(
          'Booking Confirmed',
          `Boarding pass ${res.booking.bookingReference} (${res.booking.routeOrigin} → ${res.booking.routeDestination}) is verified and ready.`
        );
      } else {
        const msg = getLocalizedError(res.message || 'Payment verification could not be completed.');
        setPaymentError(msg);
        toast.error('Verification Incomplete', msg);
      }
    } catch (err: any) {
      const msg = getLocalizedError(err.message || 'Failed to verify M-Pesa code.');
      setPaymentError(msg);
      toast.error('Verification Failed', msg);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCopy = (text: string, type: 'paybill' | 'account') => {
    navigator.clipboard.writeText(text);
    if (type === 'paybill') {
      setCopiedPaybill(true);
      setTimeout(() => setCopiedPaybill(false), 2000);
      toast.success('Copied to Clipboard', `Paybill Business No. ${text} copied.`);
    } else {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
      toast.success('Copied to Clipboard', `Account No. ${text} copied.`);
    }
  };

  const handleUseSampleCode = () => {
    const letters = 'QWERTYUPADFGHJKZXCVBNM';
    const randomCode = 'QGH' + Math.floor(1000 + Math.random() * 9000) + letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
    const finalCode = randomCode.toUpperCase();
    setMpesaCodeInput(finalCode);
    setPaymentError(null);
    toast.info('Demo M-Pesa Code Filled', `Sample transaction code ${finalCode} populated.`);
  };

  // Confirm booking via Cash Payment at Stage / Boarding
  const handleConfirmCashPayment = async () => {
    if (!activeBooking) {
      const msg = getLocalizedError('Booking reservation not found. Please try again.');
      setPaymentError(msg);
      toast.error('Booking Not Found', msg);
      return;
    }

    const receiptCode = cashReceiptInput.trim().toUpperCase() || `CASH-STAGE-${Math.floor(1000 + Math.random() * 9000)}`;

    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentStatusText('Confirming Cash Payment reservation...');

    try {
      const res = await ApiService.verifyPayment({
        bookingReference: activeBooking.bookingReference,
        transactionCode: receiptCode,
        paymentMethod: 'CASH',
      });

      if (res.success && res.booking) {
        setConfirmedBooking(res.booking);
        setStep(4);
        toast.success(
          'Booking Confirmed',
          `Cash booking ${res.booking.bookingReference} (${res.booking.routeOrigin} → ${res.booking.routeDestination}) confirmed.`
        );
      } else {
        const msg = getLocalizedError(res.message || 'Cash booking confirmation could not be completed.');
        setPaymentError(msg);
        toast.error('Confirmation Incomplete', msg);
      }
    } catch (err: any) {
      const msg = getLocalizedError(err.message || 'Failed to confirm Cash booking.');
      setPaymentError(msg);
      toast.error('Confirmation Failed', msg);
    } finally {
      setIsProcessingPayment(false);
    }
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

  const accountRef = activeBooking?.bookingReference || (selectedTrip ? `TRANSCAR-${selectedTrip.tripCode.split('-')[1] || 'RONGAI'}` : 'TRANSCAR');

  return (
    <div className="max-w-4xl mx-auto my-3 sm:my-8 px-2.5 sm:px-4">
      {/* 5-Step Passenger Booking Journey Indicator */}
      <div className="mb-4 sm:mb-8 bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[320px] sm:min-w-0 max-w-3xl mx-auto gap-1.5 sm:gap-2">
          {[
            { stepVal: -1, num: 1, label: 'Find Trip' },
            { stepVal: 0, num: 2, label: 'Select Trip' },
            { stepVal: 1, num: 3, label: 'Choose Seat' },
            { stepVal: 2, num: 4, label: 'Passenger Details' },
            { stepVal: 3, num: 5, label: 'Payment' },
          ].map((s, idx) => {
            const isCurrent = step === s.stepVal;
            const isCompleted = step > s.stepVal;
            return (
              <div key={s.num} className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors flex-shrink-0 ${
                    isCurrent
                      ? 'bg-amber-400 text-black ring-2 sm:ring-4 ring-amber-400/30 border border-black'
                      : isCompleted
                      ? 'bg-black text-amber-400 border border-amber-400'
                      : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : s.num}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${
                    isCurrent ? 'text-black font-black' : 'text-neutral-700'
                  }`}
                >
                  {s.label}
                </span>
                {idx < 4 && <div className="hidden md:block w-3 lg:w-6 h-px bg-neutral-200 flex-shrink-0" />}
              </div>
            );
          })}
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

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-bold">
                <span className="text-amber-400">{activeChassisCapacity}-Seater View:</span>
                <span className="text-white font-mono">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} Selected
                </span>
              </div>
            </div>
          </div>

          <SeatSelector
            trip={selectedTrip}
            selectedSeats={selectedSeats}
            onSeatToggle={handleSeatToggle}
            configCapacity={activeChassisCapacity}
            onConfigChange={handleCarSeatViewChange}
            isSyncing={isSyncingAvailability}
            onRefreshAvailability={() => syncTripAvailability(selectedTrip.id, true)}
            lastSyncedAt={lastSyncedAt}
          />

          {/* 24. LIVE SEAT SUMMARY CARD */}
          <div className="craft-card p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 flex-1 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Selected Seat
                </span>
                <span className="text-sm font-extrabold font-mono text-slate-950 mt-0.5 block">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Trip
                </span>
                <span className="text-sm font-extrabold text-slate-950 mt-0.5 block">
                  {selectedTrip.route.origin} → {selectedTrip.route.destination}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Date
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {new Date(selectedTrip.departureTime).toLocaleDateString('en-KE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Departure
                </span>
                <span className="text-sm font-extrabold font-mono text-slate-950 mt-0.5 block tabular-nums">
                  {new Date(selectedTrip.departureTime).toLocaleTimeString('en-KE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Fare
                </span>
                <span className="text-base font-extrabold font-mono text-slate-950 mt-0.5 block tabular-nums">
                  KSh {calculateTotalFare().toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 sm:gap-3 shrink-0">
              {!initialTrip && (
                <button
                  onClick={() => setStep(0)}
                  className="craft-btn-secondary px-4 py-2.5 text-xs font-bold min-h-[44px]"
                >
                  Change Trip
                </button>
              )}
              <button
                disabled={selectedSeats.length === 0 || isSyncingAvailability}
                onClick={handleProceedToPassengers}
                className="craft-btn-amber px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isSyncingAvailability ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                    <span>Checking Availability...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Passenger Details</span>
                    <ArrowRight className="w-4 h-4" />
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
                <label className="block text-xs font-black text-black mb-1">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="Optional for email receipt"
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

      {/* STEP 3: Payment (M-Pesa or Pay in Cash) */}
      {step === 3 && selectedTrip && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-neutral-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                  Booking Reference: {activeBooking?.bookingReference || 'TRP-PENDING'}
                </span>
                <h3 className="text-lg font-black text-black">
                  {paymentMethod === 'MPESA' ? 'Lipa na M-Pesa Payment' : 'Pay in Cash at Stage / Boarding'}
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

            {/* Payment Method Selector Tabs (M-Pesa vs Pay in Cash) */}
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block mb-2">
                Select Payment Method
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  id="pay-method-mpesa-btn"
                  onClick={() => {
                    setPaymentMethod('MPESA');
                    setPaymentError(null);
                  }}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    paymentMethod === 'MPESA'
                      ? 'bg-[#0A0A0A] text-white border-[#FFC300] shadow-md'
                      : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${
                        paymentMethod === 'MPESA'
                          ? 'bg-[#FFC300] text-[#0A0A0A]'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      <Phone className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-black block">Lipa na M-Pesa</span>
                      <span
                        className={`text-[11px] block ${
                          paymentMethod === 'MPESA' ? 'text-neutral-300' : 'text-neutral-500'
                        }`}
                      >
                        Paybill 400200 • Instant SMS Verification
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === 'MPESA' ? 'border-[#FFC300] bg-[#FFC300] text-[#0A0A0A]' : 'border-neutral-300'
                    }`}
                  >
                    {paymentMethod === 'MPESA' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>

                <button
                  type="button"
                  id="pay-method-cash-btn"
                  onClick={() => {
                    setPaymentMethod('CASH');
                    setPaymentError(null);
                  }}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    paymentMethod === 'CASH'
                      ? 'bg-[#0A0A0A] text-white border-[#FFC300] shadow-md'
                      : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${
                        paymentMethod === 'CASH'
                          ? 'bg-[#FFC300] text-[#0A0A0A]'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      <Banknote className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-black block">Pay in Cash</span>
                      <span
                        className={`text-[11px] block ${
                          paymentMethod === 'CASH' ? 'text-neutral-300' : 'text-neutral-500'
                        }`}
                      >
                        Pay KES at Stage Counter or Boarding
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === 'CASH' ? 'border-[#FFC300] bg-[#FFC300] text-[#0A0A0A]' : 'border-neutral-300'
                    }`}
                  >
                    {paymentMethod === 'CASH' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              </div>
            </div>

            {/* 26. STRIPE-INSPIRED TRIP SUMMARY & 28. PAYMENT STATE BANNER */}
            <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Trip Summary
                </span>
                <p className="text-base font-extrabold text-slate-950">
                  {selectedTrip.route.origin} → {selectedTrip.route.destination}
                </p>
                <p className="text-xs font-medium text-slate-700 font-mono">
                  {new Date(selectedTrip.departureTime).toLocaleDateString('en-KE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  •{' '}
                  {new Date(selectedTrip.departureTime).toLocaleTimeString('en-KE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="status-neutral font-mono">
                    Seat {selectedSeats.join(', ')}
                  </span>
                  <span className="status-neutral">
                    {activeChassisCapacity}-Seater
                  </span>
                </div>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 border-slate-200 pt-3 sm:pt-0">
                <span className="text-[11px] font-semibold text-slate-500 block">Total</span>
                <span className="text-xl font-extrabold font-mono text-slate-950 tabular-nums">
                  KSh {calculateTotalFare().toLocaleString()}
                </span>

                {/* 28. 4 Explicit Payment States */}
                <div className="mt-2">
                  {isProcessingPayment ? (
                    <span className="status-warning">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Pending: Waiting for confirmation</span>
                    </span>
                  ) : paymentError ? (
                    <span className="status-error">
                      <span>×</span>
                      <span>Payment not confirmed</span>
                    </span>
                  ) : (
                    <span className="status-positive">
                      <span>●</span>
                      <span>Ready to pay</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {paymentMethod === 'MPESA' ? (
              <>
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
                    <div className="p-4 bg-red-50 border border-red-200 text-red-900 text-xs rounded-xl space-y-2.5 animate-in fade-in">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                        <span>{paymentError}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleVerifyMpesaCode}
                          className="craft-btn-secondary text-[11px] py-1.5 px-3 font-bold"
                        >
                          Retry M-Pesa
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="craft-btn-secondary text-[11px] py-1.5 px-3 font-bold"
                        >
                          Try another number
                        </button>
                        <a
                          href="tel:+254724626199"
                          className="craft-btn-tertiary text-[11px] py-1.5 px-2 font-semibold"
                        >
                          Contact support (+254 724 626199)
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Official Cash Payment Instructions Card */}
                <div className="p-5 bg-[#0A0A0A] text-white rounded-2xl border-2 border-neutral-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#FFC300]" />
                      <span className="text-xs font-black text-[#FFC300] uppercase tracking-wider font-mono">
                        Stage Counter & Boarding Cash Payment
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">Official Cash Desk</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase block">1. Booking Reference</span>
                      <span className="font-mono font-black text-[#FFC300] text-base">
                        {activeBooking?.bookingReference || 'TRP-CASH'}
                      </span>
                    </div>

                    <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase block">2. Departure Stage</span>
                      <span className="font-black text-white text-sm flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#FFC300] flex-shrink-0" />
                        <span className="truncate">{selectedTrip.route.origin} Terminal</span>
                      </span>
                    </div>

                    <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase block">3. Cash Due</span>
                      <span className="font-mono font-black text-[#FFC300] text-base">
                        KES {calculateTotalFare().toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-neutral-300 space-y-1 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
                    <p className="font-bold text-[#FFC300] text-[11px]">How to Complete Cash Payment:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-neutral-300 font-medium">
                      <li>Confirm your cash reservation below to generate your official boarding pass.</li>
                      <li>Report to the <strong>{selectedTrip.route.origin} Stage Booking Desk</strong> at least <strong>30 minutes</strong> before departure.</li>
                      <li>Present your Booking Reference (<strong className="text-white font-mono">{activeBooking?.bookingReference}</strong>) and pay <strong className="text-white font-mono">KES {calculateTotalFare().toLocaleString()}</strong> in cash to the Station Agent or Captain.</li>
                    </ol>
                  </div>
                </div>

                {/* Confirm Cash Booking Box */}
                <div className="p-5 bg-amber-50/70 rounded-2xl border-2 border-amber-300 space-y-4">
                  <div>
                    <label htmlFor="cash-receipt-input" className="block text-xs font-black text-slate-950 uppercase tracking-wider">
                      Stage Cash Receipt Number (Optional)
                    </label>
                    <p className="text-[11px] text-slate-600">
                      If you have already paid cash at the stage desk, enter your receipt number below—or leave blank to pay upon arrival at the stage.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        id="cash-receipt-input"
                        type="text"
                        maxLength={16}
                        placeholder="Optional: e.g. CASH-4821 (or leave blank to pay at stage)"
                        value={cashReceiptInput}
                        onChange={(e) => {
                          setCashReceiptInput(e.target.value.toUpperCase());
                          setPaymentError(null);
                        }}
                        className="w-full px-4 py-3 text-sm font-mono font-bold text-slate-950 bg-white border-2 border-amber-400 rounded-xl focus:ring-3 focus:ring-amber-400/40 focus:outline-none placeholder:text-slate-400 uppercase shadow-inner"
                      />
                    </div>

                    <button
                      type="button"
                      id="confirm-cash-booking-btn"
                      disabled={isProcessingPayment}
                      onClick={handleConfirmCashPayment}
                      className="px-6 py-3 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all min-h-[48px] bg-[#0A0A0A] hover:bg-neutral-900 text-[#FFC300] border-2 border-[#0A0A0A] cursor-pointer hover:shadow-lg"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#FFC300]" />
                          <span>{paymentStatusText || 'Confirming...'}</span>
                        </>
                      ) : (
                        <>
                          <Banknote className="w-5 h-5 text-[#FFC300]" />
                          <span>Confirm Cash Booking & Get Ticket</span>
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
              </>
            )}
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
