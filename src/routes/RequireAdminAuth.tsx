import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';

export function RequireAdminAuth() {
  const { isAuthenticated, isCheckingSession } = useAdminAuth();
  const location = useLocation();

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f7] text-sm font-semibold text-slate-500">
        Checking admin session...
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/admin/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
