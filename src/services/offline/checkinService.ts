/**
 * Checkin Service
 * Handles syncing local changes back to the server
 */

import apiClient from '../api/client';
import {
  CheckinRequest,
  CheckinResponse,
  SyncChange,
  CheckoutMetadata,
  SyncConflict,
  OfflineDWR,
  SyncOperationType,
} from '../../types/offline.types';
import {
  getDeviceId,
  getCheckoutMetadata,
  getAllDWRs,
  getSyncQueue,
  clearAllOfflineData,
  saveSyncQueue,
} from './storageService';

// ===============================
// Types
// ===============================

export interface CheckinResult {
  success: boolean;
  syncedCount?: number;
  conflictCount?: number;
  conflicts?: SyncConflict[];
  error?: string;
}

export interface CheckinProgress {
  phase: 'collecting' | 'syncing' | 'resolving' | 'cleanup' | 'complete';
  current: number;
  total: number;
  message: string;
}

export type CheckinProgressCallback = (progress: CheckinProgress) => void;

// ===============================
// Helper Functions
// ===============================

/**
 * Collect all local changes from DWRs
 */
const collectDWRChanges = async (): Promise<SyncChange[]> => {
  const changes: SyncChange[] = [];
  const dwrs = await getAllDWRs();

  for (const dwr of dwrs) {
    if (dwr.has_local_changes) {
      // Determine operation type
      let type: SyncOperationType = 'update';
      if (dwr.created_locally) {
        type = 'create';
      }

      changes.push({
        type,
        entity: 'daily_work_record',
        local_id: dwr.local_id,
        server_id: dwr.server_id,
        data: {
          subproject_id: dwr.subproject_id,
          date: dwr.date,
          ticket_number: dwr.ticket_number,
          notes: dwr.notes,
          contact_id: dwr.contact_id,
          is_last_day: dwr.is_last_day,
          status: dwr.status,
        },
      });
    }

    // Collect work assignment changes
    if (dwr.work_assignments) {
      for (const wa of dwr.work_assignments) {
        if (wa.has_local_changes || wa.created_locally || wa.deleted_locally) {
          let type: SyncOperationType = 'update';
          if (wa.created_locally) {
            type = 'create';
          } else if (wa.deleted_locally) {
            type = 'delete';
          }

          changes.push({
            type,
            entity: 'work_assignment',
            local_id: wa.local_id,
            server_id: wa.server_id,
            data: {
              dwr_id: dwr.server_id,
              work_description_id: wa.work_description_id,
              description: wa.description,
              from_time: wa.from_time,
              to_time: wa.to_time,
              input_values: wa.input_values,
              is_legacy: wa.is_legacy,
            },
          });
        }
      }
    }

    // Collect time record changes
    if (dwr.time_records) {
      for (const tr of dwr.time_records) {
        if (tr.has_local_changes || tr.created_locally || tr.deleted_locally) {
          let type: SyncOperationType = 'update';
          if (tr.created_locally) {
            type = 'create';
          } else if (tr.deleted_locally) {
            type = 'delete';
          }

          changes.push({
            type,
            entity: 'employee_time_record',
            local_id: tr.local_id,
            server_id: tr.server_id,
            data: {
              dwr_id: dwr.server_id,
              employee_id: tr.employee_id,
              start_time: tr.start_time,
              stop_time: tr.stop_time,
              rig_time: tr.rig_time,
              travel_time: tr.travel_time,
              role_id: tr.role_id,
            },
          });
        }
      }
    }

    // Collect charge record changes
    if (dwr.charge_record && dwr.charge_record.has_local_changes) {
      const cr = dwr.charge_record;

      // Inventory charges
      for (const ic of cr.inventory_charges) {
        if (ic.has_local_changes || ic.created_locally || ic.deleted_locally) {
          let type: SyncOperationType = 'update';
          if (ic.created_locally) {
            type = 'create';
          } else if (ic.deleted_locally) {
            type = 'delete';
          }

          changes.push({
            type,
            entity: 'inventory_charge',
            local_id: ic.local_id,
            server_id: ic.server_id,
            data: {
              charge_record_id: cr.server_id,
              inventory_item_id: ic.inventory_item_id,
              quantity_used: ic.quantity_used,
              price_at_use: ic.price_at_use,
              is_billable: ic.is_billable,
              off_turnkey: ic.off_turnkey,
            },
          });
        }
      }

      // Service charges
      for (const sc of cr.service_charges) {
        if (sc.has_local_changes || sc.created_locally || sc.deleted_locally) {
          let type: SyncOperationType = 'update';
          if (sc.created_locally) {
            type = 'create';
          } else if (sc.deleted_locally) {
            type = 'delete';
          }

          changes.push({
            type,
            entity: 'service_charge',
            local_id: sc.local_id,
            server_id: sc.server_id,
            data: {
              charge_record_id: cr.server_id,
              service_item_id: sc.service_item_id,
              quantity_used: sc.quantity_used,
              price_at_use: sc.price_at_use,
              is_billable: sc.is_billable,
              off_turnkey: sc.off_turnkey,
            },
          });
        }
      }

      // Miscellaneous charges
      for (const mc of cr.miscellaneous_charges) {
        if (mc.has_local_changes || mc.created_locally || mc.deleted_locally) {
          let type: SyncOperationType = 'update';
          if (mc.created_locally) {
            type = 'create';
          } else if (mc.deleted_locally) {
            type = 'delete';
          }

          changes.push({
            type,
            entity: 'miscellaneous_charge',
            local_id: mc.local_id,
            server_id: mc.server_id,
            data: {
              charge_record_id: cr.server_id,
              miscellaneous_item_id: mc.miscellaneous_item_id,
              custom_name: mc.custom_name,
              quantity_used: mc.quantity_used,
              price_at_use: mc.price_at_use,
              is_billable: mc.is_billable,
              off_turnkey: mc.off_turnkey,
            },
          });
        }
      }
    }
  }

  return changes;
};

