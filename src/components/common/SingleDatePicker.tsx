import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const monthHeadingFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
});

const monthShortFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
});

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatStripDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = monthShortFormatter.format(date);
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function getMonthCells(monthDate: Date) {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const leadingBlankCount = firstDayOfMonth.getDay();

  const cells: Array<Date | null> = Array.from({ length: leadingBlankCount }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  const trailingBlankCount = (7 - (cells.length % 7 || 7)) % 7;
  for (let index = 0; index < trailingBlankCount; index += 1) {
    cells.push(null);
  }

  return cells;
}

type SingleDatePickerProps = {
  label?: string;
  value: string;
  onChange: (nextValue: string) => void;
  unavailableDateKeys?: ReadonlySet<string>;
  placeholder?: string;
  className?: string;
};

export function SingleDatePicker({
  label,
  value,
  onChange,
  unavailableDateKeys,
  placeholder = 'Choose a date',
  className,
}: SingleDatePickerProps) {
  const selectedDate = useMemo(() => fromDateKey(value), [value]);
  const todayKey = useMemo(() => toDateKey(startOfToday()), []);
  const currentMonthStart = useMemo(() => startOfMonth(startOfToday()), []);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDate) {
      const selectedMonth = startOfMonth(selectedDate);
      setVisibleMonth(selectedMonth < currentMonthStart ? currentMonthStart : selectedMonth);
    }
  }, [currentMonthStart, selectedDate]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleDateSelect = (nextDate: Date) => {
    const key = toDateKey(nextDate);
    if (key < todayKey) {
      return;
    }
    if (unavailableDateKeys?.has(key)) {
      return;
    }

    onChange(key);
    setIsOpen(false);
  };

  const canGoPrevMonth = visibleMonth > currentMonthStart;

  return (
    <div className={cn('relative', className)} ref={wrapperRef}>
      {label ? <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label> : null}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'mt-2 flex min-h-[42px] w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left shadow-sm',
          isOpen && 'ring-2 ring-sky-200',
        )}
      >
        {selectedDate ? (
          <div className="truncate whitespace-nowrap text-[12px] text-[#1f1f1f]">
            <span className="font-semibold">{formatStripDate(selectedDate)},</span> {weekdayFormatter.format(selectedDate)}
          </div>
        ) : (
          <div className="truncate whitespace-nowrap text-[12px] text-slate-400">{placeholder}</div>
        )}
        <CalendarDays className="h-4 w-4 shrink-0 text-[#1f1f1f]" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-[320px] max-w-full rounded-md bg-white p-3.5 shadow-soft">
          <div className="mb-2.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((currentMonth) => addMonths(currentMonth, -1))}
              disabled={!canGoPrevMonth}
              className={cn(
                'rounded-full p-1 transition',
                canGoPrevMonth ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700' : 'cursor-not-allowed text-slate-200',
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <h3 className="text-[15px] font-medium text-[#1d2d4a]">{monthHeadingFormatter.format(visibleMonth)}</h3>

            <button
              type="button"
              onClick={() => setVisibleMonth((currentMonth) => addMonths(currentMonth, 1))}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1.5 text-center text-sm">
            {DAY_LABELS.map((dayLabel) => (
              <div key={dayLabel} className="pb-1 text-[11px] text-[#334766]">
                {dayLabel}
              </div>
            ))}

            {getMonthCells(visibleMonth).map((dateCell, index) => {
              if (!dateCell) {
                return <span key={`blank-${index}`} className="h-7" />;
              }

              const dateKey = toDateKey(dateCell);
              const isUnavailable = unavailableDateKeys?.has(dateKey) ?? false;
              const isPast = dateKey < todayKey;
              const isSelected = value === dateKey;
              const isDisabled = isUnavailable || isPast;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleDateSelect(dateCell)}
                  disabled={isDisabled}
                  className={cn(
                    'mx-auto flex h-7 w-7 items-center justify-center rounded-sm text-[12px] transition',
                    isUnavailable && 'cursor-not-allowed bg-rose-100 text-rose-300',
                    isPast && 'cursor-not-allowed bg-slate-50 text-slate-300',
                    isSelected && 'bg-sky-100 font-semibold text-sky-700',
                    !isDisabled && !isSelected && 'text-[#526988] hover:bg-slate-100',
                  )}
                >
                  {dateCell.getDate()}
                </button>
              );
            })}
          </div>

          {unavailableDateKeys?.size ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-700">
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 bg-rose-100" />
                unavailable
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 bg-sky-100" />
                selected
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
