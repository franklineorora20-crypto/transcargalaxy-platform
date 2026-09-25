import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
} from 'lucide-react';
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

  // Detect vehicle capacity (11, 14, or 16)
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

  const getSeatDescription = (seatNum: string) => {
    if (seatNum === 'P1') return 'Front Cabin Left Window Seat (Panoramic Front View)';
    if (seatNum === 'P2') return 'Front Cabin Center Seat (Alongside Driver)';
    if (seatNum === '1A') return 'Row 1 Window Seat (Adjacent to Sliding Door Entry)';
    if (seatNum.endsWith('A')) return 'Left Window Seat';
    if (seatNum.endsWith('C') || seatNum.endsWith('D')) return 'Right Window Seat';
    if (seatNum.startsWith('4') || seatNum.startsWith('5') || (isElevenSeater && seatNum.startsWith('3'))) {
      return 'Last Row Rear Bench Seat';
    }
    return 'Comfort Passenger Seat';
  };

  // Minimalist, Official Seat Button
  const renderSeat = (
    seatNum: string,
    isOccupied: boolean,
    isWindow = false
  ) => {
    const isSelected = selectedSeats.includes(seatNum);

    return (
      <button
        key={seatNum}
        type="button"
        id={`seat-${seatNum}`}
        disabled={isOccupied}
        onMouseEnter={() => setHoveredSeat(seatNum)}
        onMouseLeave={() => setHoveredSeat((curr) => (curr === seatNum ? null : curr))}
        onClick={() => {
          if (!isOccupied) {
            onSeatToggle(seatNum, isElevenSeater);
          }
        }}
        title={
          isOccupied
            ? `Seat ${seatNum} is occupied`
            : isSelected
            ? `Seat ${seatNum} selected (click to deselect)`
            : `Select Seat ${seatNum} • KES ${trip.fareKsh.toLocaleString()}`
        }
        className={`relative flex flex-col items-center justify-center w-11 h-12 sm:w-12 sm:h-13 rounded-xl font-mono text-xs font-bold transition-all ${
          isOccupied
            ? 'bg-slate-900/70 border border-slate-800 text-slate-600 cursor-not-allowed select-none'
            : isSelected
            ? 'bg-amber-400 text-slate-950 border-2 border-amber-300 shadow-md font-black ring-2 ring-amber-400/30'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-amber-400 cursor-pointer shadow-sm'
        }`}
      >
        <span className="text-xs sm:text-sm font-black leading-none">{seatNum}</span>
        <span className="text-[8px] sm:text-[9px] font-sans font-medium mt-0.5 opacity-80">
          {isSelected ? 'Selected' : isOccupied ? 'Booked' : isWindow ? 'Window' : 'Seat'}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-6 shadow-sm">
      {/* Official Vehicle Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 font-mono font-black text-sm shadow-sm flex-shrink-0">
            {activeConfigTab}S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                {trip.vehicle?.registrationNumber || 'KDA 123A'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {isSixteenSeater ? '16-Seater HiAce' : isElevenSeater ? '11-Seater VIP Shuttle' : '14-Seater Intercity Shuttle'}
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              Select Passenger Seats
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-right">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 font-medium block">Availability</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              <strong className="text-emerald-600">{availableCount}</strong> of {totalSeatsInConfig} Available
            </span>
          </div>
          {onRefreshAvailability && (
            <button
              type="button"
              onClick={onRefreshAvailability}
              disabled={isSyncing}
              title="Refresh seat availability"
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Fleet Capacity Selector Tabs */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <span className="font-medium text-slate-600 px-2">Vehicle Configuration:</span>
        <div className="grid grid-cols-3 gap-1.5 w-full xs:w-auto">
          {[
            { cap: 11 as const, label: '11-Seater' },
            { cap: 14 as const, label: '14-Seater' },
            { cap: 16 as const, label: '16-Seater' },
          ].map((item) => (
            <button
              key={item.cap}
              type="button"
              onClick={() => handleTabChange(item.cap)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                activeConfigTab === item.cap
                  ? 'bg-slate-900 text-amber-400 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700" />
            <span className="text-slate-600 font-medium">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-amber-400 border border-amber-300" />
            <span className="text-slate-900 font-bold">Selected ({selectedSeats.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-slate-900/70 border border-slate-800" />
            <span className="text-slate-400">Booked ({occupiedCount})</span>
          </div>
        </div>

        <div className="text-slate-600 text-xs font-medium">
          Fare: <strong className="text-slate-900 font-mono">KES {trip.fareKsh.toLocaleString()}</strong> / seat
        </div>
      </div>

      {/* Subtle Selected Seat Summary */}
      {selectedSeats.length > 0 && (
        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Selected Seats:</span>
            <span className="font-mono font-bold text-slate-950 bg-amber-200/80 px-2 py-0.5 rounded">
              {selectedSeats.join(', ')}
            </span>
          </div>
          <span className="font-mono font-bold text-slate-900 text-sm">
            Total: KES {(selectedSeats.length * trip.fareKsh).toLocaleString()}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPACT & SNUG VEHICLE CABIN (TIGHT CORRIDOR & PROPORTIONAL MATATU GEOMETRY) */}
      {/* ========================================================================= */}
      <div className="w-fit mx-auto bg-slate-950 text-white rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-lg relative min-w-[270px] sm:min-w-[300px]">
        {/* Windscreen / Front Marker */}
        <div className="text-center mb-3.5 pb-2 border-b border-slate-800/80">
          <div className="w-24 h-1.5 bg-slate-700 rounded-full mx-auto mb-1.5" />
          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold">
            ▲ Front (Windscreen)
          </span>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FRONT CABIN: RHD Driver on Right, 2 Passenger Seats on Left   */}
        {/* ------------------------------------------------------------- */}
        <div className="mb-3 p-2 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1 px-1">
            <span>Front Seats</span>
            <span>Driver (RHD)</span>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
            {/* 2 Front Passenger Seats: P1 (Left Window), P2 (Front Center) */}
            <div className="flex items-center gap-1.5">
              {renderSeat('P1', bookedSet.has('P1'), true)}
              {renderSeat('P2', bookedSet.has('P2'), false)}
            </div>

            {/* Tight Aisle Gap */}
            <div className="w-2.5 flex items-center justify-center text-[8px] font-mono text-slate-600 select-none">•</div>

            {/* Driver Cockpit on the Right (RHD) - Non-bookable */}
            <div
              className="flex flex-col items-center justify-center w-11 h-12 sm:w-12 sm:h-13 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 select-none"
              title="Driver position (Right-Hand Drive) - Locked"
            >
              <svg className="w-4 h-4 text-amber-400 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18M3 12h18" />
              </svg>
              <span className="text-[8px] font-mono font-bold uppercase text-slate-400">Driver</span>
            </div>
          </div>
        </div>

        {/* Sliding Door Entry Indicator on Left */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-2.5 px-1">
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <span>←</span> Sliding Door
          </span>
          <span className="text-slate-500">Aisle ↓</span>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PASSENGER CABIN ROWS WITH SIGNIFICANTLY REDUCED AISLE (10-12px) */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-2">
          {/* =========================================================== */}
          {/* 11-SEATER: Front (2) + Row 1 (3) + Row 2 (3) + Last Row 3 (3) = 11 Seats */}
          {/* =========================================================== */}
          {isElevenSeater && (
            <>
              {/* Row 1 */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <div>{renderSeat('1A', bookedSet.has('1A'), true)}</div>
                <div className="w-2.5 flex items-center justify-center text-[7px] font-mono text-slate-700 select-none">|</div>
                <div className="flex items-center gap-1.5">
                  {renderSeat('1B', bookedSet.has('1B'), false)}
                  {renderSeat('1C', bookedSet.has('1C'), true)}
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <div>{renderSeat('2A', bookedSet.has('2A'), true)}</div>
                <div className="w-2.5 flex items-center justify-center text-[7px] font-mono text-slate-700 select-none">|</div>
                <div className="flex items-center gap-1.5">
                  {renderSeat('2B', bookedSet.has('2B'), false)}
                  {renderSeat('2C', bookedSet.has('2C'), true)}
                </div>
              </div>

              {/* Last Row: 3-Seat Full Rear Bench */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[8px] font-mono uppercase tracking-wider text-slate-400 text-center block mb-1">
                  Last Row: Rear Bench (3 Seats)
                </span>
                <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-900/50 rounded-xl border border-slate-800/60">
                  {renderSeat('3A', bookedSet.has('3A'), true)}
                  {renderSeat('3B', bookedSet.has('3B'), false)}
                  {renderSeat('3C', bookedSet.has('3C'), true)}
                </div>
              </div>
            </>
          )}

          {/* =========================================================== */}
          {/* 14-SEATER: Front (2) + Row 1 (3) + Row 2 (3) + Row 3 (2) + Last Row 4 (4) = 14 Seats */}
          {/* =========================================================== */}
          {isFourteenSeater && (
            <>
              {/* Row 1 */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <div>{renderSeat('1A', bookedSet.has('1A'), true)}</div>
                <div className="w-2.5 flex items-center justify-center text-[7px] font-mono text-slate-700 select-none">|</div>
                <div className="flex items-center gap-1.5">
                  {renderSeat('1B', bookedSet.has('1B'), false)}
                  {renderSeat('1C', bookedSet.has('1C'), true)}
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <div>{renderSeat('2A', bookedSet.has('2A'), true)}</div>
                <div className="w-2.5 flex items-center justify-center text-[7px] font-mono text-slate-700 select-none">|</div>
                <div className="flex items-center gap-1.5">
                  {renderSeat('2B', bookedSet.has('2B'), false)}
                  {renderSeat('2C', bookedSet.has('2C'), true)}
                </div>
              </div>

              {/* Row 3 (Access Walkway Row) */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <div>{renderSeat('3A', bookedSet.has('3A'), true)}</div>
                <div className="w-2.5 flex items-center justify-center text-[7px] font-mono text-slate-700 select-none">|</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-11 sm:w-12 h-12 sm:h-13 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-[8px] font-mono text-slate-600">
                    Pass
                  </div>
                  {renderSeat('3C', bookedSet.has('3C'), true)}
                </div>
              </div>

              {/* Last Row: 4-Seat Full Rear Bench Spanning Back Wall */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[8px] font-mono uppercase tracking-wider text-slate-400 text-center block mb-1">
                  Last Row: Rear Bench (4 Seats)
                </span>
                <div className="flex items-center justify-center gap-1 p-1 bg-slate-900/50 rounded-xl border border-slate-800/60">
                  {renderSeat('4A', bookedSet.has('4A'), true)}
                  {renderSeat('4B', bookedSet.has('4B'), false)}
                  {renderSeat('4C', bookedSet.has('4C'), false)}
                  {renderSeat('4D', bookedSet.has('4D'), true)}
                </div>
              </div>
            </>
          )}

          {/* =========================================================== */}
          {/* 16-SEATER: Front (2) + Row 1 (3) + Row 2 (3) + Row 3 (3) + Row 4 (1) + Last Row 5 (4) = 16 Seats */}
          {/* =========================================================== */}
          {isSixteenSeater && (
            <>
              {/* Row 1 */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <div>{renderSeat('1A', bookedSet.has('1A'), true)}</div>
                <div className="w-2.5 flex items-center justify-center text-[7px] font-mono text-slate-700 select-none">|</div>
                <div className="flex items-center gap-1.5">
                  {renderSeat('1B', bookedSet.has('1B'), false)}
                  {renderSeat('1C', bookedSet.has('1C'), true)}
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <div>{renderSeat('2A', bookedSet.has('2A'), true)}</div>
                <div className="w-2.5 flex items-center justify-center text-[7px] font-mono text-slate-700 select-none">|</div>
                <div className="flex items-center gap-1.5">
                  {renderSeat('2B', bookedSet.has('2B'), false)}
                  {renderSeat('2C', bookedSet.has('2C'), true)}
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <div>{renderSeat('3A', bookedSet.has('3A'), true)}</div>
                <div className="w-2.5 flex items-center justify-center text-[7px] font-mono text-slate-700 select-none">|</div>
                <div className="flex items-center gap-1.5">
                  {renderSeat('3B', bookedSet.has('3B'), false)}
                  {renderSeat('3C', bookedSet.has('3C'), true)}
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <div>{renderSeat('4A', bookedSet.has('4A'), true)}</div>
                <div className="w-2.5 flex items-center justify-center text-[7px] font-mono text-slate-700 select-none">|</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-11 sm:w-12 h-12 sm:h-13 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-[8px] font-mono text-slate-600">
                    Pass
                  </div>
                  <div className="w-11 sm:w-12 h-12 sm:h-13 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-[8px] font-mono text-slate-600">
                    Pass
                  </div>
                </div>
              </div>

              {/* Last Row: 4-Seat Full Rear Bench Spanning Back Wall */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[8px] font-mono uppercase tracking-wider text-slate-400 text-center block mb-1">
                  Last Row: Rear Bench (4 Seats)
                </span>
                <div className="flex items-center justify-center gap-1 p-1 bg-slate-900/50 rounded-xl border border-slate-800/60">
                  {renderSeat('5A', bookedSet.has('5A'), true)}
                  {renderSeat('5B', bookedSet.has('5B'), false)}
                  {renderSeat('5C', bookedSet.has('5C'), false)}
                  {renderSeat('5D', bookedSet.has('5D'), true)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rear Wall / Luggage Area */}
        <div className="mt-3.5 pt-2 border-t border-slate-800/80 text-center">
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">
            ▼ Rear Luggage Compartment
          </span>
        </div>
      </div>
    </div>
  );
};