/**
 * Collect changes from sync queue
 */
const collectQueuedChanges = async (): Promise<SyncChange[]> => {
  const queue = await getSyncQueue();
  
  return queue
    .filter((op) => op.status === 'pending' || op.status === 'failed')
    .map((op) => ({
      type: op.type,
      entity: op.entity,
      local_id: op.local_id,
      server_id: op.server_id,
      data: op.data,
    }));
};

/**
 * Sync individual changes when bulk checkin endpoint is not available
 */
const syncChangesIndividually = async (
  changes: SyncChange[],
  onProgress?: CheckinProgressCallback
): Promise<{ syncedCount: number; failedCount: number; errors: string[] }> => {
  let syncedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    
    onProgress?.({
      phase: 'syncing',
      current: i + 1,
      total: changes.length,
      message: `Syncing ${change.entity} (${i + 1}/${changes.length})...`,
    });

    try {
      const endpoint = getEntityEndpoint(change.entity, change.server_id);
      
      switch (change.type) {
        case 'create':
          await apiClient.post(endpoint.base, change.data);
          syncedCount++;
          break;
        case 'update':
          if (change.server_id) {
            await apiClient.patch(endpoint.detail, change.data);
            syncedCount++;
          } else {
            // Can't update without server ID
            errors.push(`Cannot update ${change.entity} without server ID`);
            failedCount++;
          }
          break;
        case 'delete':
          if (change.server_id) {
            await apiClient.delete(endpoint.detail);
            syncedCount++;
          } else {
            // Local-only record, just skip
            syncedCount++;
          }
          break;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to sync ${change.entity}: ${errorMsg}`);
      failedCount++;
    }
  }

  return { syncedCount, failedCount, errors };
};

/**
 * Get API endpoint for entity type
 */
const getEntityEndpoint = (
  entity: string,
  serverId?: number
): { base: string; detail: string } => {
  const endpoints: Record<string, string> = {
    daily_work_record: '/api/workrecords/',
    work_assignment: '/api/work-assignments/',
    employee_time_record: '/api/time-records/',
    inventory_charge: '/api/inventory-charges/',
    service_charge: '/api/service-charges/',
    miscellaneous_charge: '/api/miscellaneous-charges/',
    charge_record: '/api/charge-records/',
  };

  const base = endpoints[entity] || `/api/${entity.replace(/_/g, '-')}s/`;
  const detail = serverId ? `${base}${serverId}/` : base;

  return { base, detail };
};

// ===============================
// Main Checkin Function
// ===============================

/**
 * Checkin and sync all local changes
 */
export const checkinRecords = async (
  onProgress?: CheckinProgressCallback
): Promise<CheckinResult> => {
  try {
    // Get checkout metadata
    const metadataResult = await getCheckoutMetadata();
    if (!metadataResult.success || !metadataResult.data) {
      return {
        success: false,
        error: 'No active checkout found',
      };
    }

    const metadata: CheckoutMetadata = metadataResult.data;
    const deviceId = await getDeviceId();

    onProgress?.({
      phase: 'collecting',
      current: 0,
      total: 100,
      message: 'Collecting local changes...',
    });

    // Collect all changes
    const dwrChanges = await collectDWRChanges();
    const queuedChanges = await collectQueuedChanges();
    
    // Merge and deduplicate changes
    const allChanges = [...dwrChanges];
    for (const qc of queuedChanges) {
      const exists = allChanges.find(
        (c) => c.local_id === qc.local_id && c.entity === qc.entity
      );
      if (!exists) {
        allChanges.push(qc);
      }
    }

    onProgress?.({
      phase: 'syncing',
      current: 10,
      total: 100,
      message: `Syncing ${allChanges.length} changes...`,
    });

    let syncedCount = 0;
    let conflicts: SyncConflict[] = [];

    if (allChanges.length === 0) {
      // No changes to sync
      onProgress?.({
        phase: 'cleanup',
        current: 90,
        total: 100,
        message: 'No changes to sync, cleaning up...',
      });
    } else {
      // Try bulk checkin first
      try {
        const request: CheckinRequest = {
          checkout_id: metadata.checkout_id,
          changes: allChanges,
          device_id: deviceId,
        };

        const response = await apiClient.post<CheckinResponse>(
          '/api/workrecords/checkin/',
          request
        );

        syncedCount = response.data.results.filter((r) => r.status === 'success').length;
        conflicts = response.data.conflicts || [];
      } catch (apiError) {
        // Bulk checkin not available, sync individually
        console.warn('Bulk checkin not available, syncing individually:', apiError);
        
        const result = await syncChangesIndividually(allChanges, onProgress);
        syncedCount = result.syncedCount;
        
        if (result.errors.length > 0) {
          console.warn('Sync errors:', result.errors);
        }
      }
    }

    // Handle conflicts if any
    if (conflicts.length > 0) {
      onProgress?.({
        phase: 'resolving',
        current: 80,
        total: 100,
        message: `${conflicts.length} conflicts detected`,
      });

      // For now, we'll return conflicts to the caller for resolution
      // In the future, we can implement automatic resolution based on strategy
    }

    onProgress?.({
      phase: 'cleanup',
      current: 90,
      total: 100,
      message: 'Cleaning up local data...',
    });

    // Clear all offline data
    await clearAllOfflineData();

    // Clear sync queue
    await saveSyncQueue([]);

    onProgress?.({
      phase: 'complete',
      current: 100,
      total: 100,
      message: 'Checkin complete!',
    });

    return {
      success: true,
      syncedCount,
      conflictCount: conflicts.length,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };
  } catch (error) {
    console.error('Checkin error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Checkin failed',
    };
  }
};

/**
 * Force clear checkout without syncing
 * WARNING: This will lose any unsynced local changes!
 */
export const forceCheckin = async (): Promise<CheckinResult> => {
  try {
    await clearAllOfflineData();
    await saveSyncQueue([]);
    
    return {
      success: true,
      syncedCount: 0,
    };
  } catch (error) {
    console.error('Force checkin error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Force checkin failed',
    };
  }
};

/**
 * Get count of pending changes
 */
export const getPendingChangesCount = async (): Promise<number> => {
  const dwrChanges = await collectDWRChanges();
  const queuedChanges = await collectQueuedChanges();
  
  // Deduplicate
  const allChanges = new Set([
    ...dwrChanges.map((c) => `${c.entity}:${c.local_id}`),
    ...queuedChanges.map((c) => `${c.entity}:${c.local_id}`),
  ]);
  
  return allChanges.size;
};

/**
 * Get summary of pending changes
 */
export const getPendingChangesSummary = async (): Promise<{
  dwrCount: number;
  workAssignmentCount: number;
  timeRecordCount: number;
  chargeCount: number;
  total: number;
}> => {
  const changes = await collectDWRChanges();
  
  const summary = {
    dwrCount: 0,
    workAssignmentCount: 0,
    timeRecordCount: 0,
    chargeCount: 0,
    total: changes.length,
  };

  for (const change of changes) {
    switch (change.entity) {
      case 'daily_work_record':
        summary.dwrCount++;
        break;
      case 'work_assignment':
        summary.workAssignmentCount++;
        break;
      case 'employee_time_record':
        summary.timeRecordCount++;
        break;
      case 'inventory_charge':
      case 'service_charge':
      case 'miscellaneous_charge':
        summary.chargeCount++;
        break;
    }
  }

  return summary;
};

export default {
  checkinRecords,
  forceCheckin,
  getPendingChangesCount,
  getPendingChangesSummary,
};
