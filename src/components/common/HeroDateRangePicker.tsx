import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

type ActiveField = 'checkIn' | 'checkOut';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const unavailableDateKeys = new Set([
  '2026-04-05',
  '2026-04-10',
  '2026-04-18',
  '2026-04-26',
  '2026-05-01',
  '2026-05-09',
  '2026-05-16',
]);

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

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(left: Date, right: Date) {
  return toDateKey(left) === toDateKey(right);
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

function findNextAvailableDate(startDate: Date) {
  let nextDate = new Date(startDate);

  while (unavailableDateKeys.has(toDateKey(nextDate))) {
    nextDate = addDays(nextDate, 1);
  }

  return nextDate;
}

export function HeroDateRangePicker() {
  const [checkIn, setCheckIn] = useState(new Date(2026, 3, 1));
  const [checkOut, setCheckOut] = useState(new Date(2026, 3, 2));
  const [activeField, setActiveField] = useState<ActiveField>('checkIn');
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(new Date(2026, 3, 1));
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const visibleMonths = useMemo(() => [visibleMonth, addMonths(visibleMonth, 1)], [visibleMonth]);

  const handleDateSelect = (selectedDate: Date) => {
    if (unavailableDateKeys.has(toDateKey(selectedDate))) {
      return;
    }

    if (activeField === 'checkIn') {
      setCheckIn(selectedDate);

      if (selectedDate >= checkOut) {
        setCheckOut(findNextAvailableDate(addDays(selectedDate, 1)));
      }

      setActiveField('checkOut');
      return;
    }

    if (selectedDate <= checkIn) {
      setCheckIn(selectedDate);
      setCheckOut(findNextAvailableDate(addDays(selectedDate, 1)));
      return;
    }

    setCheckOut(selectedDate);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-[520px]">
      {isOpen ? (
        <div className="absolute bottom-full right-0 z-20 mb-3 w-full rounded-md bg-white p-3.5 shadow-soft md:w-[540px]">
          <div className="grid gap-4 md:grid-cols-2">
            {visibleMonths.map((monthDate, monthIndex) => (
              <div key={monthHeadingFormatter.format(monthDate)}>
                <div className="mb-2.5 flex items-center justify-between">
                  {monthIndex === 0 ? (
                    <button
                      type="button"
                      onClick={() => setVisibleMonth((currentMonth) => addMonths(currentMonth, -1))}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="h-6 w-6" />
                  )}

                  <h3 className="text-[15px] font-medium text-[#1d2d4a]">{monthHeadingFormatter.format(monthDate)}</h3>

                  {monthIndex === 1 ? (
                    <button
                      type="button"
                      onClick={() => setVisibleMonth((currentMonth) => addMonths(currentMonth, 1))}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="h-6 w-6" />
                  )}
                </div>

                <div className="grid grid-cols-7 gap-y-1.5 text-center text-sm">
                  {DAY_LABELS.map((label) => (
                    <div key={label} className="pb-1 text-[11px] text-[#334766]">
                      {label}
                    </div>
                  ))}

                  {getMonthCells(monthDate).map((dateCell, index) => {
                    if (!dateCell) {
                      return <span key={`blank-${index}`} className="h-7" />;
                    }

                    const isUnavailable = unavailableDateKeys.has(toDateKey(dateCell));
                    const isSelected = isSameDay(dateCell, checkIn) || isSameDay(dateCell, checkOut);
                    const isInRange = dateCell > checkIn && dateCell < checkOut;

                    return (
                      <button
                        key={toDateKey(dateCell)}
                        type="button"
                        onClick={() => handleDateSelect(dateCell)}
                        disabled={isUnavailable}
                        className={cn(
                          'mx-auto flex h-7 w-7 items-center justify-center rounded-sm text-[12px] transition',
                          isUnavailable && 'cursor-not-allowed bg-rose-100 text-rose-300',
                          isSelected && 'bg-sky-100 font-semibold text-sky-700',
                          isInRange && !isSelected && 'bg-sky-50 text-sky-700',
                          !isUnavailable && !isSelected && !isInRange && 'text-[#526988] hover:bg-slate-100',
                        )}
                      >
                        {dateCell.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

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
        </div>
      ) : null}

      <div className="ml-auto w-fit rounded-sm bg-[rgba(54,61,63,0.76)] p-2.5 backdrop-blur-sm">
        <div className="grid gap-2 md:grid-cols-[170px_178px_136px]">
          <button
            type="button"
            onClick={() => {
              setActiveField('checkIn');
              setIsOpen(true);
            }}
            className={cn(
              'flex min-h-[42px] items-center justify-between rounded-sm bg-white px-2.5 py-2 text-left shadow-lg',
              activeField === 'checkIn' && isOpen && 'ring-2 ring-sky-200',
            )}
          >
            <div className="truncate whitespace-nowrap text-[11px] text-[#1f1f1f]">
              <span className="font-semibold">{formatStripDate(checkIn)},</span> {weekdayFormatter.format(checkIn)}
            </div>
            <CalendarRange className="h-4 w-4 shrink-0 text-[#1f1f1f]" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveField('checkOut');
              setIsOpen(true);
            }}
            className={cn(
              'flex min-h-[42px] items-center justify-between rounded-sm bg-white px-2.5 py-2 text-left shadow-lg',
              activeField === 'checkOut' && isOpen && 'ring-2 ring-sky-200',
            )}
          >
            <div className="truncate whitespace-nowrap text-[11px] text-[#1f1f1f]">
              <span className="font-semibold">{formatStripDate(checkOut)},</span> {weekdayFormatter.format(checkOut)}
            </div>
            <CalendarDays className="h-4 w-4 shrink-0 text-[#1f1f1f]" />
          </button>

          <Link
            to="/venues"
            className="inline-flex min-h-[42px] items-center justify-center rounded-sm bg-[#0f4da0] px-4 py-2 text-center text-[11px] font-extrabold uppercase tracking-[0.02em] text-white transition hover:bg-[#0b3e82]"
          >
            Book now
          </Link>
        </div>
      </div>
    </div>
  );
}

