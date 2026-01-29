/**
 * Sync Service
 * Manages the sync queue and handles incremental sync operations
 */

import apiClient from '../api/client';
import {
  SyncOperation,
  SyncOperationType,
  SyncEntityType,
  SyncOperationStatus,
  SyncProgress,
} from '../../types/offline.types';
import {
  generateLocalId,
  getSyncQueue,
  saveSyncQueue,
  addToSyncQueue,
  updateSyncOperationStatus,
  removeFromSyncQueue,
  clearCompletedSyncOperations,
  getPendingSyncCount,
} from './storageService';

// ===============================
// Types
// ===============================

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  pendingCount: number;
  errors: string[];
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

// ===============================
// Constants
// ===============================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Base delay for exponential backoff

// ===============================
// Helper Functions
// ===============================

/**
 * Get API endpoint for entity type
 */
const getApiEndpoint = (entity: SyncEntityType): string => {
  const endpoints: Record<SyncEntityType, string> = {
    daily_work_record: '/api/workrecords/',
    work_assignment: '/api/work-assignments/',
    employee_time_record: '/api/time-records/',
    inventory_charge: '/api/inventory-charges/',
    service_charge: '/api/service-charges/',
    miscellaneous_charge: '/api/miscellaneous-charges/',
    charge_record: '/api/charge-records/',
  };

  return endpoints[entity] || `/api/${entity.replace(/_/g, '-')}s/`;
};

/**
 * Execute a single sync operation
 */
