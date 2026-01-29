/**
 * Offline Storage Service
 * SQLite-based storage with type safety and error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEYS,
  OfflineProject,
  OfflineSubproject,
  OfflineDWR,
  OfflineWorkAssignment,
  OfflineEmployeeTimeRecord,
  OfflineChargeRecord,
  OfflineInventoryCharge,
  OfflineServiceCharge,
  OfflineMiscellaneousCharge,
  CheckoutMetadata,
  SyncOperation,
  StorageResult,
} from '../../types/offline.types';
import {
  getDatabase,
  executeSql,
  executeTransaction,
  clearAllData as clearDatabase,
  getDatabaseStats,
} from './database';

/**
 * Generate a unique local ID (UUID v4)
 */
export const generateLocalId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Get device ID or generate one if it doesn't exist
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = generateLocalId();
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return generateLocalId();
  }
};

// ===============================
// Helper Functions
// ===============================

/**
 * Convert SQLite row to object with proper types
 */
const parseJsonField = <T>(value: string | null): T | undefined => {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

// ===============================
// Checkout Metadata Operations
// ===============================

export const saveCheckoutMetadata = async (
  metadata: CheckoutMetadata
): Promise<StorageResult<void>> => {
  try {
    await executeSql(
      `INSERT OR REPLACE INTO checkout_metadata 
       (checkout_id, rig_id, rig_name, user_id, username, device_id, 
        checked_out_at, expires_at, is_active, record_count, last_sync_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        metadata.checkout_id,
        metadata.rig_id,
        metadata.rig_name || null,
        metadata.user_id,
        metadata.username || null,
        metadata.device_id,
        metadata.checked_out_at,
        metadata.expires_at,
        metadata.is_active ? 1 : 0,
        metadata.record_count,
        metadata.last_sync_at || null,
      ]
    );
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving checkout metadata:', error);
    return { success: false, error: errorMessage };
  }
};

export const getCheckoutMetadata = async (): Promise<StorageResult<CheckoutMetadata>> => {
  try {
    const result = await executeSql(
      'SELECT * FROM checkout_metadata WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return { success: true, data: undefined };
    }

    const row = result.rows.item(0);
    const metadata: CheckoutMetadata = {
      checkout_id: row.checkout_id,
      rig_id: row.rig_id,
      rig_name: row.rig_name,
      user_id: row.user_id,
      username: row.username,
      device_id: row.device_id,
      checked_out_at: row.checked_out_at,
      expires_at: row.expires_at,
      is_active: row.is_active === 1,
      record_count: row.record_count,
      last_sync_at: row.last_sync_at,
    };

    return { success: true, data: metadata };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting checkout metadata:', error);
    return { success: false, error: errorMessage };
  }
};

export const clearCheckoutMetadata = async (): Promise<StorageResult<void>> => {
  try {
    await executeSql('UPDATE checkout_metadata SET is_active = 0');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error clearing checkout metadata:', error);
    return { success: false, error: errorMessage };
  }
};

export const isCheckedOut = async (): Promise<boolean> => {
  const result = await getCheckoutMetadata();
  if (!result.success || !result.data) {
    return false;
  }
  return result.data.is_active && result.data.expires_at > Date.now();
};

// ===============================
// Project Operations
// ===============================

/**
 * Save a project to the database
 */
export const saveProject = async (project: OfflineProject): Promise<StorageResult<void>> => {
  try {
    await executeSql(
      `INSERT OR REPLACE INTO projects 
       (server_id, name, description, customer_id, customer_name, status,
        start_date, end_date, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        project.server_id,
        project.name,
        project.description || null,
        project.customer_id || null,
        project.customer_name || null,
        project.status || 'active',
        project.start_date || null,
        project.end_date || null,
        project.is_active ? 1 : 0,
      ]
    );
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving project:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get a project by server ID
 */
export const getProject = async (serverId: number): Promise<StorageResult<OfflineProject>> => {
  try {
    const result = await executeSql(
      'SELECT * FROM projects WHERE server_id = ?',
      [serverId]
    );

    if (result.rows.length === 0) {
      return { success: true, data: undefined };
    }

    return { success: true, data: rowToProject(result.rows.item(0)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting project:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get all projects
 */
export const getAllProjects = async (): Promise<OfflineProject[]> => {
  try {
    const result = await executeSql(
      'SELECT * FROM projects WHERE is_active = 1 ORDER BY name'
    );

    const projects: OfflineProject[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      projects.push(rowToProject(result.rows.item(i)));
    }
    return projects;
  } catch (error) {
    console.error('Error getting all projects:', error);
    return [];
  }
};

const rowToProject = (row: Record<string, unknown>): OfflineProject => ({
  id: row.id as number | undefined,
  server_id: row.server_id as number,
  name: row.name as string,
  description: row.description as string | undefined,
  customer_id: row.customer_id as number | undefined,
  customer_name: row.customer_name as string | undefined,
  status: row.status as string || 'active',
  start_date: row.start_date as string | undefined,
  end_date: row.end_date as string | undefined,
  is_active: row.is_active === 1,
});

// ===============================
// Subproject Operations
// ===============================

/**
 * Save a subproject to the database
 */
export const saveSubproject = async (subproject: OfflineSubproject): Promise<StorageResult<void>> => {
  try {
    await executeSql(
      `INSERT OR REPLACE INTO subprojects 
       (server_id, project_id, name, job_number, description, assigned_rig_id,
        assigned_rig_name, assigned_rig_number, well_id, well_name, well_api_number,
        customer_id, customer_name, status, is_active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        subproject.server_id,
        subproject.project_id || null,
        subproject.name,
        subproject.job_number || null,
        subproject.description || null,
        subproject.assigned_rig_id || subproject.assigned_rig?.id || null,
        subproject.assigned_rig_name || subproject.assigned_rig?.name || null,
        subproject.assigned_rig_number || subproject.assigned_rig?.rig_number || null,
        subproject.well_id || subproject.well?.id || null,
        subproject.well_name || subproject.well?.name || null,
        subproject.well_api_number || subproject.well?.api_number || null,
        subproject.customer_id || subproject.well?.customer?.id || null,
        subproject.customer_name || subproject.well?.customer?.name || null,
        subproject.status || 'active',
        subproject.is_active ? 1 : 0,
      ]
    );
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving subproject:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get a subproject by server ID
 */
export const getSubproject = async (serverId: number): Promise<StorageResult<OfflineSubproject>> => {
  try {
    const result = await executeSql(
      'SELECT * FROM subprojects WHERE server_id = ?',
      [serverId]
    );

    if (result.rows.length === 0) {
      return { success: true, data: undefined };
    }

    return { success: true, data: rowToSubproject(result.rows.item(0)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting subproject:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get all subprojects
 */
export const getAllSubprojects = async (): Promise<OfflineSubproject[]> => {
  try {
    const result = await executeSql(
      'SELECT * FROM subprojects WHERE is_active = 1 ORDER BY name'
    );

    const subprojects: OfflineSubproject[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      subprojects.push(rowToSubproject(result.rows.item(i)));
    }
    return subprojects;
  } catch (error) {
    console.error('Error getting all subprojects:', error);
    return [];
  }
};

/**
 * Get subprojects by rig ID
 */
export const getSubprojectsByRig = async (rigId: number): Promise<OfflineSubproject[]> => {
  try {
    const result = await executeSql(
      'SELECT * FROM subprojects WHERE assigned_rig_id = ? AND is_active = 1 ORDER BY name',
      [rigId]
    );

    const subprojects: OfflineSubproject[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      subprojects.push(rowToSubproject(result.rows.item(i)));
    }
    return subprojects;
  } catch (error) {
    console.error('Error getting subprojects by rig:', error);
    return [];
  }
};

/**
 * Get subprojects by project ID
 */
export const getSubprojectsByProject = async (projectId: number): Promise<OfflineSubproject[]> => {
  try {
    const result = await executeSql(
      'SELECT * FROM subprojects WHERE project_id = ? AND is_active = 1 ORDER BY name',
      [projectId]
    );

    const subprojects: OfflineSubproject[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      subprojects.push(rowToSubproject(result.rows.item(i)));
    }
    return subprojects;
  } catch (error) {
    console.error('Error getting subprojects by project:', error);
    return [];
  }
};

const rowToSubproject = (row: Record<string, unknown>): OfflineSubproject => ({
  id: row.id as number | undefined,
  server_id: row.server_id as number,
  project_id: row.project_id as number | undefined,
  name: row.name as string,
  job_number: row.job_number as string | undefined,
  description: row.description as string | undefined,
  assigned_rig_id: row.assigned_rig_id as number | undefined,
  assigned_rig_name: row.assigned_rig_name as string | undefined,
  assigned_rig_number: row.assigned_rig_number as string | undefined,
  assigned_rig: row.assigned_rig_id ? {
    id: row.assigned_rig_id as number,
    name: row.assigned_rig_name as string || '',
    rig_number: row.assigned_rig_number as string | undefined,
  } : undefined,
  well_id: row.well_id as number | undefined,
  well_name: row.well_name as string | undefined,
  well_api_number: row.well_api_number as string | undefined,
  well: row.well_id ? {
    id: row.well_id as number,
    name: row.well_name as string || '',
    api_number: row.well_api_number as string | undefined,
  } : undefined,
  customer_id: row.customer_id as number | undefined,
  customer_name: row.customer_name as string | undefined,
  status: row.status as string || 'active',
  is_active: row.is_active === 1,
});

// ===============================
// DWR Operations
// ===============================

/**
 * Save a DWR to the database
 */
export const saveDWR = async (dwr: OfflineDWR): Promise<StorageResult<void>> => {
  try {
    await executeSql(
      `INSERT OR REPLACE INTO dwrs 
       (local_id, server_id, subproject_id, subproject_data, date, ticket_number,
        notes, contact_id, contact_data, is_last_day, is_locked, lock_date,
        is_approved, approved_at, approved_by, status, is_checked_out,
        has_local_changes, created_locally, last_synced_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        dwr.local_id,
        dwr.server_id || null,
        dwr.subproject_id,
        dwr.subproject ? JSON.stringify(dwr.subproject) : null,
        dwr.date,
        dwr.ticket_number || null,
        dwr.notes || null,
        dwr.contact_id || null,
        dwr.contact ? JSON.stringify(dwr.contact) : null,
        dwr.is_last_day ? 1 : 0,
        dwr.is_locked ? 1 : 0,
        dwr.lock_date || null,
        dwr.is_approved ? 1 : 0,
        dwr.approved_at || null,
        dwr.approved_by || null,
        dwr.status,
        dwr.is_checked_out ? 1 : 0,
        dwr.has_local_changes ? 1 : 0,
        dwr.created_locally ? 1 : 0,
        dwr.last_synced_at || null,
      ]
    );
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving DWR:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get a DWR by local ID
 */
export const getDWR = async (localId: string): Promise<StorageResult<OfflineDWR>> => {
  try {
    const result = await executeSql(
      'SELECT * FROM dwrs WHERE local_id = ?',
      [localId]
    );

    if (result.rows.length === 0) {
      return { success: true, data: undefined };
    }

    const row = result.rows.item(0);
    const dwr = rowToDWR(row);

    // Load related data
    dwr.work_assignments = await getWorkAssignmentsByDWR(localId);
    dwr.time_records = await getTimeRecordsByDWR(localId);
    dwr.charge_record = await getChargeRecordByDWR(localId);

    return { success: true, data: dwr };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting DWR:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get all DWRs
 */
export const getAllDWRs = async (): Promise<OfflineDWR[]> => {
  try {
    const result = await executeSql(
      'SELECT * FROM dwrs WHERE is_checked_out = 1 ORDER BY date DESC'
    );

    const dwrs: OfflineDWR[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      const dwr = rowToDWR(row);
      
      // Load related data
      dwr.work_assignments = await getWorkAssignmentsByDWR(dwr.local_id);
      dwr.time_records = await getTimeRecordsByDWR(dwr.local_id);
      dwr.charge_record = await getChargeRecordByDWR(dwr.local_id);
      
      dwrs.push(dwr);
    }

    return dwrs;
  } catch (error) {
    console.error('Error getting all DWRs:', error);
    return [];
  }
};

/**
 * Get checked out DWR IDs (for compatibility)
 */
export const getCheckedOutDWRIds = async (): Promise<string[]> => {
  try {
    const result = await executeSql(
      'SELECT local_id FROM dwrs WHERE is_checked_out = 1'
    );
    
    const ids: string[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      ids.push(result.rows.item(i).local_id);
    }
    return ids;
  } catch (error) {
    console.error('Error getting checked out DWR IDs:', error);
    return [];
  }
};

/**
 * Save checked out DWR IDs (no-op for SQLite, kept for compatibility)
 */
export const saveCheckedOutDWRIds = async (
  _localIds: string[]
): Promise<StorageResult<void>> => {
  // In SQLite, DWR IDs are tracked by is_checked_out flag
  return { success: true };
};

/**
 * Update a DWR with changes
 */
export const updateDWR = async (
  localId: string,
  updates: Partial<OfflineDWR>
): Promise<StorageResult<OfflineDWR>> => {
  try {
    const current = await getDWR(localId);
    if (!current.success || !current.data) {
      return { success: false, error: 'DWR not found' };
    }

    const updatedDWR: OfflineDWR = {
      ...current.data,
      ...updates,
      has_local_changes: true,
    };

    await saveDWR(updatedDWR);
    return { success: true, data: updatedDWR };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

/**
 * Delete a DWR
 */
export const deleteDWR = async (localId: string): Promise<StorageResult<void>> => {
  try {
    // CASCADE will delete related records
    await executeSql('DELETE FROM dwrs WHERE local_id = ?', [localId]);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting DWR:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Convert database row to DWR object
 */
const rowToDWR = (row: Record<string, unknown>): OfflineDWR => {
  return {
    id: row.id as number | undefined,
    local_id: row.local_id as string,
    server_id: row.server_id as number | undefined,
    subproject_id: row.subproject_id as number,
    subproject: parseJsonField(row.subproject_data as string | null),
    date: row.date as string,
    ticket_number: row.ticket_number as string || '',
    notes: row.notes as string || '',
    contact_id: row.contact_id as number | null,
    contact: parseJsonField(row.contact_data as string | null),
    is_last_day: row.is_last_day === 1,
    is_locked: row.is_locked === 1,
    lock_date: row.lock_date as string | null,
    is_approved: row.is_approved === 1,
    approved_at: row.approved_at as string | null,
    approved_by: row.approved_by as number | null,
    status: row.status as OfflineDWR['status'],
    is_checked_out: row.is_checked_out === 1,
    has_local_changes: row.has_local_changes === 1,
    created_locally: row.created_locally === 1,
    last_synced_at: row.last_synced_at as number | null,
    work_assignments: [],
    time_records: [],
    charge_record: undefined,
  };
};

// ===============================
// Work Assignment Operations
// ===============================

export const saveWorkAssignment = async (
  assignment: OfflineWorkAssignment
): Promise<StorageResult<void>> => {
  try {
    await executeSql(
      `INSERT OR REPLACE INTO work_assignments 
       (local_id, server_id, dwr_local_id, work_description_id, work_description_data,
        description, from_time, to_time, input_values, is_legacy,
        has_local_changes, created_locally, deleted_locally, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        assignment.local_id,
        assignment.server_id || null,
        assignment.dwr_id as string,
        assignment.work_description_id || null,
        assignment.work_description ? JSON.stringify(assignment.work_description) : null,
        assignment.description,
        assignment.from_time || null,
        assignment.to_time || null,
        JSON.stringify(assignment.input_values),
        assignment.is_legacy ? 1 : 0,
        assignment.has_local_changes ? 1 : 0,
        assignment.created_locally ? 1 : 0,
        assignment.deleted_locally ? 1 : 0,
      ]
    );
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving work assignment:', error);
    return { success: false, error: errorMessage };
  }
};

export const getWorkAssignment = async (
  localId: string
): Promise<StorageResult<OfflineWorkAssignment>> => {
  try {
    const result = await executeSql(
      'SELECT * FROM work_assignments WHERE local_id = ?',
      [localId]
    );

    if (result.rows.length === 0) {
      return { success: true, data: undefined };
    }

    return { success: true, data: rowToWorkAssignment(result.rows.item(0)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

const getWorkAssignmentsByDWR = async (dwrLocalId: string): Promise<OfflineWorkAssignment[]> => {
  try {
    const result = await executeSql(
      'SELECT * FROM work_assignments WHERE dwr_local_id = ? AND deleted_locally = 0',
      [dwrLocalId]
    );

    const assignments: OfflineWorkAssignment[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      assignments.push(rowToWorkAssignment(result.rows.item(i)));
    }
    return assignments;
  } catch (error) {
    console.error('Error getting work assignments:', error);
    return [];
  }
};

export const deleteWorkAssignment = async (
  localId: string
): Promise<StorageResult<void>> => {
  try {
    await executeSql('DELETE FROM work_assignments WHERE local_id = ?', [localId]);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

const rowToWorkAssignment = (row: Record<string, unknown>): OfflineWorkAssignment => {
  return {
    id: row.id as number | undefined,
    local_id: row.local_id as string,
    server_id: row.server_id as number | undefined,
    dwr_id: row.dwr_local_id as string,
    work_description_id: row.work_description_id as number | undefined,
    work_description: parseJsonField(row.work_description_data as string | null),
    description: row.description as string,
    from_time: row.from_time as string || '',
    to_time: row.to_time as string | null,
    input_values: parseJsonField(row.input_values as string) || {},
    is_legacy: row.is_legacy === 1,
    has_local_changes: row.has_local_changes === 1,
    created_locally: row.created_locally === 1,
    deleted_locally: row.deleted_locally === 1,
  };
};

// ===============================
// Time Record Operations
// ===============================

export const saveTimeRecord = async (
  record: OfflineEmployeeTimeRecord
): Promise<StorageResult<void>> => {
  try {
    await executeSql(
      `INSERT OR REPLACE INTO time_records 
       (local_id, server_id, dwr_local_id, employee_id, employee_data,
        start_time, stop_time, rig_time, travel_time, role_id, role_data,
        has_local_changes, created_locally, deleted_locally, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        record.local_id,
        record.server_id || null,
        record.dwr_id as string,
        record.employee_id,
        record.employee ? JSON.stringify(record.employee) : null,
        record.start_time || null,
        record.stop_time || null,
        record.rig_time || null,
        record.travel_time || null,
        record.role_id || null,
        record.role ? JSON.stringify(record.role) : null,
        record.has_local_changes ? 1 : 0,
        record.created_locally ? 1 : 0,
        record.deleted_locally ? 1 : 0,
      ]
    );
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving time record:', error);
    return { success: false, error: errorMessage };
  }
};

export const getTimeRecord = async (
  localId: string
): Promise<StorageResult<OfflineEmployeeTimeRecord>> => {
  try {
    const result = await executeSql(
      'SELECT * FROM time_records WHERE local_id = ?',
      [localId]
    );

    if (result.rows.length === 0) {
      return { success: true, data: undefined };
    }

    return { success: true, data: rowToTimeRecord(result.rows.item(0)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

const getTimeRecordsByDWR = async (dwrLocalId: string): Promise<OfflineEmployeeTimeRecord[]> => {
  try {
    const result = await executeSql(
      'SELECT * FROM time_records WHERE dwr_local_id = ? AND deleted_locally = 0',
      [dwrLocalId]
    );

    const records: OfflineEmployeeTimeRecord[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      records.push(rowToTimeRecord(result.rows.item(i)));
    }
    return records;
  } catch (error) {
    console.error('Error getting time records:', error);
    return [];
  }
};

export const deleteTimeRecord = async (
  localId: string
): Promise<StorageResult<void>> => {
  try {
    await executeSql('DELETE FROM time_records WHERE local_id = ?', [localId]);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

const rowToTimeRecord = (row: Record<string, unknown>): OfflineEmployeeTimeRecord => {
  return {
    id: row.id as number | undefined,
    local_id: row.local_id as string,
    server_id: row.server_id as number | undefined,
    employee_id: row.employee_id as number,
    employee: parseJsonField(row.employee_data as string | null),
    dwr_id: row.dwr_local_id as string,
    start_time: row.start_time as string | null,
    stop_time: row.stop_time as string | null,
    rig_time: row.rig_time as string | null,
    travel_time: row.travel_time as string | null,
    role_id: row.role_id as number,
    role: parseJsonField(row.role_data as string | null),
    has_local_changes: row.has_local_changes === 1,
    created_locally: row.created_locally === 1,
    deleted_locally: row.deleted_locally === 1,
  };
};

// ===============================
// Charge Record Operations
// ===============================

export const saveChargeRecord = async (
  record: OfflineChargeRecord
): Promise<StorageResult<void>> => {
  try {
    // Save the main charge record
    await executeSql(
      `INSERT OR REPLACE INTO charge_records 
       (local_id, server_id, dwr_local_id, total_amount, is_manual_total,
        has_local_changes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        record.local_id,
        record.server_id || null,
        record.dwr_id as string,
        record.total_amount,
        record.is_manual_total ? 1 : 0,
        record.has_local_changes ? 1 : 0,
      ]
    );

    // Save inventory charges
    for (const ic of record.inventory_charges) {
      await saveInventoryCharge(ic, record.local_id);
    }

    // Save service charges
    for (const sc of record.service_charges) {
      await saveServiceCharge(sc, record.local_id);
    }

    // Save miscellaneous charges
    for (const mc of record.miscellaneous_charges) {
      await saveMiscCharge(mc, record.local_id);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving charge record:', error);
    return { success: false, error: errorMessage };
  }
};

export const getChargeRecord = async (
  localId: string
): Promise<StorageResult<OfflineChargeRecord>> => {
  try {
    const result = await executeSql(
      'SELECT * FROM charge_records WHERE local_id = ?',
      [localId]
    );

    if (result.rows.length === 0) {
      return { success: true, data: undefined };
    }

    const row = result.rows.item(0);
    const chargeRecord = await buildChargeRecord(row);

    return { success: true, data: chargeRecord };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

const getChargeRecordByDWR = async (dwrLocalId: string): Promise<OfflineChargeRecord | undefined> => {
  try {
    const result = await executeSql(
      'SELECT * FROM charge_records WHERE dwr_local_id = ?',
      [dwrLocalId]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return await buildChargeRecord(result.rows.item(0));
  } catch (error) {
    console.error('Error getting charge record:', error);
    return undefined;
  }
};

const buildChargeRecord = async (row: Record<string, unknown>): Promise<OfflineChargeRecord> => {
  const localId = row.local_id as string;

  // Get inventory charges
  const invResult = await executeSql(
    'SELECT * FROM inventory_charges WHERE charge_record_local_id = ? AND deleted_locally = 0',
    [localId]
  );
  const inventoryCharges: OfflineInventoryCharge[] = [];
  for (let i = 0; i < invResult.rows.length; i++) {
    inventoryCharges.push(rowToInventoryCharge(invResult.rows.item(i)));
  }

  // Get service charges
  const svcResult = await executeSql(
    'SELECT * FROM service_charges WHERE charge_record_local_id = ? AND deleted_locally = 0',
    [localId]
  );
  const serviceCharges: OfflineServiceCharge[] = [];
  for (let i = 0; i < svcResult.rows.length; i++) {
    serviceCharges.push(rowToServiceCharge(svcResult.rows.item(i)));
  }

  // Get miscellaneous charges
  const miscResult = await executeSql(
    'SELECT * FROM miscellaneous_charges WHERE charge_record_local_id = ? AND deleted_locally = 0',
    [localId]
  );
  const miscCharges: OfflineMiscellaneousCharge[] = [];
  for (let i = 0; i < miscResult.rows.length; i++) {
    miscCharges.push(rowToMiscCharge(miscResult.rows.item(i)));
  }

  return {
    id: row.id as number | undefined,
    local_id: localId,
    server_id: row.server_id as number | undefined,
    dwr_id: row.dwr_local_id as string,
    inventory_charges: inventoryCharges,
    service_charges: serviceCharges,
    miscellaneous_charges: miscCharges,
    total_amount: row.total_amount as number,
    is_manual_total: row.is_manual_total === 1,
    has_local_changes: row.has_local_changes === 1,
  };
};

// Charge item helper functions
const saveInventoryCharge = async (charge: OfflineInventoryCharge, crLocalId: string) => {
  await executeSql(
    `INSERT OR REPLACE INTO inventory_charges 
     (local_id, server_id, charge_record_local_id, inventory_item_id, item_name,
      quantity_used, price_at_use, is_billable, off_turnkey, total,
      unit_name, unit_abbreviation, has_local_changes, created_locally, deleted_locally)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      charge.local_id, charge.server_id || null, crLocalId, charge.inventory_item_id,
      charge.item_name || null, charge.quantity_used, charge.price_at_use,
      charge.is_billable ? 1 : 0, charge.off_turnkey ? 1 : 0, charge.total || null,
      charge.unit_name || null, charge.unit_abbreviation || null,
      charge.has_local_changes ? 1 : 0, charge.created_locally ? 1 : 0, charge.deleted_locally ? 1 : 0,
    ]
  );
};

const saveServiceCharge = async (charge: OfflineServiceCharge, crLocalId: string) => {
  await executeSql(
    `INSERT OR REPLACE INTO service_charges 
     (local_id, server_id, charge_record_local_id, service_item_id, item_name,
      quantity_used, price_at_use, is_billable, off_turnkey, total,
      unit_name, unit_abbreviation, has_local_changes, created_locally, deleted_locally)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      charge.local_id, charge.server_id || null, crLocalId, charge.service_item_id,
      charge.item_name || null, charge.quantity_used, charge.price_at_use,
      charge.is_billable ? 1 : 0, charge.off_turnkey ? 1 : 0, charge.total || null,
      charge.unit_name || null, charge.unit_abbreviation || null,
      charge.has_local_changes ? 1 : 0, charge.created_locally ? 1 : 0, charge.deleted_locally ? 1 : 0,
    ]
  );
};

const saveMiscCharge = async (charge: OfflineMiscellaneousCharge, crLocalId: string) => {
  await executeSql(
    `INSERT OR REPLACE INTO miscellaneous_charges 
     (local_id, server_id, charge_record_local_id, miscellaneous_item_id, custom_name,
      quantity_used, price_at_use, is_billable, off_turnkey, total,
      unit_name, unit_abbreviation, has_local_changes, created_locally, deleted_locally)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      charge.local_id, charge.server_id || null, crLocalId, charge.miscellaneous_item_id,
      charge.custom_name || null, charge.quantity_used, charge.price_at_use,
      charge.is_billable ? 1 : 0, charge.off_turnkey ? 1 : 0, charge.total || null,
      charge.unit_name || null, charge.unit_abbreviation || null,
      charge.has_local_changes ? 1 : 0, charge.created_locally ? 1 : 0, charge.deleted_locally ? 1 : 0,
    ]
  );
};

const rowToInventoryCharge = (row: Record<string, unknown>): OfflineInventoryCharge => ({
  id: row.id as number | undefined,
  local_id: row.local_id as string,
  server_id: row.server_id as number | undefined,
  charge_record_id: 0, // Set from parent
  inventory_item_id: row.inventory_item_id as number,
  item_name: row.item_name as string | undefined,
  quantity_used: row.quantity_used as number,
  price_at_use: row.price_at_use as number,
  is_billable: row.is_billable === 1,
  off_turnkey: row.off_turnkey === 1,
  total: row.total as number | undefined,
  unit_name: row.unit_name as string | undefined,
  unit_abbreviation: row.unit_abbreviation as string | undefined,
  has_local_changes: row.has_local_changes === 1,
  created_locally: row.created_locally === 1,
  deleted_locally: row.deleted_locally === 1,
});

const rowToServiceCharge = (row: Record<string, unknown>): OfflineServiceCharge => ({
  id: row.id as number | undefined,
  local_id: row.local_id as string,
  server_id: row.server_id as number | undefined,
  charge_record_id: 0,
  service_item_id: row.service_item_id as number,
  item_name: row.item_name as string | undefined,
  quantity_used: row.quantity_used as number,
  price_at_use: row.price_at_use as number,
  is_billable: row.is_billable === 1,
  off_turnkey: row.off_turnkey === 1,
  total: row.total as number | undefined,
  unit_name: row.unit_name as string | undefined,
  unit_abbreviation: row.unit_abbreviation as string | undefined,
  has_local_changes: row.has_local_changes === 1,
  created_locally: row.created_locally === 1,
  deleted_locally: row.deleted_locally === 1,
});

const rowToMiscCharge = (row: Record<string, unknown>): OfflineMiscellaneousCharge => ({
  id: row.id as number | undefined,
  local_id: row.local_id as string,
  server_id: row.server_id as number | undefined,
  charge_record_id: 0,
  miscellaneous_item_id: row.miscellaneous_item_id as number,
  custom_name: row.custom_name as string || '',
  quantity_used: row.quantity_used as number,
  price_at_use: row.price_at_use as number,
  is_billable: row.is_billable === 1,
  off_turnkey: row.off_turnkey === 1,
  total: row.total as number | undefined,
  unit_name: row.unit_name as string | undefined,
  unit_abbreviation: row.unit_abbreviation as string | undefined,
  has_local_changes: row.has_local_changes === 1,
  created_locally: row.created_locally === 1,
  deleted_locally: row.deleted_locally === 1,
});

// ===============================
// Sync Queue Operations
// ===============================

export const getSyncQueue = async (): Promise<SyncOperation[]> => {
  try {
    const result = await executeSql(
      'SELECT * FROM sync_queue ORDER BY created_at ASC'
    );

    const operations: SyncOperation[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      operations.push({
        id: row.operation_id,
        type: row.type,
        entity: row.entity,
        local_id: row.local_id,
        server_id: row.server_id,
        dwr_local_id: row.dwr_local_id,
        data: JSON.parse(row.data),
        status: row.status,
        retry_count: row.retry_count,
        max_retries: row.max_retries,
        error: row.error,
        created_at: row.created_at,
        updated_at: row.updated_at,
        synced_at: row.synced_at,
      });
    }
    return operations;
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
};

export const saveSyncQueue = async (
  queue: SyncOperation[]
): Promise<StorageResult<void>> => {
  try {
    // Clear and re-insert all
    await executeSql('DELETE FROM sync_queue');
    
    for (const op of queue) {
      await executeSql(
        `INSERT INTO sync_queue 
         (operation_id, type, entity, local_id, server_id, dwr_local_id,
          data, status, retry_count, max_retries, error, created_at, updated_at, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          op.id, op.type, op.entity, op.local_id, op.server_id || null,
          op.dwr_local_id || null, JSON.stringify(op.data), op.status,
          op.retry_count, op.max_retries, op.error || null,
          op.created_at, op.updated_at, op.synced_at || null,
        ]
      );
    }
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving sync queue:', error);
    return { success: false, error: errorMessage };
  }
};

export const addToSyncQueue = async (
  operation: SyncOperation
): Promise<StorageResult<void>> => {
  try {
    // Check for existing operation
    const existing = await executeSql(
      'SELECT * FROM sync_queue WHERE local_id = ? AND entity = ?',
      [operation.local_id, operation.entity]
    );

    if (existing.rows.length > 0) {
      const existingOp = existing.rows.item(0);
      
      if (existingOp.type === 'create' && operation.type === 'update') {
        // Keep as create with updated data
        await executeSql(
          'UPDATE sync_queue SET data = ?, updated_at = ? WHERE local_id = ? AND entity = ?',
          [JSON.stringify(operation.data), Date.now(), operation.local_id, operation.entity]
        );
      } else if (operation.type === 'delete' && existingOp.type === 'create') {
        // Remove from queue - never synced anyway
        await executeSql(
          'DELETE FROM sync_queue WHERE local_id = ? AND entity = ?',
          [operation.local_id, operation.entity]
        );
      } else {
        // Replace with new operation
        await executeSql(
          `UPDATE sync_queue SET type = ?, data = ?, status = 'pending', 
           updated_at = ?, error = NULL WHERE local_id = ? AND entity = ?`,
          [operation.type, JSON.stringify(operation.data), Date.now(),
           operation.local_id, operation.entity]
        );
      }
    } else {
      // Insert new operation
      await executeSql(
        `INSERT INTO sync_queue 
         (operation_id, type, entity, local_id, server_id, dwr_local_id,
          data, status, retry_count, max_retries, error, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          operation.id, operation.type, operation.entity, operation.local_id,
          operation.server_id || null, operation.dwr_local_id || null,
          JSON.stringify(operation.data), operation.status, operation.retry_count,
          operation.max_retries, operation.error || null, operation.created_at,
          operation.updated_at,
        ]
      );
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error adding to sync queue:', error);
    return { success: false, error: errorMessage };
  }
};

export const removeFromSyncQueue = async (id: string): Promise<StorageResult<void>> => {
  try {
    await executeSql('DELETE FROM sync_queue WHERE operation_id = ?', [id]);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

export const updateSyncOperationStatus = async (
  id: string,
  status: SyncOperation['status'],
  error?: string
): Promise<StorageResult<void>> => {
  try {
    const syncedAt = status === 'success' ? Date.now() : null;
    await executeSql(
      `UPDATE sync_queue SET status = ?, error = ?, updated_at = ?, synced_at = ?
       WHERE operation_id = ?`,
      [status, error || null, Date.now(), syncedAt, id]
    );
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

export const getPendingSyncCount = async (): Promise<number> => {
  try {
    const result = await executeSql(
      "SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('pending', 'failed')"
    );
    return result.rows.item(0).count;
  } catch (error) {
    console.error('Error getting pending sync count:', error);
    return 0;
  }
};

export const clearCompletedSyncOperations = async (): Promise<StorageResult<void>> => {
  try {
    await executeSql("DELETE FROM sync_queue WHERE status = 'success'");
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

// ===============================
// Reference Data Operations
// ===============================

export const saveReferenceData = async <T>(
  key: string,
  data: T
): Promise<StorageResult<void>> => {
  try {
    await executeSql(
      `INSERT OR REPLACE INTO reference_data (key, data, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [key, JSON.stringify(data)]
    );
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving reference data:', error);
    return { success: false, error: errorMessage };
  }
};

export const getReferenceData = async <T>(key: string): Promise<T | null> => {
  try {
    const result = await executeSql(
      'SELECT data FROM reference_data WHERE key = ?',
      [key]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return JSON.parse(result.rows.item(0).data) as T;
  } catch (error) {
    console.error('Error getting reference data:', error);
    return null;
  }
};

// ===============================
// Clear All Offline Data
// ===============================

export const clearAllOfflineData = async (): Promise<StorageResult<void>> => {
  try {
    await clearDatabase();
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error clearing offline data:', error);
    return { success: false, error: errorMessage };
  }
};

export const getStorageStats = async (): Promise<{
  dwrCount: number;
  syncQueueCount: number;
  totalKeys: number;
}> => {
  try {
    const stats = await getDatabaseStats();
    return {
      dwrCount: stats.dwrCount,
      syncQueueCount: stats.syncQueueCount,
      totalKeys: stats.dwrCount + stats.workAssignmentCount + 
                 stats.timeRecordCount + stats.chargeRecordCount,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { dwrCount: 0, syncQueueCount: 0, totalKeys: 0 };
  }
};

export default {
  // Generic
  generateLocalId,
  getDeviceId,
  
  // Checkout
  saveCheckoutMetadata,
  getCheckoutMetadata,
  clearCheckoutMetadata,
  isCheckedOut,
  
  // Projects
  saveProject,
  getProject,
  getAllProjects,
  
  // Subprojects
  saveSubproject,
  getSubproject,
  getAllSubprojects,
  getSubprojectsByRig,
  getSubprojectsByProject,
  
  // DWRs
  saveCheckedOutDWRIds,
  getCheckedOutDWRIds,
  saveDWR,
  getDWR,
  getAllDWRs,
  updateDWR,
  deleteDWR,
  
  // Work Assignments
  saveWorkAssignment,
  getWorkAssignment,
  deleteWorkAssignment,
  
  // Time Records
  saveTimeRecord,
  getTimeRecord,
  deleteTimeRecord,
  
  // Charge Records
  saveChargeRecord,
  getChargeRecord,
  
  // Sync Queue
  getSyncQueue,
  saveSyncQueue,
  addToSyncQueue,
  removeFromSyncQueue,
  updateSyncOperationStatus,
  getPendingSyncCount,
  clearCompletedSyncOperations,
  
  // Reference Data
  saveReferenceData,
  getReferenceData,
  
  // Utilities
  clearAllOfflineData,
  getStorageStats,
};
