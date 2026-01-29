/**
 * Offline Mode Types
 * Types for offline storage, sync operations, and checkout/checkin
 */

// ===============================
// DWR Related Types (Offline)
// ===============================

export interface OfflineEmployee {
  id: number;
  first_name: string;
  last_name: string;
  formatted_name?: string;
  email?: string;
  phone?: string | null;
  is_active: boolean;
}

export interface OfflineEmployeeType {
  id: number;
  name: string;
  description?: string;
}

export interface OfflineWorkDescription {
  id: number;
  template_text: string;
  input_fields_count: number;
  group_id?: number;
}

export interface OfflineWorkAssignment {
  id?: number;
  local_id: string; // UUID for local records
  server_id?: number;
  dwr_id: number | string;
  work_description_id?: number;
  work_description?: OfflineWorkDescription;
  description: string;
  from_time: string;
  to_time: string | null;
  input_values: Record<string, unknown>;
  is_legacy: boolean;
  has_local_changes: boolean;
  created_locally: boolean;
  deleted_locally: boolean;
}

export interface OfflineEmployeeTimeRecord {
  id?: number;
  local_id: string;
  server_id?: number;
  employee_id: number;
  employee?: OfflineEmployee;
  dwr_id: number | string;
  start_time: string | null;
  stop_time: string | null;
  rig_time: string | null;
  travel_time: string | null;
  role_id: number;
  role?: OfflineEmployeeType;
  has_local_changes: boolean;
  created_locally: boolean;
  deleted_locally: boolean;
}

export interface OfflineBaseCharge {
  id?: number;
  local_id: string;
  server_id?: number;
  charge_record_id: number;
  quantity_used: number;
  price_at_use: number;
  is_billable: boolean;
  off_turnkey: boolean;
  total?: number;
  has_local_changes: boolean;
  created_locally: boolean;
  deleted_locally: boolean;
}

export interface OfflineInventoryCharge extends OfflineBaseCharge {
  inventory_item_id: number;
  item_name?: string;
  unit_name?: string;
  unit_abbreviation?: string;
}

export interface OfflineServiceCharge extends OfflineBaseCharge {
  service_item_id: number;
  item_name?: string;
  unit_name?: string;
  unit_abbreviation?: string;
}

export interface OfflineMiscellaneousCharge extends OfflineBaseCharge {
  miscellaneous_item_id: number;
  custom_name: string;
  unit_name?: string;
  unit_abbreviation?: string;
}

export interface OfflineChargeRecord {
  id?: number;
  local_id: string;
  server_id?: number;
  dwr_id: number | string;
  inventory_charges: OfflineInventoryCharge[];
  service_charges: OfflineServiceCharge[];
  miscellaneous_charges: OfflineMiscellaneousCharge[];
  total_amount: number;
  is_manual_total: boolean;
  has_local_changes: boolean;
}

export interface OfflineProject {
  id?: number;
  server_id: number;
  name: string;
  description?: string;
  customer_id?: number;
  customer_name?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  // For offline storage
  subprojects?: OfflineSubproject[];
}

export interface OfflineSubproject {
  id?: number;
  server_id: number;
  project_id?: number;
  project?: OfflineProject;
  name: string;
  job_number?: string;
  description?: string;
  assigned_rig_id?: number;
  assigned_rig_name?: string;
  assigned_rig_number?: string;
  assigned_rig?: {
    id: number;
    name: string;
    rig_number?: string;
  };
  well_id?: number;
  well_name?: string;
  well_api_number?: string;
  well?: {
    id: number;
    name: string;
    customer?: {
      id: number;
      name: string;
    };
    api_number?: string;
  };
  customer_id?: number;
  customer_name?: string;
  status: string;
  is_active: boolean;
}

