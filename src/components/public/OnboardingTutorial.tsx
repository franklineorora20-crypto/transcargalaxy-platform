import React, { useState, useEffect, useCallback } from 'react';
import {
  Bus,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  User,
  Phone,
  ShieldCheck,
  CreditCard,
  Banknote,
  Ticket,
  Navigation,
  RotateCcw,
  Check,
  QrCode,
  HelpCircle,
  Play,
  Pointer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandName } from '../common/BrandName';
import { CAR_SEAT_VIEW_SEATS } from './SeatSelector';

export const ONBOARDING_STORAGE_KEY = 'transcar_galaxy_onboarding_seen_v1';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBookingNow: () => void;
}

interface TutorialStepMeta {
  stepNumber: number; // 1..8
  badge: string;
  instructionTitle: string;
  description: string;
}

const STEPS: TutorialStepMeta[] = [
  {
    stepNumber: 1,
    badge: 'Welcome',
    instructionTitle: 'Welcome to TransCar',
    description: 'Your simple way to find routes, check trips and book your seat.',
  },
  {
    stepNumber: 2,
    badge: 'Step 1 of 7',
    instructionTitle: '1. Choose your route',
    description: "Select where you're travelling from and your destination to see available trips.",
  },
  {
    stepNumber: 3,
    badge: 'Step 2 of 7',
    instructionTitle: '2. Choose a trip',
    description:
      'Compare available departure times, vehicle information and trip details, then select the trip that works for you.',
  },
  {
    stepNumber: 4,
    badge: 'Step 3 of 7',
    instructionTitle: '3. Choose your seat',
    description:
      'Select an available seat from the vehicle layout. Occupied seats are clearly marked so you can choose an available position.',
  },
  {
    stepNumber: 5,
    badge: 'Step 4 of 7',
    instructionTitle: '4. Enter your details',
    description:
      'Provide the passenger information required to complete your booking. Check your phone number carefully so you can receive important booking information.',
  },
  {
    stepNumber: 6,
    badge: 'Step 5 of 7',
    instructionTitle: '5. Check your booking',
    description:
      'Review your route, travel date, departure time, passenger details, seat number and fare before confirming.',
  },
  {
    stepNumber: 7,
    badge: 'Step 6 of 7',
    instructionTitle: '6. Complete your booking',
    description:
      'Follow the payment instructions shown on screen. Once your booking is confirmed, keep your booking reference for easy verification.',
  },
  {
    stepNumber: 8,
    badge: 'Step 7 of 7',
    instructionTitle: '7. Keep your booking details',
    description:
      'Use your booking reference to identify your trip and present the required information when boarding.',
  },
];

/**
 * Simulated finger/cursor indicator for guided demonstrations
 */
