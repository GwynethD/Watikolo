import { CalendarCheck2, ChartColumnBig, LayoutDashboard, ListChecks, MapPinned, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { NavItem } from '@/types';
import { cn } from '@/utils/cn';

const iconMap = {
  Overview: LayoutDashboard,
  'My Bookings': ListChecks,
  Profile: UserRound,
  Venues: MapPinned,
  Bookings: CalendarCheck2,
  Schedule: CalendarCheck2,
  Reports: ChartColumnBig,
};

interface SidebarProps {
  items: NavItem[];
  title: string;
  subtitle: string;
}

export function Sidebar({ items, title, subtitle }: SidebarProps) {
  return (
    <aside className="panel h-fit overflow-hidden p-0">
      <div className="bg-[linear-gradient(135deg,#0f2943_0%,#154e96_100%)] px-5 py-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-200">{title}</p>
        <h2 className="mt-2 text-lg font-semibold">{subtitle}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-200">Track arrivals, confirm requests, watch occupancy, and keep the resort schedule clean.</p>
      </div>

      <nav className="space-y-2 p-5">
        {items.map((item) => {
          const Icon = iconMap[item.label as keyof typeof iconMap] ?? LayoutDashboard;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard' || item.path === '/admin'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition',
                  isActive ? 'bg-brand-700 text-white shadow-card' : 'hover:bg-slate-50 hover:text-ink',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
