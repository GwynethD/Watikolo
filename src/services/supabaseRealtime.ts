import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { AppDataSnapshot } from '@/services/localDb';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const appDataId = 'default';

type AppDataPayload = {
  id: string;
  snapshot: AppDataSnapshot;
  updated_at: string;
};

const client = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export function isSupabaseRealtimeConfigured() {
  return Boolean(client);
}

export function subscribeToAppDataSnapshot(onSnapshot: (snapshot: AppDataSnapshot) => void) {
  if (!client) {
    return () => undefined;
  }

  const channel: RealtimeChannel = client
    .channel('watikolo-app-data')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_data',
        filter: `id=eq.${appDataId}`,
      },
      (payload) => {
        const next = payload.new as AppDataPayload;
        if (next?.snapshot) {
          onSnapshot(next.snapshot);
        }
      },
    )
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Supabase realtime subscription failed.', status, error);
      }
    });

  return () => {
    void client.removeChannel(channel);
  };
}
