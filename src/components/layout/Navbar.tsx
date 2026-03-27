import { Facebook, Instagram, Menu } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { publicNavItems } from '@/constants/navigation';
import { cn } from '@/utils/cn';

const desktopNavClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-[14px] font-medium uppercase tracking-[0.01em] transition',
    isActive ? 'text-[#0f4da0]' : 'text-[#1d2d4a] hover:text-[#0f4da0]',
  );

const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-4 py-3 text-[14px] font-medium uppercase tracking-[0.05em] transition',
    isActive ? 'bg-[#edf4ff] text-[#0f4da0]' : 'text-slate-700 hover:bg-slate-50',
  );

export function Navbar() {
  const [open, setOpen] = useState(false);
  const logoImage = new URL('../../pictures/watikolo-logo.png', import.meta.url).href;

  return (
    <header className="sticky top-0 z-50 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="bg-[#0f4da0] text-white">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-end gap-2 px-4 py-2 text-[13px] font-semibold">
          <a href="tel:+639158748529" className="text-white transition hover:text-white/85">
            +63 915 874 8529
          </a>
          <div className="flex items-center gap-2">
            <a
              href="https://www.facebook.com/share/1B7SGnT43W/?mibextid=wwXIfr"
              aria-label="Facebook"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20"
            >
              <Facebook className="h-4 w-4 fill-current" />
            </a>
            <a
              href="/"
              aria-label="Instagram"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <img src={logoImage} alt="Watikolo logo" className="h-12 w-auto object-contain sm:h-16 lg:h-16" />
          </div>

          <nav className="hidden items-center gap-5 lg:flex">
            {publicNavItems.map((item) => (
              <NavLink key={item.label} to={item.path} end={item.path === '/'} className={desktopNavClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button onClick={() => setOpen((value) => !value)} className="rounded-md border border-slate-200 bg-white p-3 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-0">
            {publicNavItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setOpen(false)}
                className={mobileNavClass}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