const executeSyncOperation = async (
  operation: SyncOperation
): Promise<{ success: boolean; serverId?: number; error?: string }> => {
  const endpoint = getApiEndpoint(operation.entity);

  try {
    switch (operation.type) {
      case 'create': {
        const response = await apiClient.post(endpoint, operation.data);
        return { success: true, serverId: response.data.id };
      }
      case 'update': {
        if (!operation.server_id) {
          return { success: false, error: 'Cannot update without server ID' };
        }
        await apiClient.patch(`${endpoint}${operation.server_id}/`, operation.data);
        return { success: true, serverId: operation.server_id };
      }
      case 'delete': {
        if (!operation.server_id) {
          // Local-only record, consider it deleted
          return { success: true };
        }
        await apiClient.delete(`${endpoint}${operation.server_id}/`);
        return { success: true };
      }
      default:
        return { success: false, error: `Unknown operation type: ${operation.type}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

/**
 * Delay with exponential backoff
 */
const delay = (retryCount: number): Promise<void> => {
  const ms = RETRY_DELAY_MS * Math.pow(2, retryCount);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// ===============================
// Public Functions
// ===============================

/**
 * Queue a new sync operation
 */
export const queueSyncOperation = async (
  type: SyncOperationType,
  entity: SyncEntityType,
  localId: string,
  data: Record<string, unknown>,
  serverId?: number,
  dwrLocalId?: string
): Promise<SyncOperation> => {
  const operation: SyncOperation = {
    id: generateLocalId(),
    type,
    entity,
    local_id: localId,
    server_id: serverId,
    dwr_local_id: dwrLocalId,
    data,
    status: 'pending',
    retry_count: 0,
    max_retries: MAX_RETRIES,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  await addToSyncQueue(operation);
  return operation;
};

/**
 * Process all pending sync operations
 */
export const processSyncQueue = async (
  onProgress?: SyncProgressCallback
): Promise<SyncResult> => {
  const queue = await getSyncQueue();
  const pending = queue.filter(
    (op) => op.status === 'pending' || op.status === 'failed'
  );

  // Sort by creation time to maintain order
  pending.sort((a, b) => a.created_at - b.created_at);

  const result: SyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    pendingCount: pending.length,
    errors: [],
  };

  if (pending.length === 0) {
    return result;
  }

  for (let i = 0; i < pending.length; i++) {
    const operation = pending[i];

    onProgress?.({
      total: pending.length,
      completed: i,
      failed: result.failedCount,
      current: `${operation.entity} (${operation.type})`,
    });

    // Mark as syncing
    await updateSyncOperationStatus(operation.id, 'syncing');

    // Execute the operation
    const execResult = await executeSyncOperation(operation);

    if (execResult.success) {
      await updateSyncOperationStatus(operation.id, 'success');
      result.syncedCount++;
    } else {
      // Check retry count
      if (operation.retry_count < operation.max_retries) {
        // Increment retry count and mark as failed for retry
        const queue = await getSyncQueue();
        const index = queue.findIndex((op) => op.id === operation.id);
        if (index >= 0) {
          queue[index] = {
            ...queue[index],
            status: 'failed',
            error: execResult.error,
            retry_count: queue[index].retry_count + 1,
            updated_at: Date.now(),
          };
          await saveSyncQueue(queue);
        }
        
        // Wait before continuing (exponential backoff)
        await delay(operation.retry_count);
      } else {
        // Max retries exceeded
        await updateSyncOperationStatus(operation.id, 'failed', execResult.error);
        result.failedCount++;
        result.errors.push(
          `${operation.entity} ${operation.local_id}: ${execResult.error}`
        );
        result.success = false;
      }
    }
  }

  onProgress?.({
    total: pending.length,
    completed: pending.length,
    failed: result.failedCount,
  });

  // Update pending count
  result.pendingCount = await getPendingSyncCount();

  return result;
};

/**
 * Retry a specific failed operation
 */
export const retrySyncOperation = async (
  operationId: string
): Promise<{ success: boolean; error?: string }> => {
  const queue = await getSyncQueue();
  const operation = queue.find((op) => op.id === operationId);

  if (!operation) {
    return { success: false, error: 'Operation not found' };
  }

  if (operation.status !== 'failed') {
    return { success: false, error: 'Operation is not in failed state' };
  }

  // Reset retry count and status
  await updateSyncOperationStatus(operationId, 'pending');

  // Execute immediately
  const result = await executeSyncOperation(operation);

  if (result.success) {
    await updateSyncOperationStatus(operationId, 'success');
    return { success: true };
  } else {
    await updateSyncOperationStatus(operationId, 'failed', result.error);
    return { success: false, error: result.error };
  }
};

/**
 * Cancel a pending operation
 */
export const cancelSyncOperation = async (
  operationId: string
): Promise<{ success: boolean; error?: string }> => {
  const result = await removeFromSyncQueue(operationId);
  return { success: result.success, error: result.error };
};

/**
 * Get sync queue status
 */
export const getSyncQueueStatus = async (): Promise<{
  total: number;
  pending: number;
  syncing: number;
  success: number;
  failed: number;
}> => {
  const queue = await getSyncQueue();

  return {
    total: queue.length,
    pending: queue.filter((op) => op.status === 'pending').length,
    syncing: queue.filter((op) => op.status === 'syncing').length,
    success: queue.filter((op) => op.status === 'success').length,
    failed: queue.filter((op) => op.status === 'failed').length,
  };
};

/**
 * Get all failed operations
 */
export const getFailedOperations = async (): Promise<SyncOperation[]> => {
  const queue = await getSyncQueue();
  return queue.filter((op) => op.status === 'failed');
};

/**
 * Clear completed operations from queue
 */
export const clearCompleted = async (): Promise<void> => {
  await clearCompletedSyncOperations();
};

/**
 * Clear all operations (including failed)
 */
export const clearAll = async (): Promise<void> => {
  await saveSyncQueue([]);
};

/**
 * Retry all failed operations
 */
export const retryAllFailed = async (
  onProgress?: SyncProgressCallback
): Promise<SyncResult> => {
  const queue = await getSyncQueue();
  const failed = queue.filter((op) => op.status === 'failed');

  // Reset all failed to pending
  for (const op of failed) {
    await updateSyncOperationStatus(op.id, 'pending');
  }

  // Process the queue
  return processSyncQueue(onProgress);
};

/**
 * Check if there are any pending sync operations
 */
export const hasPendingSync = async (): Promise<boolean> => {
  const count = await getPendingSyncCount();
  return count > 0;
};

/**
 * Get count of pending operations
 */
export const getPendingCount = async (): Promise<number> => {
  return getPendingSyncCount();
};

export default {
  queueSyncOperation,
  processSyncQueue,
  retrySyncOperation,
  cancelSyncOperation,
  getSyncQueueStatus,
  getFailedOperations,
  clearCompleted,
  clearAll,
  retryAllFailed,
  hasPendingSync,
  getPendingCount,
};
