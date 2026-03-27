import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { customerSidebarItems } from '@/constants/navigation';

export function CustomerLayout() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef2f3_0%,#f7f7f5_40%)]">
      <div className="container-shell py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Sidebar items={customerSidebarItems} title="Customer Portal" subtitle="Manage bookings and profile" />
          <div className="space-y-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
