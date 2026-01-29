# Offline Mode Implementation Guide

## Overview

This document provides detailed technical specifications for implementing the offline mode feature in the TAV2 Mobile app. The offline mode allows Crew Supervisors to "check out" active and queued records associated with their assigned rig, edit them locally, and "check in" changes when returning online.

## Core Concepts

### Record States

1. **Online (Normal)**: Record exists only on server, editable by any authorized user
2. **Checked Out**: Record is locked for editing by a specific user/device, downloaded locally
3. **Offline Edits**: Local changes queued for sync
4. **Syncing**: Changes being uploaded to server
5. **Checked In**: Record unlocked, all changes synced

### Checkout Scope

When a Crew Supervisor enables offline mode:
- **Projects**: All projects associated with checked-out subprojects
- **Subprojects**: All subprojects assigned to the rig
- **Active Records**: Daily Work Records (DWRs) with status `in_progress`, `in_review`
- **Queued Records**: DWRs with status `pending`, `draft`
- **Associated Data**: 
  - Work Assignments for those DWRs
  - Employee Time Records
  - Equipment Assignments
  - Charge Records (Inventory, Service, Miscellaneous)

## Architecture

### Components

```
┌─────────────────────────────────────────┐
│      Offline Mode Manager               │
│  - Checkout Service                    │
│  - Checkin Service                     │
│  - Sync Service                        │
│  - Conflict Resolver                   │
└─────────────────────────────────────────┘
           │              │
           ▼              ▼
┌──────────────────┐  ┌──────────────────┐
│  SQLite Database │  │  Sync Queue     │
│  - projects      │  │  (Pending Ops)  │
│  - subprojects   │  └──────────────────┘
│  - dwrs          │         │
│  - time_records  │         │
│  - charges       │         │
└──────────────────┘         │
           │                 │
           └──────┬──────────┘
                  ▼
         ┌─────────────────┐
         │  Backend API    │
         │  (pnae-django)  │
         └─────────────────┘
```

## Backend API Requirements

### Checkout Endpoint

**POST `/api/workrecords/checkout/`**

Request:
```json
{
  "rig_id": 123,
  "statuses": ["in_progress", "in_review", "pending", "draft"],
  "device_id": "unique-device-id"
}
```

Response:
```json
{
  "checkout_id": "uuid",
  "checked_out_at": "2025-01-27T10:00:00Z",
  "rig_id": 123,
  "records": [
    {
      "id": 456,
      "type": "daily_work_record",
      "data": { /* full DWR object */ }
    },
    {
      "id": 789,
      "type": "work_assignment",
      "data": { /* full WorkAssignment object */ }
    }
    // ... all related records
  ],
  "expires_at": "2025-01-28T10:00:00Z"
}
```

**Backend Behavior:**
1. Mark all matching records as "checked out"
2. Store checkout metadata (user, device, timestamp)
3. Return all records with full related data
4. Prevent other users/devices from editing checked-out records

### Checkin Endpoint

**POST `/api/workrecords/checkin/`**

Request:
```json
{
  "checkout_id": "uuid",
  "changes": [
    {
      "type": "update",
      "entity": "daily_work_record",
      "id": 456,
      "data": { /* updated fields */ }
    },
    {
      "type": "create",
      "entity": "work_assignment",
      "data": { /* new record */ }
    }
  ],
  "conflicts": [] // if any
}
```

Response:
```json
{
  "checkin_id": "uuid",
  "synced_at": "2025-01-27T15:00:00Z",
  "results": [
    {
      "entity": "daily_work_record",
      "id": 456,
      "status": "success",
      "server_id": 456
    },
    {
      "entity": "work_assignment",
      "id": "local-123",
      "status": "success",
      "server_id": 789
    }
  ],
  "conflicts": []
}
```

**Backend Behavior:**
1. Validate checkout is still valid
2. Apply changes (with conflict detection)
3. Unlock records
4. Return sync results

### Conflict Detection

