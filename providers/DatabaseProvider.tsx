import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import { database } from '@/db';
import { syncWithSupabase } from '@/db/sync';
import { useAuth } from '@/providers/AuthProvider';

interface DatabaseContextType {
  database: Database;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  sync: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType>({
  database,
  isSyncing: false,
  lastSyncedAt: null,
  sync: async () => {},
});

export function useDatabase() {
  return useContext(DatabaseContext);
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const sync = useCallback(async () => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncWithSupabase(user.id);
      setLastSyncedAt(Date.now());
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing]);

  // Sync on auth
  useEffect(() => {
    if (isAuthenticated && user) {
      sync();
    }
  }, [isAuthenticated, user]);

  // Sync on app foreground
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isAuthenticated) {
        sync();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated, sync]);

  return (
    <DatabaseContext.Provider
      value={{ database, isSyncing, lastSyncedAt, sync }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}
