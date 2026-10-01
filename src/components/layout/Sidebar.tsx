import { Boxes, CalendarCheck2, ChartColumnBig, LayoutDashboard, ListChecks, LogOut, MapPinned, MessageSquareText, UserRound } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';
import type { NavItem } from '@/types';
import { cn } from '@/utils/cn';

const iconMap = {
  Overview: LayoutDashboard,
  'My Bookings': ListChecks,
  Profile: UserRound,
  Venues: MapPinned,
  Bookings: CalendarCheck2,
  Inventory: Boxes,
  'Inventory Reports': ChartColumnBig,
  Reviews: MessageSquareText,
  Schedule: CalendarCheck2,
  Reports: ChartColumnBig,
};

interface SidebarProps {
  items: NavItem[];
  title: string;
  subtitle: string;
  showSignOut?: boolean;
}

export function Sidebar({ items, title, subtitle, showSignOut = false }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleSignOut = async () => {
    const shouldSignOut = window.confirm('Are you sure you want to sign out?');

    if (!shouldSignOut) {
      return;
    }

    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <aside className="admin-sidebar sticky top-2 z-30 h-fit overflow-hidden rounded-[18px] border border-white/80 bg-white shadow-card lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <div className="m-3 rounded-[14px] bg-[linear-gradient(135deg,#102c42_0%,#15508d_100%)] px-4 py-3 text-white sm:m-4 lg:m-5 lg:rounded-[16px] lg:px-5 lg:py-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/75 sm:text-xs lg:tracking-[0.34em]">{title}</p>
        <h2 className="mt-1 text-base font-semibold sm:text-lg lg:mt-2">{subtitle}</h2>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-4 lg:block lg:space-y-2 lg:px-5 lg:pb-5 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const Icon = iconMap[item.label as keyof typeof iconMap] ?? LayoutDashboard;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-600 transition sm:text-sm lg:w-full lg:gap-3 lg:px-4 lg:py-3',
                  isActive ? 'bg-[#294c5f] text-white shadow-card' : 'hover:bg-slate-50 hover:text-ink',
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          );
        })}
        {showSignOut ? (
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-ink sm:text-sm lg:mt-6 lg:w-full lg:gap-3 lg:px-4 lg:py-3"
          >
            <LogOut className="h-4 w-4" />
            <span className="whitespace-nowrap">Sign out</span>
          </button>
        ) : null}
      </nav>
    </aside>
  );
}
