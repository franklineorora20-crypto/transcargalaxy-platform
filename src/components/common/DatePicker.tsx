import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  id?: string;
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  variant?: 'light' | 'dark';
  minDate?: string;
  label?: string;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseIsoDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function toIsoDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  id,
  value,
  onChange,
  variant = 'light',
  minDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDateObj = useMemo(() => parseIsoDate(value), [value]);
  const [viewYear, setViewYear] = useState(() => selectedDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDateObj.getMonth());

  useEffect(() => {
    const d = parseIsoDate(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  // Close popover on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const todayIso = useMemo(() => toIsoDateString(new Date()), []);
  const effectiveMinDate = minDate !== undefined ? minDate : todayIso;
  const tomorrowIso = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return toIsoDateString(t);
  }, []);
  const nextDayIso = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 2);
    return toIsoDateString(t);
  }, []);

  const formattedDisplay = useMemo(() => {
    if (!value) return 'Select travel date';
    const d = parseIsoDate(value);
    const weekday = SHORT_WEEKDAYS[d.getDay()];
    const dayNum = d.getDate();
    const monthShort = SHORT_MONTHS[d.getMonth()];
    if (value === todayIso) return `Today • ${weekday}, ${dayNum} ${monthShort}`;
    return `${weekday} • ${dayNum} ${monthShort}`;
  }, [value, todayIso]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      dateIso: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isDisabled: boolean;
    }> = [];

    // Leading days from previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i);
      const iso = toIsoDateString(d);
      cells.push({
        dateIso: iso,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isDisabled: Boolean(effectiveMinDate && iso < effectiveMinDate),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const iso = toIsoDateString(d);
      cells.push({
        dateIso: iso,
        dayNumber: day,
        isCurrentMonth: true,
        isDisabled: Boolean(effectiveMinDate && iso < effectiveMinDate),
      });
    }

    // Trailing days to complete 6-week (42 cell) or 5-week (35 cell) grid
    const totalNeeded = cells.length > 35 ? 42 : 35;
    const remaining = totalNeeded - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(viewYear, viewMonth + 1, day);
      const iso = toIsoDateString(d);
      cells.push({
        dateIso: iso,
        dayNumber: day,
        isCurrentMonth: false,
        isDisabled: Boolean(effectiveMinDate && iso < effectiveMinDate),
      });
    }

    return cells;
  }, [viewYear, viewMonth, effectiveMinDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (iso: string, disabled: boolean) => {
    if (disabled) return;
    onChange(iso);
    setIsOpen(false);
  };

  const isDark = variant === 'dark';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Travel Date: ${formattedDisplay}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full pl-9 pr-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-left flex items-center justify-between transition-all cursor-pointer min-h-[44px] focus:ring-2 focus:ring-amber-400 focus:outline-none ${
          isDark
            ? 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white'
            : 'bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-900 focus:bg-white'
        }`}
      >
        <Calendar
          className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
            isDark ? 'text-amber-400' : 'text-amber-500'
          }`}
        />
        <span className="truncate">{formattedDisplay}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Choose travel date"
          className="absolute left-0 sm:left-auto sm:right-0 lg:left-0 z-50 mt-2 w-[min(310px,calc(100vw-2rem))] rounded-2xl bg-white border-2 border-slate-900 shadow-2xl p-3 sm:p-3.5 text-slate-900 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Quick Select Presets */}
          <div className="grid grid-cols-3 gap-1.5 pb-3 mb-3 border-b border-slate-100">
            {[
              { label: 'Today', iso: todayIso },
              { label: 'Tomorrow', iso: tomorrowIso },
              { label: '+2 Days', iso: nextDayIso },
            ].map((preset) => {
              const active = value === preset.iso;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectDate(preset.iso, false)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0A0A0A] text-[#FFC300] border border-[#0A0A0A]'
                      : 'bg-slate-100 hover:bg-amber-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between mb-2.5 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-black tracking-wide text-slate-950 uppercase font-mono">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_OF_WEEK.map((dow) => (
              <span
                key={dow}
                className="text-[10px] font-extrabold uppercase text-slate-400 py-1"
              >
                {dow}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1" role="grid">
            {calendarDays.map((cell) => {
              const isSelected = cell.dateIso === value;
              const isToday = cell.dateIso === todayIso;

              return (
                <button
                  key={cell.dateIso}
                  type="button"
                  disabled={cell.isDisabled}
                  aria-selected={isSelected}
                  aria-label={cell.dateIso}
                  onClick={() => handleSelectDate(cell.dateIso, cell.isDisabled)}
                  className={`h-8 w-full rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                    cell.isDisabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#FFC300] text-[#0A0A0A] font-black border border-[#0A0A0A] shadow-sm cursor-pointer'
                      : isToday
                      ? 'bg-slate-900 text-white font-bold cursor-pointer hover:bg-slate-800'
                      : cell.isCurrentMonth
                      ? 'text-slate-800 hover:bg-amber-100 cursor-pointer'
                      : 'text-slate-400 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  {cell.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Footer helper */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>Selected: <strong className="font-mono text-slate-900">{value}</strong></span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-bold text-slate-700 hover:text-slate-950 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
