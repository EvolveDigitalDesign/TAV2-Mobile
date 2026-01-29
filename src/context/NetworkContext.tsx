/**
 * Network Context
 * Monitors network connectivity status
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkState, STORAGE_KEYS } from '../types/offline.types';

// ===============================
// Types
// ===============================

interface NetworkContextType extends NetworkState {
  refreshNetworkStatus: () => Promise<void>;
  isOfflineCapable: boolean;
}

// ===============================
// Default Values
// ===============================

const defaultNetworkState: NetworkState = {
  isConnected: true,
  isInternetReachable: null,
  type: 'unknown',
  lastChecked: Date.now(),
};

const defaultContext: NetworkContextType = {
  ...defaultNetworkState,
  refreshNetworkStatus: async () => {},
  isOfflineCapable: true,
};

// ===============================
// Context
// ===============================

const NetworkContext = createContext<NetworkContextType>(defaultContext);

// ===============================
// Hook
// ===============================

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

// ===============================
// Provider
// ===============================

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [state, setState] = useState<NetworkState>(defaultNetworkState);
  const subscriptionRef = useRef<NetInfoSubscription | null>(null);
  const previousConnectedRef = useRef<boolean | null>(null);

  // Update network state
  const updateNetworkState = useCallback((netInfoState: NetInfoState) => {
    const newState: NetworkState = {
      isConnected: netInfoState.isConnected ?? true,
      isInternetReachable: netInfoState.isInternetReachable,
      type: netInfoState.type,
      lastChecked: Date.now(),
    };

    setState(newState);

    // Store last online time if connected
    if (newState.isConnected && newState.isInternetReachable !== false) {
      AsyncStorage.setItem(
        STORAGE_KEYS.LAST_ONLINE,
        Date.now().toString()
      ).catch((err) => console.error('Error saving last online time:', err));
    }

    // Log connection changes
    if (previousConnectedRef.current !== null && 
        previousConnectedRef.current !== newState.isConnected) {
      console.log(
        `Network status changed: ${newState.isConnected ? 'Connected' : 'Disconnected'}`
      );
    }
    previousConnectedRef.current = newState.isConnected;
  }, []);

  // Refresh network status manually
  const refreshNetworkStatus = useCallback(async () => {
    try {
      const netInfoState = await NetInfo.fetch();
      updateNetworkState(netInfoState);
    } catch (error) {
      console.error('Error refreshing network status:', error);
    }
  }, [updateNetworkState]);

  // Set up network listener
  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(updateNetworkState);

    // Subscribe to network changes
    subscriptionRef.current = NetInfo.addEventListener(updateNetworkState);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [updateNetworkState]);

  const value: NetworkContextType = {
    ...state,
    refreshNetworkStatus,
    isOfflineCapable: true,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

// ===============================
// Utility Hook
// ===============================

/**
 * Hook to check if we're online
 */
export const useIsOnline = (): boolean => {
  const { isConnected, isInternetReachable } = useNetwork();
  
  // If we can't determine internet reachability, assume it's reachable if connected
  if (isInternetReachable === null) {
    return isConnected;
  }
  
  return isConnected && isInternetReachable;
};

/**
 * Hook to get time since last online
 */
export const useTimeSinceOnline = (): number | null => {
  const [timeSinceOnline, setTimeSinceOnline] = useState<number | null>(null);
  const { isConnected, isInternetReachable } = useNetwork();

  useEffect(() => {
    const getLastOnline = async () => {
      if (isConnected && isInternetReachable !== false) {
        setTimeSinceOnline(0);
        return;
      }

      const lastOnlineStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ONLINE);
      if (lastOnlineStr) {
        const lastOnline = parseInt(lastOnlineStr, 10);
        setTimeSinceOnline(Date.now() - lastOnline);
      } else {
        setTimeSinceOnline(null);
      }
    };

    getLastOnline();
    const interval = setInterval(getLastOnline, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, isInternetReachable]);

  return timeSinceOnline;
};

export default NetworkContext;
