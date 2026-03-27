import type { TimeSlot } from '@/types';
import { cn } from '@/utils/cn';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlotId?: string;
  onSelect: (slotId: string) => void;
}

export function TimeSlotPicker({ slots, selectedSlotId, onSelect }: TimeSlotPickerProps) {
  return (
    <div className="grid gap-3">
      {slots.map((slot) => {
        const disabled = slot.status === 'booked';

        return (
          <button
            key={slot.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(slot.id)}
            className={cn(
              'interactive-ring flex items-center justify-between rounded-3xl border p-4 text-left transition',
              disabled && 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-70',
              !disabled && 'border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/30',
              selectedSlotId === slot.id && 'border-brand-400 bg-brand-50 ring-2 ring-brand-100',
            )}
          >
            <div>
              <p className="text-sm font-semibold text-ink">{slot.label}</p>
              <p className="mt-1 text-xs text-slate-500">
                {slot.status === 'booked' ? 'This slot is not selectable.' : 'Choose this slot for your event schedule.'}
              </p>
            </div>
            <StatusBadge status={slot.status} />
          </button>
        );
      })}
    </div>
  );
}
