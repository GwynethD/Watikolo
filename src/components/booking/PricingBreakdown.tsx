import { formatCurrency } from '@/utils/format';

interface PricingBreakdownProps {
  basePrice: number;
  guests: number;
}

export function PricingBreakdown({ basePrice, guests }: PricingBreakdownProps) {
  const serviceFee = 4500;
  const guestSupportFee = guests > 150 ? 7000 : guests > 100 ? 3500 : 1500;
  const total = basePrice + serviceFee + guestSupportFee;

  return (
    <div className="rounded-3xl bg-slate-950 p-6 text-white">
      <p className="text-sm uppercase tracking-[0.25em] text-gold-300">Pricing breakdown</p>
      <div className="mt-6 space-y-4 text-sm text-slate-200">
        <div className="flex items-center justify-between">
          <span>Venue base rate</span>
          <span>{formatCurrency(basePrice)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Platform service fee</span>
          <span>{formatCurrency(serviceFee)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Guest support fee</span>
          <span>{formatCurrency(guestSupportFee)}</span>
        </div>
      </div>
      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Estimated total</span>
          <span className="text-2xl font-semibold text-white">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
