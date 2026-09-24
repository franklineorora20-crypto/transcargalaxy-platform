import React from 'react';
import { ShieldCheck, Check, Armchair, X, Sparkles, User, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Trip } from '../../types';

interface SeatSelectorProps {
  trip: Trip;
  selectedSeats: string[];
  onSeatToggle: (seatNumber: string, isExecutive?: boolean) => void;
  maxSeats: number;
}

export const SeatSelector: React.FC<SeatSelectorProps> = ({
  trip,
  selectedSeats,
  onSeatToggle,
  maxSeats,
}) => {
  const bookedSet = React.useMemo(() => new Set(trip.bookedSeatNumbers || []), [trip.bookedSeatNumbers]);
  const passengerSeatCount = trip.vehicle.seatingCapacity || (trip.vehicle.registrationNumber.replace(/\s/g, '').toUpperCase() === 'KDE416Q' ? 11 : 14);
  const isElevenSeater = passengerSeatCount === 11;
  const isSixteenSeater = passengerSeatCount === 16;
  const isFourteenSeater = !isElevenSeater && !isSixteenSeater;

  const getCoachConfigTitle = () => {
    if (isSixteenSeater) return '16-Seater Toyota HiAce (High-Roof Long Wheelbase)';
    if (isElevenSeater) return '11-Seater Toyota HiAce (Executive Class)';
    return '14-Seater Toyota HiAce (Standard Intercity)';
  };

  const getSeatDescription = (seatNum: string) => {
    if (seatNum === '1A') return 'Front Co-Driver Window';
    if (seatNum === '1B') return 'Front Center Passenger';
    if (seatNum.endsWith('A')) return 'Left Window Seat';
    if (seatNum.endsWith('C')) return 'Right Window Seat';
    if (seatNum === '4B' || seatNum === '5B') return 'Center Bench Seat';
    if (seatNum === '6A' || seatNum === '6B') return 'Rear High-Capacity Seat';
    return 'Aisle Seat';
  };

  const renderSeatButton = (seatNum: string, isOccupied: boolean, isWindow = false, isBench = false) => {
    const isSelected = selectedSeats.includes(seatNum);

    return (
      <motion.button
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: isSelected ? 1.05 : 1 }}
        whileHover={!isOccupied ? { scale: isSelected ? 1.06 : 1.08 } : {}}
        whileTap={!isOccupied ? { scale: 0.95 } : {}}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
        key={seatNum}
        type="button"
        id={`seat-${seatNum}`}
        disabled={isOccupied}
        onClick={() => onSeatToggle(seatNum, isElevenSeater)}
        title={
          isOccupied
            ? `Seat ${seatNum} (${getSeatDescription(seatNum)}) is already booked`
            : isSelected
            ? `Seat ${seatNum} selected - Click to deselect`
            : `Select Seat ${seatNum} (${getSeatDescription(seatNum)})`
        }
        className={`relative group flex flex-col items-center justify-between p-1.5 w-12 h-14 transition-all ${
          isBench ? 'rounded-md' : 'rounded-xl'
        } border-2 ${
          isOccupied
            ? 'bg-slate-900/90 border-slate-800 text-slate-600 cursor-not-allowed select-none shadow-inner opacity-60'
            : isSelected
            ? 'bg-amber-400 border-slate-950 text-slate-950 shadow-xl ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 z-10 scale-105'
            : 'bg-slate-800/95 hover:bg-slate-700 border-slate-700 hover:border-amber-400 text-white shadow-sm cursor-pointer'
        }`}
      >
        {/* Top Headrest Cushion Shape */}
        <div
          className={`w-6 h-1.5 rounded-full transition-colors ${
            isSelected
              ? 'bg-slate-950'
              : isOccupied
              ? 'bg-slate-700'
              : 'bg-slate-500 group-hover:bg-amber-400'
          }`}
        />

        {/* Seat Code or Status Icon */}
        <div className="flex items-center justify-center my-auto">
          {isOccupied ? (
            <X className="w-4 h-4 text-slate-500" strokeWidth={2.5} />
          ) : isSelected ? (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="flex items-center gap-0.5"
            >
              <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
            </motion.div>
          ) : (
            <span className="font-mono font-black text-xs tracking-tight">{seatNum}</span>
          )}
        </div>

        {/* Bottom Window or Feature Pill */}
        <div className="flex items-center justify-between w-full px-0.5">
          {isWindow && (
            <span
              className={`text-[8px] font-black uppercase tracking-tighter leading-none ${
                isSelected ? 'text-slate-950/80' : isOccupied ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              WIN
            </span>
          )}
          <span
            className={`text-[8px] font-mono font-bold ml-auto leading-none ${
              isSelected ? 'text-slate-950' : 'text-amber-400/70'
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
      {/* Vehicle Specification & Photo Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-20 h-16 rounded-xl overflow-hidden border border-amber-400/40 flex-shrink-0 bg-slate-900 shadow-inner">
            <img
              src={trip.vehicle.imageUrl || '/images/transcar_highway_kde4160.jpg'}
              alt={trip.vehicle.model}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/transcar_highway_kde4160.jpg';
              }}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-black text-amber-400 text-xs bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-700">
                {trip.vehicle.registrationNumber}
              </span>
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-lg uppercase tracking-wider">
                {isSixteenSeater ? '16-Seater Van' : isElevenSeater ? '11-Seater Executive' : '14-Seater Shuttle'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">{getCoachConfigTitle()}</h4>
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              NTSA Certified 80 km/h Governor • Left Sliding Boarding Door
            </p>
          </div>
        </div>

        <div className="sm:border-l sm:border-slate-800 sm:pl-6 text-left sm:text-right space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Seat Availability</span>
          <p className="text-lg font-black text-amber-400 font-mono">
            {passengerSeatCount - bookedSet.size} / {passengerSeatCount} Free
          </p>
          <span className="text-[11px] text-slate-400 block font-medium">
            KES {trip.fareKsh.toLocaleString()} per seat
          </span>
        </div>
      </div>

      {/* Header & Seat Status Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-extrabold text-slate-950 flex items-center gap-2 tracking-tight">
            <Armchair className="w-5 h-5 text-amber-500" />
            <span>Interactive Coach Matrix</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select your preferred seats. Up to {maxSeats} passenger seat{maxSeats > 1 ? 's' : ''} can be reserved.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-600" />
            <span className="text-slate-700 font-semibold text-[11px]">Available</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            <div className="w-3.5 h-3.5 rounded bg-amber-400 border border-slate-950 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
            </div>
            <span className="text-slate-950 font-bold text-[11px]">Selected</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <div className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-center">
              <X className="w-2.5 h-2.5 text-slate-600" />
            </div>
            <span className="text-slate-500 font-semibold text-[11px]">Booked</span>
          </div>
        </div>
      </div>

      {/* Selected Seats Real-Time Summary Ribbon */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">Your Chosen Seats:</span>
          {selectedSeats.length === 0 ? (
            <span className="text-slate-400 italic">No seat selected yet</span>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedSeats.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 bg-amber-400 text-slate-950 font-black font-mono text-xs rounded-lg border border-slate-950 shadow-sm flex items-center gap-1"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => onSeatToggle(s, isElevenSeater)}
                    className="hover:opacity-75 cursor-pointer ml-0.5"
                    title="Remove seat"
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
            Selected: <strong className="text-slate-950 font-mono text-sm bg-amber-400/20 text-amber-800 px-2 py-0.5 rounded-md border border-amber-400/30">{selectedSeats.length}</strong> / {maxSeats}
          </span>
          {selectedSeats.length > 0 && (
            <span className="text-emerald-700 font-mono font-black ml-2">
              (Total: KES {(selectedSeats.length * trip.fareKsh).toLocaleString()})
            </span>
          )}
        </div>
      </div>

      {/* COACH CHASSIS VISUALIZATION */}
      <div className="max-w-md mx-auto my-4 p-6 sm:p-8 bg-slate-950 rounded-3xl border-2 border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Interior Coach Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Coach Front Aerodynamic Nose & Windshield */}
        <div className="relative mb-6 pb-4 border-b border-slate-800 text-center">
          <div className="w-36 h-3 bg-slate-800 rounded-full mx-auto mb-2 border border-slate-700 flex items-center justify-center">
            <div className="w-16 h-1 bg-amber-400/60 rounded-full" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
            FRONT • WINDSHIELD & CABIN
          </span>
        </div>

        {/* Cabin Doors & Entrance Indicator Bar */}
        <div className="mb-6 flex items-center justify-between text-xs font-bold gap-2">
          {/* Left Passenger Entrance */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-200">Sliding Door (Left)</span>
          </div>

          {/* Right Driver Door & Cockpit */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-400/30 text-amber-400 px-3 py-1.5 rounded-xl shadow-sm">
            <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v18M3 12h18M7 7l10 10" />
            </svg>
            <span className="text-[11px] font-black">Driver Cockpit (RHD)</span>
          </div>
        </div>

        {/* SEATING MATRIX: RHD (Driver on Right, Passenger entrance on Left) */}
        <motion.div layout className="space-y-4">
          {/* ROW 1: FRONT CABIN (Seats 1A, 1B on Left, Aisle Walkway, Driver Cockpit on Right) */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            {/* Left Co-Driver Seats */}
            <div className="flex items-center gap-2">
              {renderSeatButton('1A', bookedSet.has('1A'), true)}
              {renderSeatButton('1B', bookedSet.has('1B'), false)}
            </div>

            {/* Center Gap / Console */}
            <div className="text-[9px] font-mono text-slate-600 font-bold uppercase tracking-wider text-center">
              CONSOLE
            </div>

            {/* Right Driver Cockpit */}
            <div className="flex items-center justify-end">
              <div
                aria-label="Captain Driver Cockpit Locked"
                className="w-12 h-14 rounded-xl border-2 border-slate-700 bg-slate-900 text-[10px] font-black text-slate-400 flex flex-col items-center justify-center gap-1 select-none cursor-not-allowed shadow-inner"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>DRIVER</span>
              </div>
            </div>
          </div>

          {/* AISLE PASSAGE HEADER */}
          <div className="flex items-center justify-between px-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-t border-b border-dashed border-slate-800 py-1">
            <span>← Left Window (A)</span>
            <span className="text-amber-400/70 font-mono">• CENTRAL AISLE WALKWAY •</span>
            <span>Right Window (C) →</span>
          </div>

          {/* CONFIGURATION 1: 11-SEATER EXECUTIVE HIACE (Total 11 seats: 2 front + 3x Row 2 + 3x Row 3 + 3x Rear Row 4) */}
          {isElevenSeater && (
            <div className="space-y-3">
              {/* Row 2: 2A (Left Window) | Aisle | 2B, 2C (Right) */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center">
                  {renderSeatButton('2A', bookedSet.has('2A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-600 font-bold tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('2B', bookedSet.has('2B'), false)}
                  {renderSeatButton('2C', bookedSet.has('2C'), true)}
                </div>
              </div>

              {/* Row 3: 3A (Left Window) | Aisle | 3B, 3C (Right) */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center">
                  {renderSeatButton('3A', bookedSet.has('3A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-600 font-bold tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('3B', bookedSet.has('3B'), false)}
                  {renderSeatButton('3C', bookedSet.has('3C'), true)}
                </div>
              </div>

              {/* Row 4: Executive Full Rear Bench: 4A, 4B, 4C */}
              <div className="pt-2 border-t-2 border-amber-400/40">
                <div className="text-center mb-1 text-[9px] font-bold text-amber-400/80 uppercase tracking-widest">
                  Row 4 • Executive Rear Lounge
                </div>
                <div className="flex items-center justify-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
                  {renderSeatButton('4A', bookedSet.has('4A'), true, true)}
                  {renderSeatButton('4B', bookedSet.has('4B'), false, true)}
                  {renderSeatButton('4C', bookedSet.has('4C'), true, true)}
                </div>
              </div>
            </div>
          )}

          {/* CONFIGURATION 2: 14-SEATER STANDARD HIACE (Total 14 seats: 2 front + 3x Row 2 + 3x Row 3 + 3x Row 4 + 3x Rear Row 5) */}
          {isFourteenSeater && (
            <div className="space-y-3">
              {/* Row 2 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center">
                  {renderSeatButton('2A', bookedSet.has('2A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-600 font-bold tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('2B', bookedSet.has('2B'), false)}
                  {renderSeatButton('2C', bookedSet.has('2C'), true)}
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center">
                  {renderSeatButton('3A', bookedSet.has('3A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-600 font-bold tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('3B', bookedSet.has('3B'), false)}
                  {renderSeatButton('3C', bookedSet.has('3C'), true)}
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center">
                  {renderSeatButton('4A', bookedSet.has('4A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-600 font-bold tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('4B', bookedSet.has('4B'), false)}
                  {renderSeatButton('4C', bookedSet.has('4C'), true)}
                </div>
              </div>

              {/* Row 5: Full Rear Bench: 5A, 5B, 5C */}
              <div className="pt-2 border-t-2 border-amber-400/40">
                <div className="text-center mb-1 text-[9px] font-bold text-amber-400/80 uppercase tracking-widest">
                  Row 5 • Full Intercity Rear Bench
                </div>
                <div className="flex items-center justify-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
                  {renderSeatButton('5A', bookedSet.has('5A'), true, true)}
                  {renderSeatButton('5B', bookedSet.has('5B'), false, true)}
                  {renderSeatButton('5C', bookedSet.has('5C'), true, true)}
                </div>
              </div>
            </div>
          )}

          {/* CONFIGURATION 3: 16-SEATER HIGH-ROOF HIACE (Total 16 seats: 2 front + 3x Row 2 + 3x Row 3 + 3x Row 4 + 3x Row 5 + 2x Rear Row 6) */}
          {isSixteenSeater && (
            <div className="space-y-2.5">
              {/* Row 2 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center">
                  {renderSeatButton('2A', bookedSet.has('2A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-600 font-bold tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('2B', bookedSet.has('2B'), false)}
                  {renderSeatButton('2C', bookedSet.has('2C'), true)}
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center">
                  {renderSeatButton('3A', bookedSet.has('3A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-600 font-bold tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('3B', bookedSet.has('3B'), false)}
                  {renderSeatButton('3C', bookedSet.has('3C'), true)}
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center">
                  {renderSeatButton('4A', bookedSet.has('4A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-600 font-bold tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('4B', bookedSet.has('4B'), false)}
                  {renderSeatButton('4C', bookedSet.has('4C'), true)}
                </div>
              </div>

              {/* Row 5 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="flex items-center">
                  {renderSeatButton('5A', bookedSet.has('5A'), true)}
                </div>
                <div className="text-[9px] font-mono text-slate-600 font-bold tracking-widest uppercase">AISLE</div>
                <div className="flex items-center gap-2">
                  {renderSeatButton('5B', bookedSet.has('5B'), false)}
                  {renderSeatButton('5C', bookedSet.has('5C'), true)}
                </div>
              </div>

              {/* Row 6: High-Capacity Rear Seats: 6A, 6B */}
              <div className="pt-2 border-t-2 border-amber-400/40">
                <div className="text-center mb-1 text-[9px] font-bold text-amber-400/80 uppercase tracking-widest">
                  Row 6 • High-Capacity Rear Row
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
            TransCar Galaxy • Standard Kenyan Left-Hand Drive Boarding Layout
          </p>
        </div>
      </div>
    </div>
  );
};
