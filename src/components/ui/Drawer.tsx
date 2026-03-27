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
        className={`absolute right-0 top-0 h-full w-full max-w-md transform bg-white p-6 shadow-soft transition ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
