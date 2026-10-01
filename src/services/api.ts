export async function simulateRequest<T>(data: T, delay = 300): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const ADMIN_SESSION_KEY = 'watikolo-admin-session-v2';

function getAuthToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const session = JSON.parse(window.localStorage.getItem(ADMIN_SESSION_KEY) ?? 'null') as { token?: string } | null;
    return session?.token ?? '';
  } catch {
    return '';
  }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(errorPayload?.message ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
