/**
 * Sync Status Indicator Component
 * Shows sync status with pending count and last sync time
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useOffline, usePendingSyncCount, useIsSyncing } from '../../context/OfflineContext';
import { useIsOnline } from '../../context/NetworkContext';

// ===============================
// Types
// ===============================

interface SyncStatusIndicatorProps {
  compact?: boolean;
  showSyncButton?: boolean;
  style?: object;
}

// ===============================
// Component
// ===============================

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  compact = false,
  showSyncButton = true,
  style,
}) => {
  const { isOfflineMode, lastSyncTime, syncNow, syncErrors } = useOffline();
  const pendingSyncCount = usePendingSyncCount();
  const isSyncing = useIsSyncing();
  const isOnline = useIsOnline();

  if (!isOfflineMode && pendingSyncCount === 0) {
    return null;
  }

  const formatLastSync = (): string => {
    if (!lastSyncTime) {
      return 'Never synced';
    }

    const now = Date.now();
    const diff = now - lastSyncTime;

    if (diff < 60000) {
      return 'Just now';
    }
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }

    return new Date(lastSyncTime).toLocaleDateString();
  };

  const handleSync = () => {
    if (!isSyncing && isOnline) {
      syncNow();
    }
  };

  const getStatusColor = (): string => {
    if (isSyncing) {
      return '#3B82F6'; // Blue
    }
    if (syncErrors.length > 0) {
      return '#EF4444'; // Red
    }
    if (pendingSyncCount > 0) {
      return '#F59E0B'; // Amber
    }
    return '#10B981'; // Green
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={handleSync}
        disabled={isSyncing || !isOnline}
      >
        {isSyncing ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : (
          <View
            style={[
              styles.compactDot,
              { backgroundColor: getStatusColor() },
            ]}
          />
        )}
        {pendingSyncCount > 0 && (
          <View style={styles.compactBadge}>
            <Text style={styles.compactBadgeText}>{pendingSyncCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor() },
            ]}
          />
          <Text style={styles.statusLabel}>
            {isSyncing
              ? 'Syncing...'
              : pendingSyncCount > 0
              ? 'Changes Pending'
              : 'Up to Date'}
          </Text>
        </View>

        {showSyncButton && pendingSyncCount > 0 && !isSyncing && (
          <TouchableOpacity
            style={[styles.syncButton, !isOnline && styles.syncButtonDisabled]}
            onPress={handleSync}
            disabled={!isOnline}
          >
            <Text style={styles.syncButtonText}>Sync</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.details}>
        {pendingSyncCount > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pending:</Text>
            <Text style={styles.detailValue}>{pendingSyncCount} change(s)</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Sync:</Text>
          <Text style={styles.detailValue}>{formatLastSync()}</Text>
        </View>

        {!isOnline && (
          <View style={styles.offlineWarning}>
            <Text style={styles.offlineWarningText}>
              ⚠️ Offline - Changes will sync when connected
            </Text>
          </View>
        )}

        {syncErrors.length > 0 && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Sync Errors:</Text>
            {syncErrors.slice(0, 3).map((error, index) => (
              <Text key={index} style={styles.errorText}>
                • {error}
              </Text>
            ))}
            {syncErrors.length > 3 && (
              <Text style={styles.errorMore}>
                +{syncErrors.length - 3} more error(s)
              </Text>
            )}
          </View>
        )}
      </View>

      {isSyncing && (
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  offlineWarning: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  offlineWarningText: {
    fontSize: 13,
    color: '#92400E',
  },
  errorContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
  },
  errorMore: {
    fontSize: 12,
    color: '#991B1B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  progressBar: {
    marginTop: 12,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '50%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  // Compact styles
  compactContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compactDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  compactBadge: {
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
  compactBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SyncStatusIndicator;
