import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { StatCardItem } from '@/types';
import { cn } from '@/utils/cn';

interface StatsCardProps {
  item: StatCardItem;
}

export function StatsCard({ item }: StatsCardProps) {
  const Icon = item.trend === 'up' ? ArrowUpRight : item.trend === 'down' ? ArrowDownRight : Minus;

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{item.label}</p>
          <h3 className="mt-2 text-2xl font-bold text-ink">{item.value}</h3>
        </div>
        <div
          className={cn(
            'rounded-2xl p-3',
            item.trend === 'up' && 'bg-emerald-50 text-emerald-700',
            item.trend === 'down' && 'bg-rose-50 text-rose-700',
            item.trend === 'neutral' && 'bg-slate-100 text-slate-700',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{item.change}</p>
    </div>
  );
}
