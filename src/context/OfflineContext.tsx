/**
 * Offline Context
 * State management for offline mode functionality
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  OfflineState,
  CheckoutMetadata,
  OfflineDWR,
  SyncProgress,
} from '../types/offline.types';
import {
  checkoutRecords,
  CheckoutProgress,
  hasActiveCheckout,
  getCheckoutInfo,
} from '../services/offline/checkoutService';
import {
  checkinRecords,
  CheckinProgress,
  forceCheckin,
  getPendingChangesCount,
} from '../services/offline/checkinService';
import {
  processSyncQueue,
  hasPendingSync,
  getSyncQueueStatus,
} from '../services/offline/syncService';
import {
  getCheckoutMetadata,
  getAllDWRs,
  getPendingSyncCount,
} from '../services/offline/storageService';
import { initializeDatabase } from '../services/offline/database';
import { useNetwork, useIsOnline } from './NetworkContext';
import { useAuth } from './AuthContext';

// ===============================
// Types
// ===============================

interface OfflineContextType extends OfflineState {
  // Actions
  enableOfflineMode: (rigId: number) => Promise<{ success: boolean; error?: string }>;
  disableOfflineMode: () => Promise<{ success: boolean; error?: string }>;
  forceDisableOfflineMode: () => Promise<void>;
  syncNow: () => Promise<{ success: boolean; syncedCount: number; errors: string[] }>;
  
  // Getters
  getOfflineDWRs: () => Promise<OfflineDWR[]>;
  refreshOfflineState: () => Promise<void>;
  
  // Progress callbacks
  checkoutProgress: CheckoutProgress | null;
  checkinProgress: CheckinProgress | null;
  syncProgress: SyncProgress | null;
}

// ===============================
// Default Values
// ===============================

const defaultOfflineState: OfflineState = {
  isOfflineMode: false,
  isCheckingOut: false,
  isCheckingIn: false,
  isSyncing: false,
  checkoutMetadata: null,
  pendingSyncCount: 0,
  lastSyncTime: null,
  syncErrors: [],
};

// Database initialization state
interface DatabaseState {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
}

const defaultContext: OfflineContextType = {
  ...defaultOfflineState,
  enableOfflineMode: async () => ({ success: false, error: 'Not initialized' }),
  disableOfflineMode: async () => ({ success: false, error: 'Not initialized' }),
  forceDisableOfflineMode: async () => {},
  syncNow: async () => ({ success: false, syncedCount: 0, errors: ['Not initialized'] }),
  getOfflineDWRs: async () => [],
  refreshOfflineState: async () => {},
  checkoutProgress: null,
  checkinProgress: null,
  syncProgress: null,
};

// ===============================
// Context
// ===============================

const OfflineContext = createContext<OfflineContextType>(defaultContext);

// ===============================
// Hook
// ===============================

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};

// ===============================
// Provider
// ===============================

interface OfflineProviderProps {
  children: React.ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [state, setState] = useState<OfflineState>(defaultOfflineState);
  const [dbState, setDbState] = useState<DatabaseState>({
    isInitialized: false,
    isInitializing: false,
    error: null,
  });
  const [checkoutProgress, setCheckoutProgress] = useState<CheckoutProgress | null>(null);
  const [checkinProgress, setCheckinProgress] = useState<CheckinProgress | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  const isOnline = useIsOnline();
  const { authState } = useAuth();
  const autoSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize SQLite database on mount
  useEffect(() => {
    const initDb = async () => {
      if (dbState.isInitialized || dbState.isInitializing) return;
      
      setDbState((prev) => ({ ...prev, isInitializing: true }));
      
      try {
        await initializeDatabase();
        setDbState({ isInitialized: true, isInitializing: false, error: null });
        console.log('SQLite database initialized successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Database initialization failed';
        console.error('Failed to initialize SQLite database:', error);
        setDbState({ isInitialized: false, isInitializing: false, error: errorMessage });
      }
    };

    initDb();
  }, [dbState.isInitialized, dbState.isInitializing]);

  // Load initial offline state (after database is ready)
  const refreshOfflineState = useCallback(async () => {
    if (!dbState.isInitialized) return;
    
    try {
      const isActive = await hasActiveCheckout();
      const metadata = await getCheckoutInfo();
      const pendingCount = await getPendingSyncCount();

      setState((prev) => ({
        ...prev,
        isOfflineMode: isActive,
        checkoutMetadata: metadata,
        pendingSyncCount: pendingCount,
      }));
    } catch (error) {
      console.error('Error refreshing offline state:', error);
    }
  }, [dbState.isInitialized]);

  // Initialize on mount (after database is ready)
  useEffect(() => {
    refreshOfflineState();
  }, [refreshOfflineState]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!dbState.isInitialized) return;
    
    if (isOnline && state.isOfflineMode && state.pendingSyncCount > 0) {
      // Trigger background sync
      processSyncQueue((progress) => {
        setSyncProgress(progress);
      }).then(() => {
        setSyncProgress(null);
        refreshOfflineState();
      });
    }
  }, [dbState.isInitialized, isOnline, state.isOfflineMode, state.pendingSyncCount, refreshOfflineState]);

  // Enable offline mode (checkout)
  const enableOfflineMode = useCallback(
    async (rigId: number): Promise<{ success: boolean; error?: string }> => {
      if (!authState.user) {
        return { success: false, error: 'User not authenticated' };
      }

      if (state.isCheckingOut) {
        return { success: false, error: 'Already checking out' };
      }

      if (state.isOfflineMode) {
        return { success: false, error: 'Already in offline mode' };
      }

      setState((prev) => ({ ...prev, isCheckingOut: true }));
      setCheckoutProgress(null);

      try {
        const result = await checkoutRecords(
          rigId,
          authState.user.id,
          authState.user.username,
          (progress) => {
            setCheckoutProgress(progress);
          }
        );

        if (result.success) {
          await refreshOfflineState();
          setState((prev) => ({
            ...prev,
            isCheckingOut: false,
            isOfflineMode: true,
          }));
          return { success: true };
        } else {
          setState((prev) => ({ ...prev, isCheckingOut: false }));
          return { success: false, error: result.error };
        }
      } catch (error) {
        setState((prev) => ({ ...prev, isCheckingOut: false }));
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Checkout failed',
        };
      } finally {
        setCheckoutProgress(null);
      }
    },
    [authState.user, state.isCheckingOut, state.isOfflineMode, refreshOfflineState]
  );

  // Disable offline mode (checkin)
  const disableOfflineMode = useCallback(
    async (): Promise<{ success: boolean; error?: string }> => {
      if (!state.isOfflineMode) {
        return { success: false, error: 'Not in offline mode' };
      }

      if (state.isCheckingIn) {
        return { success: false, error: 'Already checking in' };
      }

      if (!isOnline) {
        return { success: false, error: 'Cannot check in while offline' };
      }

      setState((prev) => ({ ...prev, isCheckingIn: true }));
      setCheckinProgress(null);

      try {
        const result = await checkinRecords((progress) => {
          setCheckinProgress(progress);
        });

        if (result.success) {
          await refreshOfflineState();
          setState((prev) => ({
            ...prev,
            isCheckingIn: false,
            isOfflineMode: false,
            checkoutMetadata: null,
            pendingSyncCount: 0,
          }));
          return { success: true };
        } else {
          setState((prev) => ({ ...prev, isCheckingIn: false }));
          return { success: false, error: result.error };
        }
      } catch (error) {
        setState((prev) => ({ ...prev, isCheckingIn: false }));
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Checkin failed',
        };
      } finally {
        setCheckinProgress(null);
      }
    },
    [state.isOfflineMode, state.isCheckingIn, isOnline, refreshOfflineState]
  );

  // Force disable offline mode (discards local changes)
  const forceDisableOfflineMode = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isCheckingIn: true }));

    try {
      await forceCheckin();
      await refreshOfflineState();
      setState((prev) => ({
        ...prev,
        isCheckingIn: false,
        isOfflineMode: false,
        checkoutMetadata: null,
        pendingSyncCount: 0,
      }));
    } catch (error) {
      console.error('Force checkin error:', error);
      setState((prev) => ({ ...prev, isCheckingIn: false }));
    }
  }, [refreshOfflineState]);

  // Manual sync
  const syncNow = useCallback(
    async (): Promise<{ success: boolean; syncedCount: number; errors: string[] }> => {
      if (!isOnline) {
        return { success: false, syncedCount: 0, errors: ['Cannot sync while offline'] };
      }

      if (state.isSyncing) {
        return { success: false, syncedCount: 0, errors: ['Sync already in progress'] };
      }

      setState((prev) => ({ ...prev, isSyncing: true }));
      setSyncProgress(null);

      try {
        const result = await processSyncQueue((progress) => {
          setSyncProgress(progress);
        });

        await refreshOfflineState();

        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: Date.now(),
          syncErrors: result.errors,
        }));

        return {
          success: result.success,
          syncedCount: result.syncedCount,
          errors: result.errors,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Sync failed';
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          syncErrors: [errorMessage],
        }));
        return { success: false, syncedCount: 0, errors: [errorMessage] };
      } finally {
        setSyncProgress(null);
      }
    },
    [isOnline, state.isSyncing, refreshOfflineState]
  );

  // Get offline DWRs
  const getOfflineDWRs = useCallback(async (): Promise<OfflineDWR[]> => {
    if (!state.isOfflineMode) {
      return [];
    }
    return getAllDWRs();
  }, [state.isOfflineMode]);

  const value: OfflineContextType = {
    ...state,
    enableOfflineMode,
    disableOfflineMode,
    forceDisableOfflineMode,
    syncNow,
    getOfflineDWRs,
    refreshOfflineState,
    checkoutProgress,
    checkinProgress,
    syncProgress,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

// ===============================
// Utility Hooks
// ===============================

/**
 * Hook to check if offline mode is active
 */
export const useIsOfflineMode = (): boolean => {
  const { isOfflineMode } = useOffline();
  return isOfflineMode;
};

/**
 * Hook to get checkout info
 */
export const useCheckoutInfo = (): CheckoutMetadata | null => {
  const { checkoutMetadata } = useOffline();
  return checkoutMetadata;
};

/**
 * Hook to get pending sync count
 */
export const usePendingSyncCount = (): number => {
  const { pendingSyncCount } = useOffline();
  return pendingSyncCount;
};

/**
 * Hook to check if sync is in progress
 */
export const useIsSyncing = (): boolean => {
  const { isSyncing } = useOffline();
  return isSyncing;
};

export default OfflineContext;
