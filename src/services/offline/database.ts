/**
 * SQLite Database Service
 * Handles database initialization, schema, and migrations
 */

import SQLite, {
  SQLiteDatabase,
  ResultSet,
  Transaction,
} from 'react-native-sqlite-storage';

// Enable promise-based API
SQLite.enablePromise(true);

// Database configuration
const DATABASE_NAME = 'TAV2Offline.db';
const DATABASE_VERSION = 1;

// Singleton database instance
let dbInstance: SQLiteDatabase | null = null;

// ===============================
// Database Schema
// ===============================

const SCHEMA_VERSION_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_version (
    id INTEGER PRIMARY KEY,
    version INTEGER NOT NULL,
    applied_at TEXT NOT NULL
  );
`;

const CHECKOUT_METADATA_TABLE = `
  CREATE TABLE IF NOT EXISTS checkout_metadata (
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
`;

const PROJECT_TABLE = `
  CREATE TABLE IF NOT EXISTS projects (
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
`;

const SUBPROJECT_TABLE = `
  CREATE TABLE IF NOT EXISTS subprojects (
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
`;

const DWR_TABLE = `
  CREATE TABLE IF NOT EXISTS dwrs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_id TEXT NOT NULL UNIQUE,
    server_id INTEGER,
    subproject_id INTEGER NOT NULL,
    subproject_data TEXT,
    date TEXT NOT NULL,
    ticket_number TEXT,
    notes TEXT,
    contact_id INTEGER,
    contact_data TEXT,
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
`;

const WORK_ASSIGNMENT_TABLE = `
  CREATE TABLE IF NOT EXISTS work_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_id TEXT NOT NULL UNIQUE,
    server_id INTEGER,
    dwr_local_id TEXT NOT NULL,
    work_description_id INTEGER,
    work_description_data TEXT,
    description TEXT NOT NULL,
    from_time TEXT,
    to_time TEXT,
    input_values TEXT,
    is_legacy INTEGER DEFAULT 0,
    has_local_changes INTEGER DEFAULT 0,
    created_locally INTEGER DEFAULT 0,
    deleted_locally INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dwr_local_id) REFERENCES dwrs(local_id) ON DELETE CASCADE
  );
`;

const TIME_RECORD_TABLE = `
  CREATE TABLE IF NOT EXISTS time_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_id TEXT NOT NULL UNIQUE,
    server_id INTEGER,
    dwr_local_id TEXT NOT NULL,
    employee_id INTEGER NOT NULL,
    employee_data TEXT,
    start_time TEXT,
    stop_time TEXT,
    rig_time TEXT,
    travel_time TEXT,
    role_id INTEGER,
    role_data TEXT,
    has_local_changes INTEGER DEFAULT 0,
    created_locally INTEGER DEFAULT 0,
    deleted_locally INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dwr_local_id) REFERENCES dwrs(local_id) ON DELETE CASCADE
  );
`;

const CHARGE_RECORD_TABLE = `
  CREATE TABLE IF NOT EXISTS charge_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_id TEXT NOT NULL UNIQUE,
    server_id INTEGER,
    dwr_local_id TEXT NOT NULL,
    total_amount REAL DEFAULT 0,
    is_manual_total INTEGER DEFAULT 0,
    has_local_changes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dwr_local_id) REFERENCES dwrs(local_id) ON DELETE CASCADE
  );
`;

const INVENTORY_CHARGE_TABLE = `
  CREATE TABLE IF NOT EXISTS inventory_charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_id TEXT NOT NULL UNIQUE,
    server_id INTEGER,
    charge_record_local_id TEXT NOT NULL,
    inventory_item_id INTEGER NOT NULL,
    item_name TEXT,
    quantity_used REAL DEFAULT 0,
    price_at_use REAL DEFAULT 0,
    is_billable INTEGER DEFAULT 1,
    off_turnkey INTEGER DEFAULT 0,
    total REAL,
    unit_name TEXT,
    unit_abbreviation TEXT,
    has_local_changes INTEGER DEFAULT 0,
    created_locally INTEGER DEFAULT 0,
    deleted_locally INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (charge_record_local_id) REFERENCES charge_records(local_id) ON DELETE CASCADE
  );
`;

const SERVICE_CHARGE_TABLE = `
  CREATE TABLE IF NOT EXISTS service_charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_id TEXT NOT NULL UNIQUE,
    server_id INTEGER,
    charge_record_local_id TEXT NOT NULL,
    service_item_id INTEGER NOT NULL,
    item_name TEXT,
    quantity_used REAL DEFAULT 0,
    price_at_use REAL DEFAULT 0,
    is_billable INTEGER DEFAULT 1,
    off_turnkey INTEGER DEFAULT 0,
    total REAL,
    unit_name TEXT,
    unit_abbreviation TEXT,
    has_local_changes INTEGER DEFAULT 0,
    created_locally INTEGER DEFAULT 0,
    deleted_locally INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (charge_record_local_id) REFERENCES charge_records(local_id) ON DELETE CASCADE
  );
