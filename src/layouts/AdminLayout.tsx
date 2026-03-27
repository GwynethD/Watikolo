import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { adminSidebarItems } from '@/constants/navigation';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbe8ef_0%,#eef3f6_22%,#f7f7f5_45%,#f6f1e8_100%)]">
      <div className="container-shell py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Sidebar items={adminSidebarItems} title="Admin Suite" subtitle="Control venues, bookings, and schedules" />
          <div className="space-y-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