export interface OfflineContact {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

export type DWRStatus = 
  | 'draft' 
  | 'pending' 
  | 'in_progress' 
  | 'in_review' 
  | 'approved' 
  | 'rejected'
  | 'completed';

export interface OfflineDWR {
  id?: number;
  local_id: string;
  server_id?: number;
  subproject_id: number;
  subproject?: OfflineSubproject;
  date: string;
  ticket_number: string;
  notes: string;
  contact_id?: number | null;
  contact?: OfflineContact | null;
  is_last_day: boolean;
  is_locked: boolean;
  lock_date: string | null;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: number | null;
  status: DWRStatus;
  // Offline metadata
  is_checked_out: boolean;
  has_local_changes: boolean;
  created_locally: boolean;
  last_synced_at: number | null;
  // Related data
  work_assignments?: OfflineWorkAssignment[];
  time_records?: OfflineEmployeeTimeRecord[];
  charge_record?: OfflineChargeRecord;
}

// ===============================
// Sync Queue Types
// ===============================

export type SyncOperationType = 'create' | 'update' | 'delete';

export type SyncEntityType = 
  | 'daily_work_record'
  | 'work_assignment'
  | 'employee_time_record'
  | 'inventory_charge'
  | 'service_charge'
  | 'miscellaneous_charge'
  | 'charge_record';

export type SyncOperationStatus = 
  | 'pending' 
  | 'syncing' 
  | 'success' 
  | 'failed' 
  | 'conflict';

export interface SyncOperation {
  id: string; // UUID
  type: SyncOperationType;
  entity: SyncEntityType;
  local_id: string;
  server_id?: number;
  dwr_local_id?: string; // Parent DWR reference
  data: Record<string, unknown>;
  status: SyncOperationStatus;
  retry_count: number;
  max_retries: number;
  error?: string;
  created_at: number; // Timestamp
  updated_at: number;
  synced_at?: number;
}

// ===============================
// Checkout/Checkin Types
// ===============================

export interface CheckoutMetadata {
  checkout_id: string;
  rig_id: number;
  rig_name?: string;
  user_id: number;
  username?: string;
  device_id: string;
  checked_out_at: number; // Timestamp
  expires_at: number; // Timestamp
  is_active: boolean;
  record_count: number;
  last_sync_at?: number;
}

export interface CheckoutRequest {
  rig_id: number;
  statuses: DWRStatus[];
  device_id: string;
}

export interface CheckoutResponse {
  checkout_id: string;
  checked_out_at: string;
  expires_at: string;
  rig_id: number;
  records: CheckoutRecord[];
}

export interface CheckoutRecord {
  id: number;
  type: SyncEntityType;
  data: Record<string, unknown>;
}

export interface CheckinRequest {
  checkout_id: string;
  changes: SyncChange[];
  device_id: string;
}

export interface SyncChange {
  type: SyncOperationType;
  entity: SyncEntityType;
  local_id: string;
  server_id?: number;
  data: Record<string, unknown>;
}

export interface CheckinResult {
  entity: SyncEntityType;
  local_id: string;
  server_id?: number;
  status: 'success' | 'conflict' | 'error';
  error?: string;
}

export interface CheckinResponse {
  checkin_id: string;
  synced_at: string;
  results: CheckinResult[];
  conflicts: SyncConflict[];
}

// ===============================
// Conflict Resolution Types
// ===============================

export type ConflictResolutionStrategy = 
  | 'local_wins' 
  | 'server_wins' 
  | 'merge' 
  | 'manual';

export interface SyncConflict {
  entity: SyncEntityType;
  id: number;
  local_id: string;
  local_version: Record<string, unknown>;
  server_version: Record<string, unknown>;
  conflict_fields: string[];
  resolution_strategy: ConflictResolutionStrategy;
  resolved?: boolean;
  resolution?: Record<string, unknown>;
}

// ===============================
// Storage Keys
// ===============================

export const STORAGE_KEYS = {
  // Checkout metadata
  CHECKOUT_METADATA: 'offline:checkout:metadata',
  
  // DWR list (array of local IDs)
  CHECKED_OUT_DWRS: 'offline:checkout:dwrs',
  
  // Individual records (prefixed with local ID)
  DWR: (localId: string) => `offline:dwr:${localId}`,
  WORK_ASSIGNMENT: (localId: string) => `offline:work_assignment:${localId}`,
  TIME_RECORD: (localId: string) => `offline:time_record:${localId}`,
  CHARGE_RECORD: (localId: string) => `offline:charge_record:${localId}`,
  
  // Sync queue
  SYNC_QUEUE: 'offline:sync:queue',
  
  // Reference data (cached for offline use)
  EMPLOYEES: 'offline:ref:employees',
  EMPLOYEE_TYPES: 'offline:ref:employee_types',
  WORK_DESCRIPTIONS: 'offline:ref:work_descriptions',
  INVENTORY_ITEMS: 'offline:ref:inventory_items',
  SERVICE_ITEMS: 'offline:ref:service_items',
  
  // Network status
  LAST_ONLINE: 'offline:network:last_online',
  
  // Device ID
  DEVICE_ID: 'offline:device_id',
} as const;

// ===============================
// Offline State Types
// ===============================

export interface OfflineState {
  isOfflineMode: boolean;
  isCheckingOut: boolean;
  isCheckingIn: boolean;
  isSyncing: boolean;
  checkoutMetadata: CheckoutMetadata | null;
  pendingSyncCount: number;
  lastSyncTime: number | null;
  syncErrors: string[];
}

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  lastChecked: number;
}

// ===============================
// Utility Types
// ===============================

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

export type OfflineEventType = 
  | 'checkout_start'
  | 'checkout_complete'
  | 'checkout_error'
  | 'checkin_start'
  | 'checkin_complete'
  | 'checkin_error'
  | 'sync_start'
  | 'sync_progress'
  | 'sync_complete'
  | 'sync_error'
  | 'conflict_detected'
  | 'network_change';

export interface OfflineEvent {
  type: OfflineEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}
