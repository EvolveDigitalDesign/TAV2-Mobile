/**
 * Offline Mode Toggle Component
 * Switch to enable/disable offline mode
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useOffline } from '../../context/OfflineContext';
import { useNetwork, useIsOnline } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';

// ===============================
// Types
// ===============================

interface OfflineModeToggleProps {
  rigId?: number;
  rigName?: string;
  showDetails?: boolean;
  style?: object;
}

// ===============================
// Component
// ===============================

const OfflineModeToggle: React.FC<OfflineModeToggleProps> = ({
  rigId,
  rigName,
  showDetails = true,
  style,
}) => {
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

  // Get the rig ID from props, checkout metadata, or user's assigned departments
  const effectiveRigId = rigId || checkoutMetadata?.rig_id || 
    authState.user?.assigned_departments?.[0]?.id;
  const effectiveRigName = rigName || checkoutMetadata?.rig_name || 
    authState.user?.assigned_departments?.[0]?.name;

  const handleToggle = async (value: boolean) => {
    if (isLoading) return;

    if (value) {
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

      setIsProcessing(true);
      const result = await enableOfflineMode(effectiveRigId);
      setIsProcessing(false);

      if (!result.success) {
        Alert.alert('Checkout Failed', result.error || 'Unable to enable offline mode.');
      }
    } else {
      // Disable offline mode
      if (pendingSyncCount > 0) {
        Alert.alert(
          'Pending Changes',
          `You have ${pendingSyncCount} pending change(s) that need to be synced. Would you like to sync them now?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Discard Changes',
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
                  Alert.alert(
                    'Sync Failed',
                    result.error || 'Unable to sync changes. Please try again.'
                  );
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
    <View style={[styles.container, style]}>
      <View style={styles.toggleRow}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Offline Mode</Text>
          {effectiveRigName && (
            <Text style={styles.rigName}>Rig: {effectiveRigName}</Text>
          )}
        </View>
        <View style={styles.switchContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Switch
              value={isOfflineMode}
              onValueChange={handleToggle}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={isOfflineMode ? '#3B82F6' : '#9CA3AF'}
              disabled={isLoading}
            />
          )}
        </View>
      </View>

      {showDetails && isOfflineMode && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Checked Out:</Text>
            <Text style={styles.detailValue}>
              {checkoutMetadata?.record_count || 0} records
            </Text>
          </View>
          {pendingSyncCount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pending Changes:</Text>
              <Text style={[styles.detailValue, styles.pendingValue]}>
                {pendingSyncCount}
              </Text>
            </View>
          )}
          {checkoutMetadata?.checked_out_at && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Since:</Text>
              <Text style={styles.detailValue}>
                {new Date(checkoutMetadata.checked_out_at).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      )}

      {isCheckingOut && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.progressText}>Downloading records...</Text>
        </View>
      )}

      {isCheckingIn && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.progressText}>Syncing changes...</Text>
        </View>
      )}
    </View>
  );
};

// ===============================
// Styles
// ===============================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  rigName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  switchContainer: {
    width: 51,
    height: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  pendingValue: {
    color: '#F59E0B',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3B82F6',
  },
});

export default OfflineModeToggle;
