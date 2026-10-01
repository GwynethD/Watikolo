import { apiRequest } from '@/services/api';

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminSession extends AdminAccount {
  loggedInAt: string;
  token: string;
}

export type LocalAdminAccount = AdminAccount;

export const ADMIN_SESSION_KEY = 'watikolo-admin-session-v2';

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function loadAdminSession() {
  if (!hasStorage()) {
    return null;
  }

  const stored = window.localStorage.getItem(ADMIN_SESSION_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AdminSession>;
    if (!parsed.id || !parsed.email || !parsed.name || !parsed.role || !parsed.loggedInAt || !parsed.token) {
      return null;
    }

    return {
      id: parsed.id,
      name: parsed.name,
      email: normalizeEmail(parsed.email),
      role: parsed.role,
      loggedInAt: parsed.loggedInAt,
      token: parsed.token,
    };
  } catch {
    return null;
  }
}

function saveAdminSession(session: AdminSession) {
  if (hasStorage()) {
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

export function getAdminToken() {
  return loadAdminSession()?.token ?? '';
}

export function clearAdminSession() {
  if (hasStorage()) {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    window.localStorage.removeItem('watikolo-admin-session-v1');
  }
}

export async function authenticateAdmin(email: string, password: string) {
  const session = await apiRequest<AdminSession>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return saveAdminSession(session);
}

export async function validateAdminSession() {
  const token = getAdminToken();
  if (!token) {
    return null;
  }

  try {
    const session = await apiRequest<AdminSession>('/api/admin/session');
    return saveAdminSession(session);
  } catch {
    clearAdminSession();
    return null;
  }
}

export async function logoutAdmin() {
  const token = getAdminToken();
  if (token) {
    await apiRequest<{ ok: boolean }>('/api/admin/logout', { method: 'POST' }).catch(() => null);
  }

  clearAdminSession();
}

export function isLocalhostMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return ['localhost', '127.0.0.1', 'watikolo.com'].includes(window.location.hostname);
}
