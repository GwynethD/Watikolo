import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { adminSidebarItems } from '@/constants/navigation';

export function AdminLayout() {
  return (
    <div className="admin-layout app-shell min-h-screen bg-[#f4f6f7] lg:h-screen lg:overflow-hidden">
      <div className="admin-container container-shell py-3 sm:py-5 lg:h-full lg:py-6">
        <div className="admin-grid grid min-w-0 gap-3 sm:gap-5 lg:h-full lg:min-h-0 lg:grid-cols-[292px_minmax(0,1fr)]">
          <Sidebar items={adminSidebarItems} title="Welcome" subtitle="Watikolo Admin" showSignOut />
          <div className="admin-content min-w-0 space-y-4 pb-4 sm:space-y-5 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
