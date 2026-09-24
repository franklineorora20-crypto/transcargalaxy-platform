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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Trip, Booking } from '../../types';
import { SeatSelector } from './SeatSelector';
import { DigitalTicket } from './DigitalTicket';
import { ApiService } from '../../services/api';

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
              `Seat ${conflicts.join(', ')} was just booked by another traveler in real-time and has been released.`
            );
            setTimeout(() => setRealtimeNotification(null), 6000);
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
    if (selectedSeats.includes(seatNumber)) {
      const updated = selectedSeats.filter((s) => s !== seatNumber);
      setSelectedSeats(updated);
      setPassengersData((prev) => prev.filter((p) => p.seatNumber !== seatNumber));
    } else {
      if (selectedSeats.length >= passengersCount) {
        // Automatically expand passenger count to match selected seats
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

  const calculateTotalFare = () => fareQuote?.total || 0;

  const handlePassengerChange = (index: number, field: 'fullName' | 'idNumber', value: string) => {
    const updated = [...passengersData];
    if (!updated[index]) return;
    updated[index][field] = value;
    setPassengersData(updated);
  };

  const validatePassengerDetails = () => {
    if (!contactName.trim() || !contactPhone.trim() || !contactEmail.trim()) {
      alert('Please provide the primary contact person details (Name, Phone number, and Email).');
      return false;
    }
    for (let i = 0; i < passengersData.length; i++) {
      const p = passengersData[i];
      if (!p.fullName.trim() || !p.idNumber.trim()) {
        alert(`Please complete the Full Name and ID/Passport number for Passenger in Seat ${p.seatNumber}.`);
        return false;
      }
    }
    return true;
  };

  const handleInitiateBookingAndPayment = async () => {
    if (!selectedTrip) return;
    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentStatusText('Reserving your seats and securing booking...');

    try {
      // Step 1: Create the booking in backend
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
      const refreshedTrip = await ApiService.getTripDetails(selectedTrip.id);
      setSelectedTrip(refreshedTrip);

      // Step 2: Trigger M-Pesa STK Push
      setPaymentStatusText(`Sending M-Pesa STK push prompt to ${contactPhone}...`);
      const stkResponse = await ApiService.initiateMpesaPayment({
        bookingReference: booking.bookingReference,
        phone: contactPhone,
        amount: booking.totalFareKsh,
      });
      if (stkResponse.pending) {
        setPaymentError('M-Pesa verification pending - admin must confirm.');
        return;
      }

      // Step 3: Simulate realistic STK push PIN entry countdown
      setPaymentStatusText('STK prompt sent to phone. Awaiting M-Pesa PIN confirmation...');
      await new Promise((resolve) => setTimeout(resolve, 2400));

      // Step 4: Verify payment
      setPaymentStatusText('Verifying M-Pesa transaction with Safaricom Daraja...');
      const verifyRes = await ApiService.verifyPayment({
        bookingReference: booking.bookingReference,
        checkoutRequestId: stkResponse.checkoutRequestId,
      });
      if (verifyRes.pending) {
        setPaymentError(verifyRes.message || 'M-Pesa verification pending - admin must confirm.');
        return;
      }

      setConfirmedBooking(verifyRes.booking);
      setStep(4); // Move to Digital Ticket step
    } catch (err: any) {
      setPaymentError(err.message || 'Payment processing could not be completed.');
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

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      {/* Step Indicator - Black, Gold, and White */}
      <div className="mb-8 bg-white p-4 rounded-2xl border-2 border-neutral-200 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { num: 1, label: 'Trip & Route' },
            { num: 2, label: 'Seat Selection' },
            { num: 3, label: 'Passenger Info' },
            { num: 4, label: 'Payment & M-Pesa' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors ${
                  step === s.num
                    ? 'bg-amber-400 text-black ring-4 ring-amber-400/30 border border-black'
                    : step > s.num
                    ? 'bg-black text-amber-400 border border-amber-400'
                    : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4 stroke-[3]" /> : s.num}
              </div>
              <span className="hidden sm:block text-xs font-bold text-neutral-700">{s.label}</span>
              {idx < 3 && <div className="hidden sm:block w-8 h-px bg-neutral-200" />}
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

          <div className="p-5 bg-white rounded-2xl border-2 border-neutral-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
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
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!initialTrip && (
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2.5 border-2 border-neutral-300 rounded-xl text-xs font-bold text-black hover:bg-neutral-100 cursor-pointer"
                >
                  Change Trip
                </button>
              )}
              <button
                disabled={selectedSeats.length === 0}
                onClick={() => setStep(2)}
                className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-md transition-all ${
                  selectedSeats.length > 0
                    ? 'bg-amber-400 hover:bg-amber-300 text-black border border-black cursor-pointer'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                <span>Continue to Passenger Details</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
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

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-neutral-300 rounded-xl text-xs font-bold text-black hover:bg-neutral-100 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Seats</span>
            </button>

            <button
              onClick={() => {
                if (validatePassengerDetails()) setStep(3);
              }}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all border border-black cursor-pointer"
            >
              <span>Review & Pay (KES {calculateTotalFare().toLocaleString()})</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & M-Pesa Payment */}
      {step === 3 && selectedTrip && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-neutral-200 shadow-sm space-y-5">
            <h3 className="text-lg font-black text-black border-b border-neutral-200 pb-3">
              Review Trip & Payment Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-neutral-500 block font-black uppercase">Route Corridor</span>
                  <p className="font-black text-black text-base">
                    {selectedTrip.route.origin} → {selectedTrip.route.destination}
                  </p>
                  <p className="text-xs text-neutral-600 font-medium">{selectedTrip.route.description}</p>
                </div>

                <div>
                  <span className="text-xs text-neutral-500 block font-black uppercase">Departure Schedule</span>
                  <p className="font-bold text-black">
                    {new Date(selectedTrip.departureTime).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'short' })} at{' '}
                    {new Date(selectedTrip.departureTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-neutral-500 block font-black uppercase">Assigned Bus</span>
                  <p className="font-bold text-black">
                    {selectedTrip.vehicle.registrationNumber} ({selectedTrip.vehicle.model})
                  </p>
                </div>
              </div>

              <div className="bg-neutral-50 p-4 rounded-xl border-2 border-neutral-200 space-y-3">
                <span className="text-xs font-black text-black uppercase tracking-wider block">Passengers & Seats</span>
                <div className="space-y-1.5">
                  {passengersData.map((p) => (
                    <div key={p.seatNumber} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-neutral-800">{p.fullName}</span>
                      <span className="font-mono font-black text-amber-400 bg-black px-2 py-0.5 rounded border border-neutral-800">
                        Seat {p.seatNumber}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-base font-black text-black">
                  <span>Total Amount Due:</span>
                  <span className="text-black bg-amber-400 font-mono px-3 py-1 rounded border border-black">
                    KES {calculateTotalFare().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-6 rounded-2xl border-2 border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-black">Select Payment Channel</h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 rounded-xl border-2 border-amber-400 bg-black text-left text-white shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-amber-400">Lipa na M-Pesa (Online STK Push)</span>
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                </div>
                <p className="text-xs mt-1 text-neutral-300">
                  Instant prompt sent to your phone <span className="font-bold text-white">{contactPhone}</span>. Enter PIN on handset.
                </p>
              </div>

            </div>

            {/* M-Pesa Credentials Info */}
            {paymentMethod === 'MPESA' && (
              <div className="p-4 rounded-xl bg-black text-white text-xs flex flex-wrap items-center justify-between gap-3 border-2 border-amber-400/40">
                <div className="space-y-0.5">
                  <span className="text-neutral-400 font-bold">Merchant Business Paybill:</span>
                  <p className="font-mono font-black text-amber-400 text-sm">174379</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-neutral-400 font-bold">Account Reference:</span>
                  <p className="font-mono font-black text-white text-sm">TRANSCAR-{selectedTrip.tripCode.split('-')[1]}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-neutral-400 font-bold">Target Phone:</span>
                  <p className="font-mono font-bold text-amber-400 text-sm">{contactPhone}</p>
                </div>
              </div>
            )}

            {paymentError && (
              <div className="p-3 bg-neutral-900 border border-rose-500 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{paymentError}</span>
              </div>
            )}
          </div>

          {/* Payment Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={isProcessingPayment}
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-neutral-300 rounded-xl text-xs font-bold text-black hover:bg-neutral-100 disabled:opacity-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              id="confirm-pay-btn"
              disabled={isProcessingPayment}
              onClick={handleInitiateBookingAndPayment}
              className={`px-8 py-3 rounded-xl font-black text-sm shadow-lg flex items-center gap-2 transition-all cursor-pointer ${
                isProcessingPayment
                  ? 'bg-neutral-400 text-black cursor-wait'
                  : 'bg-amber-400 hover:bg-amber-300 text-black border-2 border-black'
              }`}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>{paymentStatusText || 'Processing Payment...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-black" />
                  <span>Pay KES {calculateTotalFare().toLocaleString()} via M-Pesa</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