`;

const MISC_CHARGE_TABLE = `
  CREATE TABLE IF NOT EXISTS miscellaneous_charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_id TEXT NOT NULL UNIQUE,
    server_id INTEGER,
    charge_record_local_id TEXT NOT NULL,
    miscellaneous_item_id INTEGER NOT NULL,
    custom_name TEXT,
    quantity_used REAL DEFAULT 0,
    price_at_use REAL DEFAULT 0,
    is_billable INTEGER DEFAULT 1,
    off_turnkey INTEGER DEFAULT 0,
    total REAL,
    unit_name TEXT,
    unit_abbreviation TEXT,
    has_local_changes INTEGER DEFAULT 0,
    created_locally INTEGER DEFAULT 0,
    deleted_locally INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (charge_record_local_id) REFERENCES charge_records(local_id) ON DELETE CASCADE
  );
`;

const SYNC_QUEUE_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    entity TEXT NOT NULL,
    local_id TEXT NOT NULL,
    server_id INTEGER,
    dwr_local_id TEXT,
    data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    synced_at INTEGER
  );
`;

const REFERENCE_DATA_TABLE = `
  CREATE TABLE IF NOT EXISTS reference_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    data TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

// Create indexes for better query performance
const INDEXES = [
  // Project/Subproject indexes
  'CREATE INDEX IF NOT EXISTS idx_projects_server_id ON projects(server_id);',
  'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);',
  'CREATE INDEX IF NOT EXISTS idx_subprojects_server_id ON subprojects(server_id);',
  'CREATE INDEX IF NOT EXISTS idx_subprojects_project_id ON subprojects(project_id);',
  'CREATE INDEX IF NOT EXISTS idx_subprojects_rig_id ON subprojects(assigned_rig_id);',
  'CREATE INDEX IF NOT EXISTS idx_subprojects_status ON subprojects(status);',
  // DWR indexes
  'CREATE INDEX IF NOT EXISTS idx_dwrs_server_id ON dwrs(server_id);',
  'CREATE INDEX IF NOT EXISTS idx_dwrs_status ON dwrs(status);',
  'CREATE INDEX IF NOT EXISTS idx_dwrs_subproject_id ON dwrs(subproject_id);',
  'CREATE INDEX IF NOT EXISTS idx_work_assignments_dwr ON work_assignments(dwr_local_id);',
  'CREATE INDEX IF NOT EXISTS idx_time_records_dwr ON time_records(dwr_local_id);',
  'CREATE INDEX IF NOT EXISTS idx_charge_records_dwr ON charge_records(dwr_local_id);',
  'CREATE INDEX IF NOT EXISTS idx_inventory_charges_cr ON inventory_charges(charge_record_local_id);',
  'CREATE INDEX IF NOT EXISTS idx_service_charges_cr ON service_charges(charge_record_local_id);',
  'CREATE INDEX IF NOT EXISTS idx_misc_charges_cr ON miscellaneous_charges(charge_record_local_id);',
  'CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);',
  'CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity, local_id);',
];

// ===============================
// Database Functions
// ===============================

/**
 * Open or create the database
 */
export const openDatabase = async (): Promise<SQLiteDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await SQLite.openDatabase({
      name: DATABASE_NAME,
      location: 'default',
    });

    console.log('Database opened successfully');
    return dbInstance;
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
};

/**
 * Get the database instance (throws if not initialized)
 */
export const getDatabase = (): SQLiteDatabase => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
};

/**
 * Close the database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    console.log('Database closed');
  }
};

/**
 * Execute a SQL statement
 */
export const executeSql = async (
  sql: string,
  params: (string | number | null)[] = []
): Promise<ResultSet> => {
  const db = getDatabase();
  const [result] = await db.executeSql(sql, params);
  return result;
};

/**
 * Execute multiple SQL statements in a transaction
 */
export const executeTransaction = async (
  statements: { sql: string; params?: (string | number | null)[] }[]
): Promise<void> => {
  const db = getDatabase();
  
  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx: Transaction) => {
        for (const stmt of statements) {
          tx.executeSql(stmt.sql, stmt.params || []);
        }
      },
      (error) => {
        console.error('Transaction error:', error);
        reject(error);
      },
      () => {
        resolve();
      }
    );
  });
};

/**
 * Initialize the database schema
 */
export const initializeSchema = async (): Promise<void> => {
  const db = await openDatabase();

  // Create all tables
  const tables = [
    SCHEMA_VERSION_TABLE,
    CHECKOUT_METADATA_TABLE,
    PROJECT_TABLE,
    SUBPROJECT_TABLE,
    DWR_TABLE,
    WORK_ASSIGNMENT_TABLE,
    TIME_RECORD_TABLE,
    CHARGE_RECORD_TABLE,
    INVENTORY_CHARGE_TABLE,
    SERVICE_CHARGE_TABLE,
    MISC_CHARGE_TABLE,
    SYNC_QUEUE_TABLE,
    REFERENCE_DATA_TABLE,
  ];

  for (const table of tables) {
    await db.executeSql(table);
  }

  // Create indexes
  for (const index of INDEXES) {
    await db.executeSql(index);
  }

  // Check and update schema version
  const [versionResult] = await db.executeSql(
    'SELECT version FROM schema_version ORDER BY id DESC LIMIT 1'
  );

  if (versionResult.rows.length === 0) {
    // First time - insert initial version
    await db.executeSql(
      'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
      [DATABASE_VERSION, new Date().toISOString()]
    );
    console.log(`Database schema initialized at version ${DATABASE_VERSION}`);
  } else {
    const currentVersion = versionResult.rows.item(0).version;
    if (currentVersion < DATABASE_VERSION) {
      // Run migrations
      await runMigrations(currentVersion, DATABASE_VERSION);
    }
  }

  console.log('Database schema ready');
};

/**
 * Run database migrations
 */
const runMigrations = async (
  fromVersion: number,
  toVersion: number
): Promise<void> => {
  const db = getDatabase();
  console.log(`Running migrations from v${fromVersion} to v${toVersion}`);

  // Add migration logic here as the schema evolves
  // Example:
  // if (fromVersion < 2) {
  //   await db.executeSql('ALTER TABLE dwrs ADD COLUMN new_field TEXT');
  // }

  // Update schema version
  await db.executeSql(
    'INSERT INTO schema_version (version, applied_at) VALUES (?, ?)',
    [toVersion, new Date().toISOString()]
  );

  console.log(`Migrations complete. Now at version ${toVersion}`);
};

/**
 * Initialize the database (open + schema)
 */
export const initializeDatabase = async (): Promise<void> => {
  await openDatabase();
  await initializeSchema();
};

/**
 * Clear all data from the database (but keep schema)
 */
export const clearAllData = async (): Promise<void> => {
  const tables = [
    'sync_queue',
    'miscellaneous_charges',
    'service_charges',
    'inventory_charges',
    'charge_records',
    'time_records',
    'work_assignments',
    'dwrs',
    'subprojects',
    'projects',
    'checkout_metadata',
    'reference_data',
  ];

  const statements = tables.map((table) => ({
    sql: `DELETE FROM ${table}`,
  }));

  await executeTransaction(statements);
  console.log('All offline data cleared');
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async (): Promise<{
  projectCount: number;
  subprojectCount: number;
  dwrCount: number;
  workAssignmentCount: number;
  timeRecordCount: number;
  chargeRecordCount: number;
  syncQueueCount: number;
  pendingSyncCount: number;
}> => {
  const db = getDatabase();

  const [projectResult] = await db.executeSql('SELECT COUNT(*) as count FROM projects');
  const [subprojectResult] = await db.executeSql('SELECT COUNT(*) as count FROM subprojects');
  const [dwrResult] = await db.executeSql('SELECT COUNT(*) as count FROM dwrs');
  const [waResult] = await db.executeSql('SELECT COUNT(*) as count FROM work_assignments');
  const [trResult] = await db.executeSql('SELECT COUNT(*) as count FROM time_records');
  const [crResult] = await db.executeSql('SELECT COUNT(*) as count FROM charge_records');
  const [sqResult] = await db.executeSql('SELECT COUNT(*) as count FROM sync_queue');
  const [pendingResult] = await db.executeSql(
    "SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('pending', 'failed')"
  );

  return {
    projectCount: projectResult.rows.item(0).count,
    subprojectCount: subprojectResult.rows.item(0).count,
    dwrCount: dwrResult.rows.item(0).count,
    workAssignmentCount: waResult.rows.item(0).count,
    timeRecordCount: trResult.rows.item(0).count,
    chargeRecordCount: crResult.rows.item(0).count,
    syncQueueCount: sqResult.rows.item(0).count,
    pendingSyncCount: pendingResult.rows.item(0).count,
  };
};

export default {
  openDatabase,
  getDatabase,
  closeDatabase,
  executeSql,
  executeTransaction,
  initializeDatabase,
  initializeSchema,
  clearAllData,
  getDatabaseStats,
};