const SimulatedCursor: React.FC<{
  x: string | number;
  y: string | number;
  clicking?: boolean;
  label?: string;
}> = ({ x, y, clicking = false, label }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{
      left: x,
      top: y,
      opacity: 1,
      scale: clicking ? 0.9 : 1,
    }}
    transition={{
      left: { type: 'spring', stiffness: 180, damping: 22 },
      top: { type: 'spring', stiffness: 180, damping: 22 },
      scale: { duration: 0.15 },
      opacity: { duration: 0.2 },
    }}
    className="pointer-events-none absolute z-30 flex flex-col items-start"
  >
    <div className="relative flex items-center justify-center">
      {clicking && (
        <motion.span
          initial={{ scale: 0.6, opacity: 0.9 }}
          animate={{ scale: 2.1, opacity: 0 }}
          transition={{ duration: 0.7, repeat: Infinity }}
          className="absolute w-8 h-8 rounded-full bg-amber-400/60"
        />
      )}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 transition-colors ${
          clicking
            ? 'bg-amber-400 text-slate-950 border-white'
            : 'bg-slate-950/90 text-amber-400 border-amber-400'
        }`}
      >
        <Pointer className="w-4 h-4 -rotate-12" />
      </div>
    </div>
    {label && (
      <span className="mt-1 px-2 py-0.5 rounded-md bg-slate-950 text-amber-400 font-mono text-[10px] font-bold shadow-md border border-slate-800 whitespace-nowrap">
        {label}
      </span>
    )}
  </motion.div>
);

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  isOpen,
  onClose,
  onStartBookingNow,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0..7 corresponding to STEPS 1..8
  const [animPhase, setAnimPhase] = useState(0);

  // Interactive state inside Step 4 (Seat Selection Demo) so users can also tap seats or switch Car Seat Views
  const [demoCarView, setDemoCarView] = useState<11 | 14 | 16>(14);
  const [demoSelectedSeat, setDemoSelectedSeat] = useState<string>('1A');

  // Interactive state inside Step 7 (Payment method preview)
  const [demoPaymentMethod, setDemoPaymentMethod] = useState<'MPESA' | 'CASH'>('MPESA');

  // Reset to Step 1 whenever tutorial is opened fresh
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setAnimPhase(0);
      setDemoCarView(14);
      setDemoSelectedSeat('1A');
      setDemoPaymentMethod('MPESA');
    }
  }, [isOpen]);

  // Step-internal choreographed animation timer
  useEffect(() => {
    if (!isOpen) return;
    setAnimPhase(0);

    const timers: Array<ReturnType<typeof setTimeout>> = [];
    timers.push(setTimeout(() => setAnimPhase(1), 650));
    timers.push(setTimeout(() => setAnimPhase(2), 1500));
    timers.push(setTimeout(() => setAnimPhase(3), 2450));
    timers.push(setTimeout(() => setAnimPhase(4), 3300));
    timers.push(setTimeout(() => setAnimPhase(5), 4100));
    timers.push(setTimeout(() => setAnimPhase(6), 4900));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isOpen, currentStepIndex]);

  const markSeenAndClose = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage errors in private browsing
    }
    onClose();
  }, [onClose]);

  const handleFinishAndBook = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
    onStartBookingNow();
  }, [onStartBookingNow]);

  const goNext = useCallback(() => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinishAndBook();
    }
  }, [currentStepIndex, handleFinishAndBook]);

  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  // Keyboard navigation (Escape, ArrowRight, ArrowLeft)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        markSeenAndClose();
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, markSeenAndClose, goNext, goPrev]);

  if (!isOpen) return null;

  const currentMeta = STEPS[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / STEPS.length) * 100);

  // Demo occupied seats for Step 4
  const demoOccupiedSeats = new Set(['P2', '1B', '2B', '3C']);
  const validSeatsForDemoView = CAR_SEAT_VIEW_SEATS[demoCarView];

  const renderDemoSeat = (seatId: string, isWindow = false) => {
    const isOccupied = demoOccupiedSeats.has(seatId);
    const isSelected = demoSelectedSeat === seatId && animPhase >= 2;
    const shouldPulse = !isOccupied && !isSelected && animPhase >= 1;

    return (
      <button
        key={seatId}
        type="button"
        disabled={isOccupied}
        onClick={() => {
          if (!isOccupied && validSeatsForDemoView.includes(seatId)) {
            setDemoSelectedSeat(seatId);
            setAnimPhase(3);
          }
        }}
        className={`relative flex flex-col items-center justify-center w-10 h-11 sm:w-11 sm:h-12 rounded-xl font-mono text-[11px] font-bold transition-all ${
          isOccupied
            ? 'bg-slate-900/70 border border-slate-800 text-slate-600 cursor-not-allowed'
            : isSelected
            ? 'bg-amber-400 text-slate-950 border-2 border-amber-300 shadow-md font-black ring-2 ring-amber-400/40 scale-105'
            : `bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-amber-400 cursor-pointer ${
                shouldPulse ? 'ring-1 ring-amber-400/40 animate-pulse' : ''
              }`
        }`}
      >
        <span className="text-xs font-black leading-none">{seatId}</span>
        <span className="text-[8px] font-sans font-medium mt-0.5 opacity-80">
          {isSelected ? 'Selected' : isOccupied ? 'Booked' : isWindow ? 'Window' : 'Seat'}
        </span>
      </button>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop click to dismiss */}
      <div className="fixed inset-0" onClick={markSeenAndClose} aria-hidden="true" />

      {/* Main Tutorial Card */}
      <motion.div
        key="onboarding-shell"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden my-auto"
      >
        {/* Top Brand & Progress Bar Header */}
        <div className="bg-slate-950 text-white px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandName className="font-extrabold text-base sm:text-lg tracking-tight text-white" />
            <span className="text-slate-700 font-mono">|</span>
            <span className="text-[11px] font-mono font-semibold text-amber-400 truncate">
              {currentMeta.badge}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnimPhase(0)}
              title="Replay step animation"
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={markSeenAndClose}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Skip Tutorial</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Smooth Progress Line */}
        <div className="w-full h-1 bg-slate-900 overflow-hidden">
          <motion.div
            className="h-full bg-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Step Content Container */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[calc(100dvh-150px)] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMeta.stepNumber}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* ================================================================= */}
              {/* STEP 1 — WELCOME                                                  */}
              {/* ================================================================= */}
              {currentMeta.stepNumber === 1 && (
                <div className="text-center space-y-5 py-2">
                  {/* Subtle Fade-In TransCar Identity Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-amber-400 text-xs font-mono font-semibold shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Interactive Passenger Guide • Under 1 Minute</span>
                  </motion.div>

                  <div className="space-y-2 max-w-lg mx-auto">
                    <h2
                      id="onboarding-title"
                      className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight"
                    >
                      Welcome to TransCar
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Your simple way to find routes, check trips and book your seat.
                    </p>
                  </div>

                  {/* Animated Illustration: TransCar Vehicle Travelling Along Route */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 sm:p-6 text-white relative overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-6">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <MapPin className="w-4 h-4" />
                        <span>Rongai (Next to Isalu Center)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 hidden sm:inline">
                        Narok • Bomet Corridor
                      </span>
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <span>Kisii Main Stage</span>
                        <MapPin className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Route Track + Animated Shuttle */}
                    <div className="relative py-5 px-2">
                      {/* Base dashed route line */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full relative overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-amber-300 rounded-full"
                          initial={{ width: '12%' }}
                          animate={{ width: ['12%', '88%', '12%'] }}
                          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </div>

                      {/* Route Stops Dots */}
                      <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                      </div>

                      {/* Moving TransCar Shuttle */}
                      <motion.div
                        className="absolute top-1/2 -translate-y-1/2 -mt-1"
                        initial={{ left: '8%' }}
                        animate={{ left: ['8%', '78%', '8%'] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-mono text-[11px] font-black shadow-lg border-2 border-white">
                          <Bus className="w-4 h-4 text-slate-950" />
                          <span>TransCar PSV</span>
                        </div>
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/90 text-left text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-amber-400 font-mono font-bold block">11 • 14 • 16</span>
                        <span className="text-slate-400">PSV Seat Layouts</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-emerald-400 font-mono font-bold block">M-Pesa & Cash</span>
                        <span className="text-slate-400">Instant Confirmation</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-white font-mono font-bold block">QR Ticket</span>
                        <span className="text-slate-400">Easy Stage Boarding</span>
                      </div>
                    </div>
                  </div>

                  {/* Welcome Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={goNext}
                      className="craft-btn-amber w-full sm:w-auto px-6 py-3 text-sm font-extrabold min-h-[46px]"
                    >
                      <Play className="w-4 h-4 mr-2 fill-slate-950" />
                      Start Tour
                    </button>
                    <button
                      type="button"
                      onClick={markSeenAndClose}
                      className="craft-btn-secondary w-full sm:w-auto px-5 py-3 text-sm font-semibold min-h-[46px]"
                    >
                      Skip for Now
                    </button>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* STEP 2..8 HEADER INSTRUCTION BLOCK                                */}
              {/* ================================================================= */}
              {currentMeta.stepNumber > 1 && (
                <div className="space-y-1">
                  <h2
                    id="onboarding-title"
                    className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight"
                  >
                    {currentMeta.instructionTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {currentMeta.description}
                  </p>
                </div>
              )}

              {/* ================================================================= */}
              {/* STEP 2 — FIND YOUR ROUTE                                          */}
              {/* ================================================================= */}
              {currentMeta.stepNumber === 2 && (
                <div className="relative bg-slate-50 rounded-2xl border-2 border-amber-400 p-4 sm:p-5 space-y-4 shadow-inner overflow-hidden">
                  {/* Spotlight Glow Header */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Route Search Bar Spotlight
                    </span>
                    <span>Simulated Preview</span>
                  </div>

                  {/* Simulated Route Search Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm relative">
                    {/* From */}
                    <div
                      className={`p-2.5 rounded-xl border transition-all ${
                        animPhase >= 1
                          ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-400/30'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        From (Origin)
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 font-bold text-xs sm:text-sm text-slate-900">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Rongai (Next to Isalu Center)</span>
                      </div>
                    </div>

                    {/* To */}
                    <div
                      className={`p-2.5 rounded-xl border transition-all ${
                        animPhase >= 2
                          ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-400/30'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        To (Destination)
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 font-bold text-xs sm:text-sm text-slate-900">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{animPhase >= 2 ? 'Kisii Main Stage' : 'Select destination...'}</span>
                      </div>
                    </div>

                    {/* Search Button */}
                    <div className="flex items-stretch">
                      <div
                        className={`w-full rounded-xl flex items-center justify-center gap-1.5 font-extrabold text-xs px-3 py-2.5 transition-all ${
                          animPhase >= 3
                            ? 'bg-amber-400 text-slate-950 scale-[0.98] ring-2 ring-amber-400/50 shadow-sm'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        <span>Find Trips</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Simulated Finger/Cursor */}
                    <SimulatedCursor
                      x={animPhase === 0 ? '14%' : animPhase === 1 ? '18%' : animPhase === 2 ? '52%' : '82%'}
                      y={animPhase === 0 ? '55%' : animPhase === 1 ? '48%' : animPhase === 2 ? '48%' : '52%'}
                      clicking={animPhase === 1 || animPhase === 2 || animPhase === 3}
                      label={
                        animPhase <= 1
                          ? 'Select Origin: Rongai'
                          : animPhase === 2
                          ? 'Select Destination: Kisii'
                          : 'Tap Find Trips'
                      }
                    />
                  </div>

                  {/* Appearing Route Results */}
                  <AnimatePresence>
                    {animPhase >= 3 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-emerald-950 text-white border border-emerald-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            <strong>3 Scheduled Express Shuttles</strong> found for{' '}
                            <strong className="text-amber-400">Rongai → Kisii</strong>
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-emerald-300 hidden sm:inline">
                          KES 1,500
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ================================================================= */}
              {/* STEP 3 — CHOOSE YOUR TRIP                                         */}
              {/* ================================================================= */}
              {currentMeta.stepNumber === 3 && (
                <div className="relative bg-slate-50 rounded-2xl border-2 border-amber-400 p-4 sm:p-5 space-y-3 shadow-inner overflow-hidden">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span className="font-bold text-slate-900">Available Departures: Rongai → Kisii</span>
                    {animPhase >= 2 && (
                      <motion.span
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md font-sans font-bold text-[11px]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Trip selected
                      </motion.span>
                    )}
                  </div>

                  <div className="space-y-2.5 relative">
                    {/* Trip Card 1 (Highlighted & Selected) */}
                    <div
                      onClick={() => setAnimPhase(2)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        animPhase >= 2
                          ? 'bg-slate-950 text-white border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                          : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-amber-500">07:30 AM</span>
                            <span className="text-xs font-bold">Rongai (Next to Isalu Center) → Kisii</span>
                          </div>
                          <p
                            className={`text-[11px] font-mono ${
                              animPhase >= 2 ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            Vehicle: KDV 149E • 14-Seater Express Shuttle • 10 Seats Open
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono font-extrabold text-sm block">KES 1,500</span>
                            <span
                              className={`text-[10px] block ${
                                animPhase >= 2 ? 'text-emerald-400' : 'text-emerald-600'
                              }`}
                            >
                              Instant Seat Map
                            </span>
                          </div>
                          <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors ${
                              animPhase >= 2
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-900 text-white'
                            }`}
                          >
                            {animPhase >= 2 ? 'Trip Selected ✓' : 'Select Trip'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trip Card 2 (Comparison Option) */}
                    <div className="p-3 rounded-xl bg-white/80 border border-slate-200 text-slate-700 opacity-75">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">09:00 AM</span>
                            <span className="text-xs font-semibold">Rongai (Next to Isalu Center) → Kisii</span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-500">
                            Vehicle: KDE 416Q • 11-Seater VIP Shuttle • 8 Seats Open
                          </p>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-900">KES 1,500</span>
                      </div>
                    </div>

                    <SimulatedCursor
                      x={animPhase < 1 ? '45%' : '82%'}
                      y={animPhase < 1 ? '72%' : '32%'}
                      clicking={animPhase >= 1 && animPhase <= 2}
                      label={animPhase >= 2 ? 'Trip selected' : 'Tap Select Trip'}
                    />
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* STEP 4 — SELECT YOUR SEAT (AUTHENTIC TRANSCAR PSV SEAT LAYOUT)    */}
              {/* ================================================================= */}
              {currentMeta.stepNumber === 4 && (
                <div className="relative bg-slate-50 rounded-2xl border-2 border-amber-400 p-4 sm:p-5 space-y-3.5 shadow-inner">
                  {/* Car Seat View Selector Tabs + Confirmation Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                      {([11, 14, 16] as const).map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => {
                            setDemoCarView(cap);
                            setDemoSelectedSeat('1A');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                            demoCarView === cap
                              ? 'bg-slate-950 text-amber-400'
                              : 'text-slate-600 hover:text-slate-950'
                          }`}
                        >
                          {cap}-Seater View
                        </button>
                      ))}
                    </div>

                    {animPhase >= 2 && (
                      <motion.span
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg font-mono font-black text-xs shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Seat selected: {demoSelectedSeat}
                      </motion.span>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block" />
                      Available
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                      <span className="w-3 h-3 rounded bg-amber-400 border border-amber-300 inline-block" />
                      Selected
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-3 h-3 rounded bg-slate-900/70 border border-slate-800 inline-block" />
                      Occupied
                    </span>
                  </div>

                  {/* Authentic TransCar RHD Cabin Map */}
                  <div className="relative w-fit mx-auto bg-slate-950 text-white rounded-2xl border border-slate-800 p-3.5 sm:p-4 shadow-lg min-w-[250px]">
                    <div className="text-center mb-2.5 pb-1.5 border-b border-slate-800">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                        TransCar {demoCarView}-Seater PSV Layout
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        ▲ Front Windscreen • Tap any open seat
                      </span>
                    </div>

                    {/* Front Row: P1, P2 + Right-Hand Drive Driver */}
                    <div className="mb-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {renderDemoSeat('P1', true)}
                          {renderDemoSeat('P2', false)}
                        </div>
                        <div className="w-2 text-center text-[8px] font-mono text-slate-600">•</div>
                        <div className="flex flex-col items-center justify-center w-10 h-11 sm:w-11 sm:h-12 rounded-xl bg-slate-900 border border-slate-700 text-slate-400">
                          <span className="text-[8px] font-mono font-bold uppercase text-amber-400">
                            Driver
                          </span>
                          <span className="text-[7px] font-mono text-slate-500">RHD</span>
                        </div>
                      </div>
                    </div>

                    {/* Passenger Cabin Rows matching SeatSelector.tsx */}
                    <div className="space-y-1.5">
                      {/* Row 1 */}
                      <div className="flex items-center justify-center gap-2">
                        <div>{renderDemoSeat('1A', true)}</div>
                        <div className="w-2 text-center text-[7px] font-mono text-slate-700">|</div>
                        <div className="flex items-center gap-1.5">
                          {renderDemoSeat('1B', false)}
                          {renderDemoSeat('1C', true)}
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="flex items-center justify-center gap-2">
                        <div>{renderDemoSeat('2A', true)}</div>
                        <div className="w-2 text-center text-[7px] font-mono text-slate-700">|</div>
                        <div className="flex items-center gap-1.5">
                          {renderDemoSeat('2B', false)}
                          {renderDemoSeat('2C', true)}
                        </div>
                      </div>

                      {demoCarView === 11 && (
                        <div className="pt-1.5 border-t border-slate-800 flex items-center justify-center gap-1.5">
                          {renderDemoSeat('3A', true)}
                          {renderDemoSeat('3B', false)}
                          {renderDemoSeat('3C', true)}
                        </div>
                      )}

                      {demoCarView === 14 && (
                        <>
                          <div className="flex items-center justify-center gap-2">
                            <div>{renderDemoSeat('3A', true)}</div>
                            <div className="w-2 text-center text-[7px] font-mono text-slate-700">|</div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-10 sm:w-11 h-11 sm:h-12 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-[8px] font-mono text-slate-600">
                                Pass
                              </div>
                              {renderDemoSeat('3C', true)}
                            </div>
                          </div>
                          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-center gap-1">
                            {renderDemoSeat('4A', true)}
                            {renderDemoSeat('4B', false)}
                            {renderDemoSeat('4C', false)}
                            {renderDemoSeat('4D', true)}
                          </div>
                        </>
                      )}

                      {demoCarView === 16 && (
                        <>
                          <div className="flex items-center justify-center gap-2">
                            <div>{renderDemoSeat('3A', true)}</div>
                            <div className="w-2 text-center text-[7px] font-mono text-slate-700">|</div>
                            <div className="flex items-center gap-1.5">
                              {renderDemoSeat('3B', false)}
                              {renderDemoSeat('3C', true)}
                            </div>
                          </div>
                          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-center gap-1">
                            {renderDemoSeat('5A', true)}
                            {renderDemoSeat('5B', false)}
                            {renderDemoSeat('5C', false)}
                            {renderDemoSeat('5D', true)}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Cursor tapping seat 1A */}
                    <SimulatedCursor
                      x={animPhase < 1 ? '65%' : '22%'}
                      y={animPhase < 1 ? '25%' : '44%'}
                      clicking={animPhase >= 2}
                      label={animPhase >= 2 ? 'Seat selected' : 'Tap Seat 1A'}
                    />
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* STEP 5 — ENTER PASSENGER DETAILS                                  */}
              {/* ================================================================= */}
              {currentMeta.stepNumber === 5 && (
                <div className="relative bg-slate-50 rounded-2xl border-2 border-amber-400 p-4 sm:p-5 space-y-3.5 shadow-inner overflow-hidden">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span className="font-bold text-slate-900">Passenger Manifest & Contact Info</span>
                    <span className="text-amber-700 font-semibold">Seat {demoSelectedSeat}</span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 relative">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Passenger Name */}
                      <div
                        className={`p-3 rounded-xl border transition-all ${
                          animPhase >= 1
                            ? 'border-amber-400 bg-amber-50/30 ring-2 ring-amber-400/20'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Full Name (Seat {demoSelectedSeat})
                        </label>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-slate-900">
                          <User className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{animPhase >= 1 ? 'John Doe' : 'Enter full name...'}</span>
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div
                        className={`p-3 rounded-xl border transition-all ${
                          animPhase >= 2
                            ? 'border-amber-400 bg-amber-50/30 ring-2 ring-amber-400/20'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          M-Pesa / SMS Phone Number
                        </label>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-slate-900">
                          <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{animPhase >= 2 ? '07XX XXX XXX' : '07XX XXX XXX'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-2 text-[11px] text-slate-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Your phone number is used to send your booking reference and M-Pesa payment prompt.
                      </span>
                    </div>

                    <SimulatedCursor
                      x={animPhase <= 1 ? '28%' : '72%'}
                      y={animPhase <= 1 ? '38%' : '38%'}
                      clicking={animPhase === 1 || animPhase === 2}
                      label={animPhase <= 1 ? 'Name: John Doe' : 'Phone: 07XX XXX XXX'}
                    />
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* STEP 6 — REVIEW YOUR BOOKING                                      */}
              {/* ================================================================= */}
              {currentMeta.stepNumber === 6 && (
                <div className="relative bg-slate-50 rounded-2xl border-2 border-amber-400 p-4 sm:p-5 space-y-3.5 shadow-inner overflow-hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: 'Route', value: 'Rongai → Kisii', phase: 1 },
                      { label: 'Date', value: 'Today', phase: 2 },
                      { label: 'Time', value: '07:30 AM', phase: 3 },
                      { label: 'Seat', value: `${demoSelectedSeat} (${demoCarView}S)`, phase: 4 },
                      { label: 'Passenger', value: 'John Doe', phase: 5 },
                      { label: 'Fare', value: 'KES 1,500', phase: 6 },
                    ].map((item) => {
                      const verified = animPhase >= item.phase;
                      return (
                        <div
                          key={item.label}
                          className={`p-2.5 rounded-xl border transition-all ${
                            verified
                              ? 'bg-white border-emerald-400 shadow-sm ring-1 ring-emerald-400/30'
                              : 'bg-white/70 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-500">
                            <span>{item.label}</span>
                            {verified && (
                              <span className="text-emerald-600 font-mono font-black">✓</span>
                            )}
                          </div>
                          <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-950 block mt-0.5 truncate">
                            {item.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Highlighted Confirm Booking Button */}
                  <div className="pt-1 relative">
                    <div
                      className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                        animPhase >= 6
                          ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/40 shadow-lg scale-[0.99]'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Booking</span>
                    </div>

                    {animPhase >= 5 && (
                      <SimulatedCursor
                        x="62%"
                        y="25%"
                        clicking={animPhase >= 6}
                        label="Confirm Booking ✓"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* STEP 7 — PAYMENT / BOOKING CONFIRMATION                           */}
              {/* ================================================================= */}
              {currentMeta.stepNumber === 7 && (
                <div className="relative bg-slate-50 rounded-2xl border-2 border-amber-400 p-4 sm:p-5 space-y-3.5 shadow-inner">
                  {/* Payment Method Toggle (M-Pesa or Pay in Cash) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDemoPaymentMethod('MPESA')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        demoPaymentMethod === 'MPESA'
                          ? 'bg-emerald-950 text-white border-emerald-700 ring-2 ring-emerald-500/30'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-extrabold block">M-Pesa Express</span>
                        <span className="text-[10px] opacity-80 block">STK Prompt / Paybill</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoPaymentMethod('CASH')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        demoPaymentMethod === 'CASH'
                          ? 'bg-slate-900 text-amber-400 border-slate-800 ring-2 ring-amber-400/30'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-xs font-extrabold block">Pay in Cash</span>
                        <span className="text-[10px] opacity-80 block">Pay at Stage Office</span>
                      </div>
                    </button>
                  </div>

                  {/* Animated Confirmation Card */}
                  <motion.div
                    initial={{ opacity: 0.9, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-950 text-white rounded-xl border border-slate-800 p-4 space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">
                          ✓
                        </span>
                        <span className="font-extrabold text-sm text-emerald-400">
                          Booking Confirmed ✓
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {demoPaymentMethod === 'MPESA' ? 'M-Pesa Verified' : 'Cash Reserved'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">
                          Official Booking Reference
                        </span>
                        <span className="font-mono font-black text-base sm:text-lg text-amber-400 tracking-wider">
                          Booking Reference: TR-XXXX
                        </span>
                      </div>
                      <div className="text-left sm:text-right font-mono text-xs text-slate-300">
                        <div>Seat {demoSelectedSeat} • KES 1,500</div>
                        <div className="text-[10px] text-slate-400">Demo Preview Only</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* ================================================================= */}
              {/* STEP 8 — YOUR BOOKING & READY TO TRAVEL                           */}
              {/* ================================================================= */}
              {currentMeta.stepNumber === 8 && (
                <div className="space-y-4">
                  {/* Digital Boarding Pass & Tracking Preview */}
                  <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                          Digital Boarding Pass
                        </span>
                        <h3 className="text-base font-extrabold text-white">
                          Rongai (Next to Isalu Center) → Kisii Main Stage
                        </h3>
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-mono font-black text-xs">
                        Ref: TR-XXXX
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <div className="sm:col-span-2 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Passenger</span>
                          <span className="font-bold text-white">John Doe</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Reserved Seat</span>
                          <span className="font-bold text-amber-400">
                            Seat {demoSelectedSeat} ({demoCarView}S)
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Retrieve Anytime</span>
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <Ticket className="w-3.5 h-3.5" /> Boarding Pass
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Live Corridor GPS</span>
                          <span className="font-bold text-amber-300 flex items-center gap-1">
                            <Navigation className="w-3.5 h-3.5" /> Bus Radar
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center p-3 bg-white text-slate-950 rounded-xl">
                        <QrCode className="w-12 h-12 text-slate-950" />
                        <span className="font-mono font-bold text-[10px] mt-1">
                          Present at Boarding
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Final Completion CTA Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStepIndex(0);
                        setAnimPhase(0);
                      }}
                      className="craft-btn-secondary w-full sm:w-auto text-xs px-4 py-2.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Replay Tutorial
                    </button>

                    <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={markSeenAndClose}
                        className="craft-btn-secondary w-full sm:w-auto text-xs px-4 py-2.5"
                      >
                        Explore Website
                      </button>
                      <button
                        type="button"
                        onClick={handleFinishAndBook}
                        className="craft-btn-amber w-full sm:w-auto text-xs sm:text-sm font-extrabold px-5 py-2.5"
                      >
                        <span>Book Your Seat Now</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Step Dots & Next/Back Controls */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Interactive Step Progress Dots */}
          <div className="flex items-center gap-1.5" aria-label="Tutorial steps">
            {STEPS.map((s, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              return (
                <button
                  key={s.stepNumber}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  title={s.instructionTitle}
                  aria-label={`Go to ${s.instructionTitle}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    isCurrent
                      ? 'w-6 bg-amber-500'
                      : isCompleted
                      ? 'w-2 bg-slate-900'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              );
            })}
          </div>

          {/* Back / Next Navigation */}
          <div className="flex items-center gap-2 ml-auto">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="craft-btn-secondary text-xs px-3.5 py-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </button>
            )}

            {currentStepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="craft-btn-primary text-xs px-4 py-2"
              >
                <span>{currentStepIndex === 0 ? 'Start Tour' : 'Next Step'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-amber-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishAndBook}
                className="craft-btn-amber text-xs px-4 py-2 font-extrabold"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Finish & Book
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
