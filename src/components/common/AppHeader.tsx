/**
 * AppHeader Component
 * Main app header with offline mode controls
 * This header is displayed on all main screens for easy access to offline features
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOffline, usePendingSyncCount, useIsSyncing } from '../../context/OfflineContext';
import { useIsOnline } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';

// ===============================
// Types
// ===============================

interface AppHeaderProps {
  title?: string;
  showOfflineToggle?: boolean;
  showSyncStatus?: boolean;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
}

// ===============================
// Sub-components
// ===============================

/**
 * Compact Offline Toggle Button for header
 */
const OfflineToggleButton: React.FC = () => {
  const {
    isOfflineMode,
    isCheckingOut,
    isCheckingIn,
    checkoutMetadata,
    pendingSyncCount,
    enableOfflineMode,
    disableOfflineMode,
    forceDisableOfflineMode,
  } = useOffline();

  const isOnline = useIsOnline();
  const { authState } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const isLoading = isCheckingOut || isCheckingIn || isProcessing;

  // Get rig from user's assigned departments
  const effectiveRigId = checkoutMetadata?.rig_id || 
    authState.user?.assigned_departments?.[0]?.id;
  const effectiveRigName = checkoutMetadata?.rig_name || 
    authState.user?.assigned_departments?.[0]?.name;

  const handlePress = async () => {
    if (isLoading) return;

    if (!isOfflineMode) {
      // Enable offline mode
      if (!effectiveRigId) {
        Alert.alert(
          'No Rig Assigned',
          'You need to be assigned to a rig to enable offline mode.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!isOnline) {
        Alert.alert(
          'No Internet Connection',
          'You need an internet connection to download records for offline use.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Enable Offline Mode',
        `Download records for ${effectiveRigName || 'your rig'} for offline use?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              setIsProcessing(true);
              const result = await enableOfflineMode(effectiveRigId);
              setIsProcessing(false);

              if (!result.success) {
                Alert.alert('Checkout Failed', result.error || 'Unable to enable offline mode.');
              }
            },
          },
        ]
      );
    } else {
      // Disable offline mode
      if (pendingSyncCount > 0) {
        Alert.alert(
          'Pending Changes',
          `You have ${pendingSyncCount} pending change(s). What would you like to do?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Discard',
              style: 'destructive',
              onPress: async () => {
                setIsProcessing(true);
                await forceDisableOfflineMode();
                setIsProcessing(false);
              },
            },
            {
              text: 'Sync & Disable',
              onPress: async () => {
                setIsProcessing(true);
                const result = await disableOfflineMode();
                setIsProcessing(false);

                if (!result.success) {
                  Alert.alert('Sync Failed', result.error || 'Unable to sync changes.');
                }
              },
            },
          ]
        );
        return;
      }

      if (!isOnline) {
        Alert.alert(
          'No Internet Connection',
          'You need an internet connection to sync your changes.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsProcessing(true);
      const result = await disableOfflineMode();
      setIsProcessing(false);

      if (!result.success) {
        Alert.alert('Checkin Failed', result.error || 'Unable to disable offline mode.');
      }
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.offlineButton,
        isOfflineMode && styles.offlineButtonActive,
      ]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isOfflineMode ? '#FFFFFF' : '#3B82F6'} />
      ) : (
        <>
          <Text style={[
            styles.offlineButtonIcon,
            isOfflineMode && styles.offlineButtonIconActive,
          ]}>
            {isOfflineMode ? '⚡' : '☁️'}
          </Text>
          <Text style={[
            styles.offlineButtonText,
            isOfflineMode && styles.offlineButtonTextActive,
          ]}>
            {isOfflineMode ? 'Offline' : 'Online'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

/**
 * Compact Sync Status for header
 */
const SyncStatusButton: React.FC = () => {
  const { isOfflineMode, syncNow, lastSyncTime } = useOffline();
  const pendingSyncCount = usePendingSyncCount();
  const isSyncing = useIsSyncing();
  const isOnline = useIsOnline();

  // Don't show if not in offline mode and no pending syncs
  if (!isOfflineMode && pendingSyncCount === 0) {
    return null;
  }

  const handlePress = () => {
    if (!isSyncing && isOnline && pendingSyncCount > 0) {
      syncNow();
    }
  };

  const getStatusColor = () => {
    if (isSyncing) return '#3B82F6';
    if (pendingSyncCount > 0) return '#F59E0B';
    return '#10B981';
  };

  return (
    <TouchableOpacity
      style={styles.syncButton}
      onPress={handlePress}
      disabled={isSyncing || !isOnline || pendingSyncCount === 0}
      activeOpacity={0.7}
    >
      {isSyncing ? (
        <ActivityIndicator size="small" color="#3B82F6" />
      ) : (
        <View style={[styles.syncDot, { backgroundColor: getStatusColor() }]} />
      )}
      {pendingSyncCount > 0 && (
        <View style={styles.syncBadge}>
          <Text style={styles.syncBadgeText}>{pendingSyncCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Network Status Icon
 */
const NetworkStatusIcon: React.FC = () => {
  const isOnline = useIsOnline();

  return (
    <View style={[
      styles.networkIcon,
      !isOnline && styles.networkIconOffline,
    ]}>
      <Text style={styles.networkIconText}>
        {isOnline ? '📶' : '📵'}
      </Text>
    </View>
  );
};

// ===============================
// Main Component
// ===============================

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showOfflineToggle = true,
  showSyncStatus = true,
  leftComponent,
  rightComponent,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {leftComponent}
          {title && <Text style={styles.title}>{title}</Text>}
        </View>

        {/* Right Section - Controls */}
        <View style={styles.rightSection}>
          {showSyncStatus && <SyncStatusButton />}
          <NetworkStatusIcon />
          {showOfflineToggle && <OfflineToggleButton />}
          {rightComponent}
        </View>
      </View>
    </View>
  );
};

// ===============================
// Styles
// ===============================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  // Offline Toggle Button
  offlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  offlineButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  offlineButtonIcon: {
    fontSize: 14,
  },
  offlineButtonIconActive: {},
  offlineButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  offlineButtonTextActive: {
    color: '#FFFFFF',
  },
  // Sync Button
  syncButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  syncDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  syncBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Network Icon
  networkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  networkIconOffline: {
    backgroundColor: '#FEE2E2',
  },
  networkIconText: {
    fontSize: 14,
  },
});

export default AppHeader;
export { OfflineToggleButton, SyncStatusButton, NetworkStatusIcon };
