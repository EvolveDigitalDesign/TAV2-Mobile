/**
 * Network Status Bar Component
 * Shows current network connectivity status
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useNetwork, useIsOnline } from '../../context/NetworkContext';
import { useOffline } from '../../context/OfflineContext';

// ===============================
// Types
// ===============================

interface NetworkStatusBarProps {
  showWhenOnline?: boolean;
  position?: 'top' | 'bottom';
  style?: object;
}

// ===============================
// Component
// ===============================

const NetworkStatusBar: React.FC<NetworkStatusBarProps> = ({
  showWhenOnline = false,
  position = 'top',
  style,
}) => {
  const { type, refreshNetworkStatus } = useNetwork();
  const isOnline = useIsOnline();
  const { isOfflineMode, pendingSyncCount, syncNow, isSyncing } = useOffline();

  const [opacity] = useState(new Animated.Value(0));
  const [isVisible, setIsVisible] = useState(false);

  // Animate visibility
  useEffect(() => {
    const shouldShow = !isOnline || (showWhenOnline && isOfflineMode);
    
    if (shouldShow) {
      setIsVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [isOnline, showWhenOnline, isOfflineMode, opacity]);

  if (!isVisible) {
    return null;
  }

  const handleRefresh = () => {
    refreshNetworkStatus();
  };

  const handleSync = () => {
    if (isOnline && pendingSyncCount > 0 && !isSyncing) {
      syncNow();
    }
  };

  const getStatusMessage = (): string => {
    if (!isOnline) {
      return `You're offline${isOfflineMode ? ' - Offline mode active' : ''}`;
    }
    if (isOfflineMode && pendingSyncCount > 0) {
      return `${pendingSyncCount} pending change(s) to sync`;
    }
    if (isOfflineMode) {
      return 'Offline mode active - Connected';
    }
    return `Connected via ${type}`;
  };

  const getBackgroundColor = (): string => {
    if (!isOnline) {
      return '#EF4444'; // Red
    }
    if (pendingSyncCount > 0) {
      return '#F59E0B'; // Amber
    }
    return '#10B981'; // Green
  };

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.positionTop : styles.positionBottom,
        { backgroundColor: getBackgroundColor(), opacity },
        style,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {isOnline ? (
            <Text style={styles.icon}>📶</Text>
          ) : (
            <Text style={styles.icon}>📵</Text>
          )}
        </View>
        
        <Text style={styles.message}>{getStatusMessage()}</Text>

        <View style={styles.actions}>
          {!isOnline && (
            <TouchableOpacity onPress={handleRefresh} style={styles.actionButton}>
              <Text style={styles.actionText}>Retry</Text>
            </TouchableOpacity>
          )}
          {isOnline && pendingSyncCount > 0 && !isSyncing && (
            <TouchableOpacity onPress={handleSync} style={styles.actionButton}>
              <Text style={styles.actionText}>Sync Now</Text>
            </TouchableOpacity>
          )}
          {isSyncing && (
            <Text style={styles.syncingText}>Syncing...</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// ===============================
// Styles
// ===============================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1000,
  },
  positionTop: {
    top: 0,
  },
  positionBottom: {
    bottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  icon: {
    fontSize: 14,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  syncingText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});

export default NetworkStatusBar;
