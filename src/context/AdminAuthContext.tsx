import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  authenticateAdmin,
  clearAdminSession,
  isLocalhostMode,
  loadAdminSession,
  logoutAdmin,
  validateAdminSession,
} from '@/services/adminAuth';
import type { AdminSession, LocalAdminAccount } from '@/services/adminAuth';

interface AdminAuthContextValue {
  adminAccounts: LocalAdminAccount[];
  currentAdmin: AdminSession | null;
  isAuthenticated: boolean;
  isCheckingSession: boolean;
  isLocalMode: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminAccounts, setAdminAccounts] = useState<LocalAdminAccount[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminSession | null>(() => loadAdminSession());
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setIsCheckingSession(true);
    void validateAdminSession()
      .then((session) => {
        if (!isMounted) {
          return;
        }

        setCurrentAdmin(session);
        setAdminAccounts(session ? [session] : []);
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      });

    if (typeof window === 'undefined') {
      return () => {
        isMounted = false;
      };
    }

    const syncAdminState = () => {
      const nextSession = loadAdminSession();
      setCurrentAdmin(nextSession);
      setAdminAccounts(nextSession ? [nextSession] : []);
    };

    window.addEventListener('storage', syncAdminState);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', syncAdminState);
    };
  }, []);

  const value = useMemo<AdminAuthContextValue>(() => ({
    adminAccounts,
    currentAdmin,
    isAuthenticated: Boolean(currentAdmin),
    isCheckingSession,
    isLocalMode: isLocalhostMode(),
    login: async (email, password) => {
      const session = await authenticateAdmin(email, password);
      setAdminAccounts([session]);
      setCurrentAdmin(session);
      return Boolean(session);
    },
    logout: async () => {
      await logoutAdmin();
      clearAdminSession();
      setAdminAccounts([]);
      setCurrentAdmin(null);
    },
  }), [adminAccounts, currentAdmin, isCheckingSession]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  }

  return context;
}
