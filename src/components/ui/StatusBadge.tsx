import type { BookingStatus, SlotStatus } from '@/types';
import { cn } from '@/utils/cn';

interface StatusBadgeProps {
  status: BookingStatus | SlotStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    available: 'bg-emerald-50 text-emerald-700',
    reserved: 'bg-amber-50 text-amber-700',
    booked: 'bg-rose-50 text-rose-700',
    'partial payment': 'bg-amber-50 text-amber-700',
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-sky-50 text-sky-700',
    completed: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-slate-100 text-slate-600',
    rejected: 'bg-rose-50 text-rose-700',
  };

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize tracking-wide',
        styles[status] ?? 'bg-slate-100 text-slate-700',
      )}
    >
      {status}
    </span>
  );
}