**GET `/api/workrecords/checkout/{checkout_id}/conflicts/`**

Returns any conflicts detected:
```json
{
  "conflicts": [
    {
      "entity": "daily_work_record",
      "id": 456,
      "local_version": { /* local data */ },
      "server_version": { /* server data */ },
      "conflict_fields": ["notes", "status"],
      "resolution_strategy": "manual" // or "last_write_wins"
    }
  ]
}
```

## Local Storage Schema (SQLite)

### Database Tables

The offline data is stored in a local SQLite database (`TAV2Offline.db`) with the following tables:

#### Core Tables

```sql
-- Schema version tracking for migrations
CREATE TABLE schema_version (
  id INTEGER PRIMARY KEY,
  version INTEGER NOT NULL,
  applied_at TEXT NOT NULL
);

-- Checkout metadata
CREATE TABLE checkout_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  checkout_id TEXT NOT NULL UNIQUE,
  rig_id INTEGER NOT NULL,
  rig_name TEXT,
  user_id INTEGER NOT NULL,
  username TEXT,
  device_id TEXT NOT NULL,
  checked_out_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  record_count INTEGER NOT NULL DEFAULT 0,
  last_sync_at INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  customer_id INTEGER,
  customer_name TEXT,
  status TEXT DEFAULT 'active',
  start_date TEXT,
  end_date TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Subprojects (linked to Projects)
CREATE TABLE subprojects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id INTEGER NOT NULL UNIQUE,
  project_id INTEGER,
  name TEXT NOT NULL,
  job_number TEXT,
  description TEXT,
  assigned_rig_id INTEGER,
  assigned_rig_name TEXT,
  assigned_rig_number TEXT,
  well_id INTEGER,
  well_name TEXT,
  well_api_number TEXT,
  customer_id INTEGER,
  customer_name TEXT,
  status TEXT DEFAULT 'active',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(server_id)
);

-- Daily Work Records
CREATE TABLE dwrs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id TEXT NOT NULL UNIQUE,
  server_id INTEGER,
  subproject_id INTEGER NOT NULL,
  subproject_data TEXT,  -- JSON for related subproject info
  date TEXT NOT NULL,
  ticket_number TEXT,
  notes TEXT,
  contact_id INTEGER,
  contact_data TEXT,  -- JSON for contact info
  is_last_day INTEGER DEFAULT 0,
  is_locked INTEGER DEFAULT 0,
  lock_date TEXT,
  is_approved INTEGER DEFAULT 0,
  approved_at TEXT,
  approved_by INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  is_checked_out INTEGER DEFAULT 1,
  has_local_changes INTEGER DEFAULT 0,
  created_locally INTEGER DEFAULT 0,
  last_synced_at INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Work Assignments (linked to DWRs)
CREATE TABLE work_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id TEXT NOT NULL UNIQUE,
  server_id INTEGER,
  dwr_local_id TEXT NOT NULL,
  work_description_id INTEGER,
  work_description_data TEXT,  -- JSON
  description TEXT NOT NULL,
  from_time TEXT,
  to_time TEXT,
  input_values TEXT,  -- JSON
  is_legacy INTEGER DEFAULT 0,
  has_local_changes INTEGER DEFAULT 0,
  created_locally INTEGER DEFAULT 0,
  deleted_locally INTEGER DEFAULT 0,
  FOREIGN KEY (dwr_local_id) REFERENCES dwrs(local_id) ON DELETE CASCADE
);

-- Time Records
CREATE TABLE time_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id TEXT NOT NULL UNIQUE,
  server_id INTEGER,
  dwr_local_id TEXT NOT NULL,
  employee_id INTEGER NOT NULL,
  employee_data TEXT,  -- JSON
  start_time TEXT,
  stop_time TEXT,
  rig_time TEXT,
  travel_time TEXT,
  role_id INTEGER,
  role_data TEXT,  -- JSON
  has_local_changes INTEGER DEFAULT 0,
  created_locally INTEGER DEFAULT 0,
  deleted_locally INTEGER DEFAULT 0,
  FOREIGN KEY (dwr_local_id) REFERENCES dwrs(local_id) ON DELETE CASCADE
);

-- Charge Records (one per DWR)
CREATE TABLE charge_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id TEXT NOT NULL UNIQUE,
  server_id INTEGER,
  dwr_local_id TEXT NOT NULL,
  total_amount REAL DEFAULT 0,
  is_manual_total INTEGER DEFAULT 0,
  has_local_changes INTEGER DEFAULT 0,
  FOREIGN KEY (dwr_local_id) REFERENCES dwrs(local_id) ON DELETE CASCADE
);

-- Charge items (inventory, service, miscellaneous)
CREATE TABLE inventory_charges (...);
CREATE TABLE service_charges (...);
CREATE TABLE miscellaneous_charges (...);

-- Sync queue for pending operations
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,  -- 'create', 'update', 'delete'
  entity TEXT NOT NULL,
  local_id TEXT NOT NULL,
  server_id INTEGER,
  dwr_local_id TEXT,
  data TEXT NOT NULL,  -- JSON
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  synced_at INTEGER
);

-- Reference data cache
CREATE TABLE reference_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL,  -- JSON
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes for Performance

```sql
-- Project/Subproject indexes
CREATE INDEX idx_projects_server_id ON projects(server_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_subprojects_server_id ON subprojects(server_id);
CREATE INDEX idx_subprojects_project_id ON subprojects(project_id);
CREATE INDEX idx_subprojects_rig_id ON subprojects(assigned_rig_id);
CREATE INDEX idx_subprojects_status ON subprojects(status);

-- DWR and record indexes
CREATE INDEX idx_dwrs_server_id ON dwrs(server_id);
CREATE INDEX idx_dwrs_status ON dwrs(status);
CREATE INDEX idx_dwrs_subproject_id ON dwrs(subproject_id);
CREATE INDEX idx_work_assignments_dwr ON work_assignments(dwr_local_id);
CREATE INDEX idx_time_records_dwr ON time_records(dwr_local_id);
CREATE INDEX idx_charge_records_dwr ON charge_records(dwr_local_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity, local_id);
```

### TypeScript Interfaces

```typescript
// All interfaces defined in src/types/offline.types.ts
// Key interfaces: OfflineDWR, OfflineWorkAssignment, OfflineEmployeeTimeRecord, 
// OfflineChargeRecord, SyncOperation, CheckoutMetadata
```

## Implementation Details

### 1. Checkout Service

```typescript
// services/offline/CheckoutService.ts

class CheckoutService {
  async checkoutRecords(rigId: number): Promise<CheckoutResult> {
    // 1. Call backend checkout endpoint
    const response = await api.post('/api/workrecords/checkout/', {
      rig_id: rigId,
      statuses: ['in_progress', 'in_review', 'pending', 'draft'],
      device_id: await getDeviceId(),
    });

    // 2. Store checkout metadata in AsyncStorage
    const metadata: CheckoutMetadata = {
      checkout_id: response.data.checkout_id,
      rig_id: rigId,
      checked_out_at: Date.now(),
      expires_at: new Date(response.data.expires_at).getTime(),
      device_id: await getDeviceId(),
      is_active: true,
    };
    await AsyncStorage.setItem('checkout:metadata', JSON.stringify(metadata));

    // 3. Store records in AsyncStorage
    const dwrIds: number[] = [];
    for (const record of response.data.records) {
      switch (record.type) {
        case 'daily_work_record':
          await AsyncStorage.setItem(
            `checkout:dwr:${record.id}`,
            JSON.stringify({ ...record.data, has_local_changes: false })
          );
          dwrIds.push(record.id);
          break;
        case 'work_assignment':
          await AsyncStorage.setItem(
            `checkout:work_assignment:${record.id}`,
            JSON.stringify({ ...record.data, has_local_changes: false })
          );
          break;
        // ... other types
      }
    }
    
    // Store list of DWR IDs
    await AsyncStorage.setItem('checkout:dwrs', JSON.stringify(dwrIds));

    return {
      checkoutId: response.data.checkout_id,
      recordCount: response.data.records.length,
    };
  }

  async isCheckedOut(): Promise<boolean> {
    const metadataStr = await AsyncStorage.getItem('checkout:metadata');
    if (!metadataStr) return false;
    
    const metadata: CheckoutMetadata = JSON.parse(metadataStr);
    return metadata.is_active && metadata.expires_at > Date.now();
  }
}
```

### 2. Checkin Service

```typescript
// services/offline/CheckinService.ts

class CheckinService {
  async checkinRecords(): Promise<CheckinResult> {
    // 1. Get checkout metadata from AsyncStorage
    const metadataStr = await AsyncStorage.getItem('checkout:metadata');
    if (!metadataStr) {
      throw new Error('No active checkout');
    }
    const checkout: CheckoutMetadata = JSON.parse(metadataStr);

    // 2. Collect all local changes from AsyncStorage
    const changes = await this.collectLocalChanges();

    // 3. Check for conflicts
    const conflicts = await this.detectConflicts(checkout.checkout_id);

    // 4. If conflicts exist, resolve or prompt user
    if (conflicts.length > 0) {
      const resolved = await this.resolveConflicts(conflicts);
      changes.push(...resolved);
    }

    // 5. Sync changes to backend
    const result = await api.post('/api/workrecords/checkin/', {
      checkout_id: checkout.checkout_id,
      changes: changes,
      conflicts: [],
    });

    // 6. Update local records with server IDs
    await this.updateLocalRecords(result.data.results);

    // 7. Clear checkout data from AsyncStorage
    await this.clearCheckout(checkout.checkout_id);

    return {
      success: true,
      syncedCount: result.data.results.length,
    };
  }

  private async collectLocalChanges(): Promise<SyncChange[]> {
    const changes: SyncChange[] = [];

    // Get list of DWR IDs
    const dwrIdsStr = await AsyncStorage.getItem('checkout:dwrs');
    if (!dwrIdsStr) return changes;
    
    const dwrIds: number[] = JSON.parse(dwrIdsStr);

    // Check each DWR for local changes
    for (const dwrId of dwrIds) {
      const dwrStr = await AsyncStorage.getItem(`checkout:dwr:${dwrId}`);
      if (!dwrStr) continue;
      
      const dwr: DailyWorkRecord = JSON.parse(dwrStr);
      
      if (dwr.has_local_changes) {
        if (dwr.server_id) {
          // Update existing
          changes.push({
            type: 'update',
            entity: 'daily_work_record',
            id: dwr.server_id,
            data: dwr,
          });
        } else {
          // Create new
          changes.push({
            type: 'create',
            entity: 'daily_work_record',
            data: dwr,
          });
        }
      }
    }

    // ... collect other entity changes (work assignments, etc.)

    return changes;
  }
}
```

### 3. Sync Service

```typescript
// services/offline/SyncService.ts

class SyncService {
  async syncPendingOperations(): Promise<void> {
    // Get sync queue from AsyncStorage
    const queueStr = await AsyncStorage.getItem('sync:queue');
    if (!queueStr) return;
    
    const queue: SyncOperation[] = JSON.parse(queueStr);
    const pendingOps = queue.filter(
      op => op.status === 'pending' || op.status === 'failed'
    ).sort((a, b) => a.created_at - b.created_at);

    const updatedQueue: SyncOperation[] = [];

    for (const op of pendingOps) {
      try {
        // Mark as syncing
        op.status = 'syncing';
        await this.syncOperation(op);
        op.status = 'success';
      } catch (error) {
        op.status = 'failed';
        op.error = error instanceof Error ? error.message : 'Unknown error';
        op.retry_count += 1;
      }
      updatedQueue.push(op);
    }

    // Update sync queue
    const remainingOps = queue.filter(op => op.status !== 'syncing' && op.status !== 'success');
    await AsyncStorage.setItem('sync:queue', JSON.stringify([...remainingOps, ...updatedQueue]));
  }

  private async syncOperation(op: SyncOperation): Promise<void> {
    // Perform sync based on type
    switch (op.type) {
      case 'create':
        await api.post(`/api/${op.entity}/`, op.data);
        break;
      case 'update':
        await api.patch(`/api/${op.entity}/${op.entity_id}/`, op.data);
        break;
      case 'delete':
        await api.delete(`/api/${op.entity}/${op.entity_id}/`);
        break;
    }
  }
}
```

### 4. Conflict Resolution

```typescript
// services/offline/ConflictResolver.ts

class ConflictResolver {
  async detectConflicts(checkoutId: string): Promise<Conflict[]> {
    const response = await api.get(`/api/workrecords/checkout/${checkoutId}/conflicts/`);
    return response.data.conflicts;
  }

  async resolveConflicts(conflicts: Conflict[]): Promise<SyncChange[]> {
    const resolved: SyncChange[] = [];

    for (const conflict of conflicts) {
      if (conflict.resolution_strategy === 'last_write_wins') {
        // Use local version
        resolved.push({
          type: 'update',
          entity: conflict.entity,
          id: conflict.id,
          data: conflict.local_version,
        });
      } else {
        // Manual resolution - show UI to user
        const resolution = await this.promptUserForResolution(conflict);
        resolved.push(resolution);
      }
    }

    return resolved;
  }

  private async promptUserForResolution(conflict: Conflict): Promise<SyncChange> {
    // Show conflict resolution UI
    // Return user's choice
    return new Promise((resolve) => {
      // Implementation depends on UI framework
    });
  }
}
```

## UI Components

### UI Placement Strategy

**Important**: The offline mode toggle should be **readily accessible in the main app header**, not buried in settings or profile pages. This ensures field users can quickly enable/disable offline mode without navigation.

**Header Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Dashboard Title     [Sync Status] [Offline Toggle] │
└─────────────────────────────────────────────────────────────┘
```

The header should display:
- **Sync Status Indicator**: Shows online/offline, pending sync count
- **Offline Mode Toggle**: Quick switch with visual feedback
- **Network Status**: WiFi/cellular indicator when relevant

### Offline Mode Toggle (Header Component)

```typescript
// components/offline/OfflineModeToggle.tsx
// NOTE: This component lives in the main AppHeader, NOT in settings

const OfflineModeToggle: React.FC = () => {
  const { isOfflineMode, toggleOfflineMode } = useOfflineMode();
  const { checkedOutCount } = useCheckoutStatus();

  return (
    <View style={styles.container}>
      <Switch
        value={isOfflineMode}
        onValueChange={toggleOfflineMode}
      />
      <Text>Offline Mode</Text>
      {isOfflineMode && (
        <Text>{checkedOutCount} records checked out</Text>
      )}
    </View>
  );
};
```

### Sync Status Indicator

```typescript
// components/SyncStatusIndicator.tsx

const SyncStatusIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, lastSyncTime } = useSyncStatus();

  return (
    <View style={styles.container}>
      <Icon name={isOnline ? 'wifi' : 'wifi-off'} />
      {isSyncing && <ActivityIndicator />}
      {pendingCount > 0 && (
        <Badge>{pendingCount} pending</Badge>
      )}
    </View>
  );
};
```

## State Management

### Offline Mode Context (React Context API)

```typescript
// context/OfflineContext.tsx

interface OfflineState {
  isOfflineMode: boolean;
  checkoutId: string | null;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncTime: number | null;
}

interface OfflineContextType extends OfflineState {
  enableOfflineMode: () => Promise<void>;
  disableOfflineMode: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OfflineState>({
    isOfflineMode: false,
    checkoutId: null,
    isSyncing: false,
    pendingSyncCount: 0,
    lastSyncTime: null,
  });

  const enableOfflineMode = async () => {
    const checkoutService = new CheckoutService();
    const user = await getCurrentUser();
    const rigId = user.assignedRigId;

    const result = await checkoutService.checkoutRecords(rigId);
    
    setState(prev => ({
      ...prev,
      isOfflineMode: true,
      checkoutId: result.checkoutId,
    }));
  };

  const disableOfflineMode = async () => {
    const checkinService = new CheckinService();
    await checkinService.checkinRecords();
    
    setState(prev => ({
      ...prev,
      isOfflineMode: false,
      checkoutId: null,
    }));
  };

  const syncNow = async () => {
    setState(prev => ({ ...prev, isSyncing: true }));
    const syncService = new SyncService();
    await syncService.syncPendingOperations();
    setState(prev => ({
      ...prev,
      isSyncing: false,
      lastSyncTime: Date.now(),
    }));
  };

  return (
    <OfflineContext.Provider value={{ ...state, enableOfflineMode, disableOfflineMode, syncNow }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};
```

## Error Handling

### Error Scenarios

1. **Checkout Fails**
   - Network error: Retry with exponential backoff
   - Server error: Show error message, allow retry
   - Records already checked out: Show conflict message

2. **Checkin Fails**
   - Network error: Queue for retry, keep records checked out
   - Conflict detected: Show resolution UI
   - Server validation error: Show field-level errors

3. **Sync Fails**
   - Individual operation fails: Mark for retry
   - Multiple failures: Show summary, allow manual retry

## Testing Strategy

### Unit Tests

- Checkout service
- Checkin service
- Sync service
- Conflict resolver
- Database operations

### Integration Tests

- Full checkout flow
- Full checkin flow
- Conflict resolution
- Network failure scenarios

### E2E Tests

- Enable offline mode
- Edit records offline
- Disable offline mode
- Verify sync

## Performance Considerations

1. **Batch Operations**: Batch database writes
2. **Lazy Loading**: Load related data on demand
3. **Indexing**: Index frequently queried fields
4. **Compression**: Compress data before storage
5. **Background Sync**: Sync in background when online

## Security Considerations

1. **Encrypt Local Database**: Use encrypted storage
2. **Secure Token Storage**: Use secure keychain/keystore
3. **Validate Data**: Validate all local data before sync
4. **Expire Checkouts**: Auto-expire old checkouts
5. **Device Binding**: Bind checkout to device ID

## Monitoring & Logging

1. **Sync Metrics**: Track sync success/failure rates
2. **Conflict Metrics**: Track conflict frequency
3. **Performance Metrics**: Track sync duration
4. **Error Logging**: Log all errors for debugging

---

## Implementation Checklist

### Backend (pnae-django)
- [ ] Create checkout endpoint (`POST /api/workrecords/checkout/`)
- [ ] Create checkin endpoint (`POST /api/workrecords/checkin/`)
- [ ] Implement checkout locking mechanism
- [ ] Implement conflict detection
- [ ] Add checkout expiration
- [ ] Add checkout metadata model

### Mobile App
- [x] Set up SQLite database (`react-native-sqlite-storage`)
- [x] Create database schema with tables and indexes
- [x] Implement database initialization and migrations
- [x] Create TypeScript interfaces for data models
- [x] Implement storage service (using SQLite)
- [x] Implement checkout service
- [x] Implement checkin service
- [x] Implement sync service with retry logic
- [x] Create NetworkContext for connectivity monitoring
- [x] Create OfflineContext for state management
- [x] Create OfflineModeToggle component
- [x] Create NetworkStatusBar component
- [x] Create SyncStatusIndicator component
- [ ] Implement conflict resolver UI
- [x] Add error handling
- [ ] Add logging/monitoring (Sentry integration)
- [ ] Write unit tests for offline services

---

*This document should be updated as implementation progresses.*

