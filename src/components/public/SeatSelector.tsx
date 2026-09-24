import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  Armchair,
  X,
  Sparkles,
  User,
  AlertCircle,
  Info,
  CheckCircle2,
  Compass,
  Zap,
  RefreshCw,
  Radio,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Trip } from '../../types';

export interface SeatSelectorProps {
  trip: Trip;
  selectedSeats: string[];
  onSeatToggle: (seatNumber: string, isExecutive?: boolean) => void;
  maxSeats: number;
  configCapacity?: 11 | 14 | 16;
  onConfigChange?: (capacity: 11 | 14 | 16) => void;
  isSyncing?: boolean;
  onRefreshAvailability?: () => void;
  lastSyncedAt?: Date;
}

export const SeatSelector: React.FC<SeatSelectorProps> = ({
  trip,
  selectedSeats,
  onSeatToggle,
  maxSeats,
  configCapacity,
  onConfigChange,
  isSyncing = false,
  onRefreshAvailability,
  lastSyncedAt,
}) => {
  const bookedSet = React.useMemo(() => new Set(trip.bookedSeatNumbers || []), [trip.bookedSeatNumbers]);

  // Determine initial capacity dynamically from trip vehicle specs or prop
  const detectedCapacity: 11 | 14 | 16 = React.useMemo(() => {
    if (configCapacity && [11, 14, 16].includes(configCapacity)) return configCapacity;
    const cap = trip.vehicle?.seatingCapacity || trip.totalSeats;
    if (cap === 11) return 11;
    if (cap === 16) return 16;
    if (trip.vehicle?.registrationNumber?.replace(/\s/g, '').toUpperCase() === 'KDE416Q') return 11;
    return 14;
  }, [configCapacity, trip.vehicle?.seatingCapacity, trip.totalSeats, trip.vehicle?.registrationNumber]);

  const [activeConfigTab, setActiveConfigTab] = useState<11 | 14 | 16>(detectedCapacity);
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  // Sync state if detected capacity changes externally
  useEffect(() => {
    setActiveConfigTab(detectedCapacity);
  }, [detectedCapacity]);

  const handleTabChange = (cap: 11 | 14 | 16) => {
    setActiveConfigTab(cap);
    if (onConfigChange) {
      onConfigChange(cap);
    }
  };

  const isElevenSeater = activeConfigTab === 11;
  const isSixteenSeater = activeConfigTab === 16;
  const isFourteenSeater = activeConfigTab === 14;

  const totalSeatsInConfig = activeConfigTab;
  const occupiedCount = bookedSet.size;
  const availableCount = Math.max(0, totalSeatsInConfig - occupiedCount);
  const occupancyPercentage = Math.min(100, Math.round((occupiedCount / totalSeatsInConfig) * 100));

  const getCoachConfigTitle = () => {
    if (isSixteenSeater) return '16-Seater Toyota HiAce Grand Cabin (High-Roof Long Wheelbase)';
    if (isElevenSeater) return '11-Seater Toyota HiAce Custom (Executive VIP Class)';
    return '14-Seater Toyota HiAce Commuter (Standard Intercity Shuttle)';
  };

  const getSeatDescription = (seatNum: string) => {
    if (seatNum === '1A') return 'Front Co-Driver Panoramic Window (Scenic View & Extra Legroom)';
    if (seatNum === '1B') return 'Front Center Passenger Seat (Direct Dash Access & Extra Legroom)';
    if (seatNum === '2A') return 'Forward Left Window Seat (Direct Sliding Door Entry Access)';
    if (seatNum.endsWith('A')) return 'Left Window Seat (Scenic Mountain & Valley Panorama)';
    if (seatNum.endsWith('C')) return 'Right Window Seat (Driver-side Scenic Highway View)';
    if (seatNum === '4B' || seatNum === '5B') return 'Central Bench Seat (Direct Aisle Walkway Access)';
    if (seatNum === '6A' || seatNum === '6B') return 'Rear High-Capacity Cabin Seat (Comfort Rear Row)';
    return 'Comfort Ergonomic Aisle Seat';
  };

  const renderSeatButton = (
    seatNum: string,
    isOccupied: boolean,
    isWindow = false,
    isBench = false,
    isExtraLegroom = false
  ) => {
    const isSelected = selectedSeats.includes(seatNum);

    return (
      <motion.button
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: isSelected ? 1.05 : 1 }}
        whileHover={!isOccupied ? { scale: isSelected ? 1.06 : 1.08, y: -2 } : {}}
        whileTap={!isOccupied ? { scale: 0.95 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        key={seatNum}
        type="button"
        id={`seat-${seatNum}`}
        disabled={isOccupied}
        onMouseEnter={() => setHoveredSeat(seatNum)}
        onMouseLeave={() => setHoveredSeat((curr) => (curr === seatNum ? null : curr))}
        onClick={() => onSeatToggle(seatNum, isElevenSeater)}
        title={
          isOccupied
            ? `Seat ${seatNum} (${getSeatDescription(seatNum)}) is already booked and unavailable`
            : isSelected
            ? `Seat ${seatNum} selected — Click to remove from your booking`
            : `Select Seat ${seatNum} (${getSeatDescription(seatNum)}) • KES ${trip.fareKsh.toLocaleString()}`
        }
        className={`relative group flex flex-col items-center justify-between p-1.5 w-12 h-14 transition-all duration-200 ${
          isBench ? 'rounded-lg' : 'rounded-xl'
        } border-2 ${
          isOccupied
            ? 'bg-slate-900/60 border-slate-800/80 text-slate-600 cursor-not-allowed select-none shadow-inner opacity-45'
            : isSelected
            ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 border-white text-slate-950 shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/50 ring-offset-2 ring-offset-slate-950 z-20 font-black'
            : 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 hover:border-amber-400 text-white shadow-md hover:shadow-amber-500/10 cursor-pointer'
        }`}
      >
        {/* Top Headrest Cushion Shape */}
        <div
          className={`w-7 h-1.5 rounded-full transition-all duration-200 ${
            isSelected
              ? 'bg-slate-950 shadow-sm'
              : isOccupied
              ? 'bg-slate-700/60'
              : 'bg-slate-600 group-hover:bg-amber-400'
          }`}
        />

        {/* Seat Code or Status Icon */}
        <div className="flex items-center justify-center my-auto">
          {isOccupied ? (
            <div className="flex items-center justify-center relative">
              <X className="w-4 h-4 text-slate-600 stroke-[2.5]" />
            </div>
          ) : isSelected ? (
            <motion.div
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-slate-950 stroke-[3.5]" />
            </motion.div>
          ) : (
            <span className="font-mono font-black text-xs tracking-tight group-hover:text-amber-300 transition-colors">
              {seatNum}
            </span>
          )}
        </div>

        {/* Bottom Feature Indicator */}
        <div className="flex items-center justify-between w-full px-0.5 leading-none">
          {isWindow ? (
            <span
              className={`text-[8px] font-black uppercase tracking-tighter ${
                isSelected ? 'text-slate-950/80' : isOccupied ? 'text-slate-700' : 'text-amber-400/90'
              }`}
            >
              WIN
            </span>
          ) : (
            <span
              className={`text-[8px] font-bold uppercase tracking-tighter ${
                isSelected ? 'text-slate-950/80' : isOccupied ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              AIS
            </span>
          )}

          {isExtraLegroom && !isOccupied && !isSelected && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" title="Extra Legroom" />
          )}

          <span
            className={`text-[8px] font-mono font-bold ml-auto ${
              isSelected ? 'text-slate-950 font-black' : 'text-slate-400'
            }`}
          >
            {isSelected ? seatNum : ''}
          </span>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="craft-card p-5 md:p-8 space-y-6">
      {/* Vehicle Specification & Live Telemetry Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:p-6 rounded-2xl bg-slate-950 text-white border-2 border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden border-2 border-amber-400/50 flex-shrink-0 bg-slate-900 shadow-xl">
            <img
              src={trip.vehicle?.imageUrl || '/images/transcar_highway_kde4160.jpg'}
              alt={trip.vehicle?.model || 'Toyota HiAce'}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/transcar_highway_kde4160.jpg';
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-black text-amber-400 text-xs bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-amber-400/40 shadow-inner">
                {trip.vehicle?.registrationNumber || 'KDA 123A'}
              </span>
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                {isSixteenSeater ? '16-Seater Maxi' : isElevenSeater ? '11-Seater VIP' : '14-Seater Standard'}
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Availability Sync
              </span>
            </div>
            <h4 className="text-base font-black text-white tracking-tight">{getCoachConfigTitle()}</h4>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              NTSA Certified 80 km/h Governor • Reclining Plush Seats • Left Sliding Entry
            </p>
          </div>
        </div>

        <div className="lg:border-l lg:border-slate-800 lg:pl-6 text-left lg:text-right space-y-1.5 relative z-10 flex-shrink-0">
          <div className="flex items-center justify-between lg:justify-end gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
              Real-Time Availability Status
            </span>
            {onRefreshAvailability && (
              <button
                type="button"
                onClick={onRefreshAvailability}
                disabled={isSyncing}
                title="Refresh real-time availability"
                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-300' : ''}`} />
              </button>
            )}
          </div>
          <p className="text-xl font-black text-amber-400 font-mono tracking-tight">
            {availableCount} / {totalSeatsInConfig} Seats Available
          </p>
          <div className="w-full lg:w-44 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPercentage > 80
                  ? 'bg-rose-500'
                  : occupancyPercentage > 50
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-300 block font-bold">
            KES {trip.fareKsh.toLocaleString()} <span className="text-slate-500 font-normal">per passenger</span>
          </span>
          {lastSyncedAt && (
            <span className="text-[9px] text-slate-500 font-mono block">
              Synced: {lastSyncedAt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Chassis Configuration Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-100 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Vehicle Chassis Architecture:
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:w-auto w-full">
          <button
            type="button"
            onClick={() => handleTabChange(11)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeConfigTab === 11
                ? 'bg-slate-950 text-amber-400 shadow-md border border-amber-400/40'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            11-Seater VIP
          </button>
          <button
            type="button"
            onClick={() => handleTabChange(14)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeConfigTab === 14
                ? 'bg-slate-950 text-amber-400 shadow-md border border-amber-400/40'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            14-Seater Standard
          </button>
          <button
            type="button"
            onClick={() => handleTabChange(16)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeConfigTab === 16
                ? 'bg-slate-950 text-amber-400 shadow-md border border-amber-400/40'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            16-Seater Maxi
          </button>
        </div>
      </div>

      {/* Header & Seat Status Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-extrabold text-slate-950 flex items-center gap-2 tracking-tight">
            <Armchair className="w-5 h-5 text-amber-500" />
            <span>Interactive Coach Matrix</span>
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Select up to <strong className="text-slate-950 font-bold">{maxSeats}</strong> seat{maxSeats > 1 ? 's' : ''} for your journey.
          </p>
        </div>

        {/* Legend with Interactive Visual Status */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-700 shadow-sm">
            <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-600 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            </div>
            <span className="font-bold text-[11px]">Available ({availableCount})</span>
          </div>

          <div className="flex items-center gap-2 bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl border border-slate-950 font-black shadow-md">
            <div className="w-3.5 h-3.5 rounded bg-slate-950 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-amber-400 stroke-[3]" />
            </div>
            <span className="text-[11px]">Selected ({selectedSeats.length})</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-200/80 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-300">
            <div className="w-3.5 h-3.5 rounded bg-slate-400 flex items-center justify-center">
              <X className="w-2.5 h-2.5 text-white stroke-[2.5]" />
            </div>
            <span className="font-semibold text-[11px]">Occupied ({bookedSet.size})</span>
          </div>
        </div>
      </div>

      {/* Selected Seats Real-Time Summary Ribbon */}
      <div className="p-4 rounded-2xl bg-amber-50/60 border-2 border-amber-200/70 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900">Your Chosen Seats:</span>
          {selectedSeats.length === 0 ? (
            <span className="text-slate-500 italic">Click on any available seat below to select</span>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedSeats.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 bg-amber-400 text-slate-950 font-black font-mono text-xs rounded-xl border border-slate-950 shadow-sm flex items-center gap-1.5 animate-in fade-in zoom-in-90 duration-150"
                >
                  <span>Seat {s}</span>
                  <button
                    type="button"
                    onClick={() => onSeatToggle(s, isElevenSeater)}
                    className="hover:bg-slate-950 hover:text-white rounded-full p-0.5 cursor-pointer transition-colors"
                    title={`Remove Seat ${s}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="font-bold text-slate-900 flex items-center gap-2">
          <span>
            Selected: <strong className="text-slate-950 font-mono text-sm bg-amber-400 text-slate-950 px-2 py-0.5 rounded-lg border border-slate-950">{selectedSeats.length}</strong> / {maxSeats}
          </span>
          {selectedSeats.length > 0 && (
            <span className="text-slate-950 font-mono font-black ml-2 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-sm">
              Total: KES {(selectedSeats.length * trip.fareKsh).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Hovered Seat Detail Inspection Bar */}
      {hoveredSeat && (
        <div className="px-4 py-2 bg-slate-900 text-amber-300 text-xs rounded-xl border border-slate-800 flex items-center gap-2 animate-in fade-in duration-150 shadow-inner">
          <Eye className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong className="text-white font-mono font-bold">Seat {hoveredSeat}:</strong> {getSeatDescription(hoveredSeat)}
            {bookedSet.has(hoveredSeat) && (
              <span className="text-rose-400 ml-2 font-bold">• Occupied (Unavailable)</span>
            )}
          </span>
        </div>
      )}

      {/* COACH CHASSIS HIGH-FIDELITY VISUALIZATION */}
      <div className="max-w-md mx-auto my-6 p-6 sm:p-8 bg-slate-950 rounded-3xl border-4 border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Interior Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Side Windows Representation */}
        <div className="absolute top-16 bottom-16 left-1.5 w-1 bg-gradient-to-b from-sky-400/40 via-sky-300/60 to-sky-400/40 rounded-full" />
        <div className="absolute top-16 bottom-16 right-1.5 w-1 bg-gradient-to-b from-sky-400/40 via-sky-300/60 to-sky-400/40 rounded-full" />

        {/* Coach Front Aerodynamic Nose & Curved Windshield */}
        <div className="relative mb-6 pb-4 border-b border-slate-800 text-center">
          <div className="w-44 h-4 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-full mx-auto mb-2 border border-slate-600 flex items-center justify-between px-3 shadow-inner">
            <span className="w-2 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <div className="w-20 h-1 bg-amber-400/70 rounded-full" />
            <span className="w-2 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 font-mono flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            FRONT CABIN • WINDSHIELD & DASHBOARD
          </span>
        </div>

        {/* Cabin Doors & Driver Cockpit Bar */}
        <div className="mb-6 flex items-center justify-between text-xs font-bold gap-2">
          {/* Left Passenger Entrance */}
          <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-xl shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-black">Sliding Passenger Door</span>
          </div>

          {/* Right Driver Cockpit */}
          <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-400/40 text-amber-300 px-3 py-1.5 rounded-xl shadow-sm">
            <svg className="w-4 h-4 text-amber-400 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v18M3 12h18M7 7l10 10" />
            </svg>
            <span className="text-[11px] font-black">Driver Cockpit (RHD)</span>
          </div>
        </div>

        {/* SEATING MATRIX: Kenyan Right-Hand Drive (Driver on Right, Passenger entrance on Left) */}
        <motion.div layout className="space-y-4">
          {/* ROW 1: FRONT CABIN (Seats 1A, 1B on Left, Aisle Walkway, Driver Cockpit on Right) */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/80 border border-slate-800">
            {/* Left Co-Driver Seats */}
            <div className="flex items-center gap-2">
              {renderSeatButton('1A', bookedSet.has('1A'), true, false, true)}
              {renderSeatButton('1B', bookedSet.has('1B'), false, false, true)}
            </div>

            {/* Center Console */}
            <div className="text-[9px] font-mono text-slate-500 font-extrabold uppercase tracking-wider text-center">
              CONSOLE
            </div>

            {/* Right Driver Cockpit */}
            <div className="flex items-center justify-end">
              <div
                aria-label="Captain Driver Cockpit Locked"
                className="w-12 h-14 rounded-xl border-2 border-slate-700 bg-slate-900 text-[10px] font-black text-slate-400 flex flex-col items-center justify-center gap-1 select-none cursor-not-allowed shadow-inner"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[9px]">CAPTAIN</span>
              </div>
            </div>
          </div>

          {/* AISLE PASSAGE HEADER */}
          <div className="flex items-center justify-between px-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-t border-b border-dashed border-slate-800 py-1">
            <span className="text-sky-400/80">← Left Window (A)</span>
            <span className="text-amber-400/80 font-mono">• CENTRAL AISLE WALKWAY •</span>
            <span className="text-sky-400/80">Right Window (C) →</span>
          </div>

          {/* CONFIGURATION 1: 11-SEATER EXECUTIVE VIP CLASS */}
          {isElevenSeater && (
            <div className="space-y-3.5">
              {/* Row 2: 2A (Left Window) | Aisle | 2B, 2C (Right) */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center">
                  {renderSeatButton('2A', bookedSet.has('2A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-500 font-black tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('2B', bookedSet.has('2B'), false)}
                  {renderSeatButton('2C', bookedSet.has('2C'), true)}
                </div>
              </div>

              {/* Row 3: 3A (Left Window) | Aisle | 3B, 3C (Right) */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center">
                  {renderSeatButton('3A', bookedSet.has('3A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-500 font-black tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('3B', bookedSet.has('3B'), false)}
                  {renderSeatButton('3C', bookedSet.has('3C'), true)}
                </div>
              </div>

              {/* Row 4: Executive Full Rear Bench: 4A, 4B, 4C */}
              <div className="pt-2 border-t-2 border-amber-400/40">
                <div className="text-center mb-1 text-[9px] font-black text-amber-400 uppercase tracking-widest">
                  Row 4 • Executive Rear Lounge Bench
                </div>
                <div className="flex items-center justify-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
                  {renderSeatButton('4A', bookedSet.has('4A'), true, true)}
                  {renderSeatButton('4B', bookedSet.has('4B'), false, true)}
                  {renderSeatButton('4C', bookedSet.has('4C'), true, true)}
                </div>
              </div>
            </div>
          )}

          {/* CONFIGURATION 2: 14-SEATER STANDARD COMMUTER */}
          {isFourteenSeater && (
            <div className="space-y-3">
              {/* Row 2 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center">
                  {renderSeatButton('2A', bookedSet.has('2A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-500 font-black tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('2B', bookedSet.has('2B'), false)}
                  {renderSeatButton('2C', bookedSet.has('2C'), true)}
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center">
                  {renderSeatButton('3A', bookedSet.has('3A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-500 font-black tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('3B', bookedSet.has('3B'), false)}
                  {renderSeatButton('3C', bookedSet.has('3C'), true)}
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center">
                  {renderSeatButton('4A', bookedSet.has('4A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-500 font-black tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('4B', bookedSet.has('4B'), false)}
                  {renderSeatButton('4C', bookedSet.has('4C'), true)}
                </div>
              </div>

              {/* Row 5: Full Rear Bench: 5A, 5B, 5C */}
              <div className="pt-2 border-t-2 border-amber-400/40">
                <div className="text-center mb-1 text-[9px] font-black text-amber-400 uppercase tracking-widest">
                  Row 5 • Intercity Rear Bench
                </div>
                <div className="flex items-center justify-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
                  {renderSeatButton('5A', bookedSet.has('5A'), true, true)}
                  {renderSeatButton('5B', bookedSet.has('5B'), false, true)}
                  {renderSeatButton('5C', bookedSet.has('5C'), true, true)}
                </div>
              </div>
            </div>
          )}

          {/* CONFIGURATION 3: 16-SEATER HIGH-ROOF MAXI */}
          {isSixteenSeater && (
            <div className="space-y-2.5">
              {/* Row 2 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center">
                  {renderSeatButton('2A', bookedSet.has('2A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-500 font-black tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('2B', bookedSet.has('2B'), false)}
                  {renderSeatButton('2C', bookedSet.has('2C'), true)}
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center">
                  {renderSeatButton('3A', bookedSet.has('3A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-500 font-black tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('3B', bookedSet.has('3B'), false)}
                  {renderSeatButton('3C', bookedSet.has('3C'), true)}
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center">
                  {renderSeatButton('4A', bookedSet.has('4A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-500 font-black tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('4B', bookedSet.has('4B'), false)}
                  {renderSeatButton('4C', bookedSet.has('4C'), true)}
                </div>
              </div>

              {/* Row 5 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                <div className="flex items-center">
                  {renderSeatButton('5A', bookedSet.has('5A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-500 font-black tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('5B', bookedSet.has('5B'), false)}
                  {renderSeatButton('5C', bookedSet.has('5C'), true)}
                </div>
              </div>

              {/* Row 6: High-Capacity Rear Seats: 6A, 6B */}
              <div className="pt-2 border-t-2 border-amber-400/40">
                <div className="text-center mb-1 text-[9px] font-black text-amber-400 uppercase tracking-widest">
                  Row 6 • Maxi High-Capacity Rear Row
                </div>
                <div className="flex items-center justify-center gap-3 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
                  {renderSeatButton('6A', bookedSet.has('6A'), true, true)}
                  {renderSeatButton('6B', bookedSet.has('6B'), true, true)}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Coach Rear Luggage & Emergency Door Outline */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500/80" />
            <span>REAR • LUGGAGE COMPARTMENT & EMERGENCY EXIT</span>
          </div>
          <p className="text-[9px] text-slate-500 font-mono">
            TransCar Galaxy • Standard Kenyan Left-Hand Door Boarding Layout
          </p>
        </div>
      </div>
    </div>
  );
};
