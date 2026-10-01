import type { PropsWithChildren } from 'react';
import { X } from 'lucide-react';

interface DrawerProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  title: string;
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition ${open ? 'pointer-events-auto bg-slate-950/35' : 'pointer-events-none bg-transparent'}`}
    >
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md transform flex-col bg-white shadow-soft transition ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
          <h3 className="min-w-0 text-lg font-semibold text-ink sm:text-xl">{title}</h3>
          <button onClick={onClose} className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 sm:px-6 sm:pb-6">
          {children}
        </div>
      </aside>
    </div>
  );
}
