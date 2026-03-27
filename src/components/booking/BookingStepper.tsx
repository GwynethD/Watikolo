import { bookingSteps } from '@/constants/navigation';
import { cn } from '@/utils/cn';

interface BookingStepperProps {
  currentStep: number;
}

export function BookingStepper({ currentStep }: BookingStepperProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {bookingSteps.map((step, index) => (
        <div key={step} className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold',
              index <= currentStep ? 'bg-ink text-white' : 'bg-slate-100 text-slate-500',
            )}
          >
            {index + 1}
          </div>
          <span className={cn('text-sm font-medium', index <= currentStep ? 'text-ink' : 'text-slate-400')}>{step}</span>
        </div>
      ))}
    </div>
  );
}
