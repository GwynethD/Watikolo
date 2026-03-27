import type { PropsWithChildren } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  title: string;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className={cn('w-full max-w-2xl rounded-3xl bg-white p-6 shadow-soft', className)}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
