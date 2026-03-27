import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function Button({ children, className, variant = 'primary', ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-[#0f4da0] text-white hover:bg-[#0b3e82]',
    secondary: 'bg-gold-500 text-white hover:bg-gold-600',
    ghost: 'bg-white text-ink hover:bg-slate-50',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
  };

  return (
    <button
      className={cn(
        'interactive-ring inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
