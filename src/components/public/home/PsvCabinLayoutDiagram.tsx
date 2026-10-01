import React from 'react';

export const PsvCabinLayoutDiagram: React.FC<{ capacity: 11 | 14 | 16 }> = ({ capacity }) => {
  const SeatBox: React.FC<{ label: string; highlight?: boolean }> = ({ label, highlight = false }) => (
    <div
      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-mono text-[9px] sm:text-[10px] font-bold border shrink-0 ${
        highlight
          ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
          : 'bg-slate-800 text-slate-200 border-slate-700'
      }`}
    >
      {label}
    </div>
  );

  return (
    <div className="w-full max-w-full overflow-x-auto py-1">
      <div className="bg-slate-950 text-white rounded-xl border border-slate-800 p-3 sm:p-3.5 w-full max-w-[260px] mx-auto min-w-[220px]">
        <div className="text-center pb-2 mb-2 border-b border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
            {capacity}-Seater PSV Layout
          </span>
          <span className="text-[9px] text-slate-400">2 Front Seats Beside Driver</span>
        </div>

        {/* Front Cabin: P1, P2 + Driver (RHD) */}
        <div className="mb-2 p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 mb-1">
            <span>2 Front Seats</span>
            <span>Driver (RHD)</span>
          </div>
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1">
              <SeatBox label="P1" highlight />
              <SeatBox label="P2" highlight />
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-[8px] font-mono font-bold text-slate-400 shrink-0">
              DRV
            </div>
          </div>
        </div>

        {/* Rear Rows */}
        <div className="space-y-1.5">
          {/* Row 1 */}
          <div className="flex items-center justify-between">
            <SeatBox label="1A" />
            <span className="text-[8px] text-slate-600 font-mono">Aisle</span>
            <div className="flex items-center gap-1">
              <SeatBox label="1B" />
              <SeatBox label="1C" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex items-center justify-between">
            <SeatBox label="2A" />
            <span className="text-[8px] text-slate-600 font-mono">|</span>
            <div className="flex items-center gap-1">
              <SeatBox label="2B" />
              <SeatBox label="2C" />
            </div>
          </div>

          {capacity === 11 && (
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-center gap-1">
              <SeatBox label="3A" />
              <SeatBox label="3B" />
              <SeatBox label="3C" />
            </div>
          )}

          {capacity === 14 && (
            <>
              <div className="flex items-center justify-between">
                <SeatBox label="3A" />
                <span className="text-[8px] text-slate-600 font-mono">Door</span>
                <SeatBox label="3C" />
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-center gap-1">
                <SeatBox label="4A" />
                <SeatBox label="4B" />
                <SeatBox label="4C" />
                <SeatBox label="4D" />
              </div>
            </>
          )}

          {capacity === 16 && (
            <>
              <div className="flex items-center justify-between">
                <SeatBox label="3A" />
                <span className="text-[8px] text-slate-600 font-mono">|</span>
                <div className="flex items-center gap-1">
                  <SeatBox label="3B" />
                  <SeatBox label="3C" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <SeatBox label="4A" />
                <span className="text-[8px] text-slate-600 font-mono">Pass</span>
                <div className="w-7 sm:w-8 shrink-0" />
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-center gap-1">
                <SeatBox label="5A" />
                <SeatBox label="5B" />
                <SeatBox label="5C" />
                <SeatBox label="5D" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
