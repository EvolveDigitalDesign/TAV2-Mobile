/**
 * Checkout Service
 * Handles downloading records for offline use
 */

import apiClient from '../api/client';
import {
  CheckoutMetadata,
  CheckoutRequest,
  CheckoutResponse,
  OfflineProject,
  OfflineSubproject,
  OfflineDWR,
  OfflineWorkAssignment,
  OfflineEmployeeTimeRecord,
  OfflineChargeRecord,
  DWRStatus,
  STORAGE_KEYS,
} from '../../types/offline.types';
import {
  generateLocalId,
  getDeviceId,
  saveCheckoutMetadata,
  saveCheckedOutDWRIds,
  saveProject,
  saveSubproject,
  saveDWR,
  saveWorkAssignment,
  saveTimeRecord,
  saveChargeRecord,
  saveReferenceData,
  getCheckoutMetadata,
  clearAllOfflineData,
} from './storageService';

// ===============================
// Types
// ===============================

export interface CheckoutResult {
  success: boolean;
  checkoutId?: string;
  recordCount?: number;
  error?: string;
}

export interface CheckoutProgress {
  phase: 'fetching' | 'saving' | 'reference_data' | 'complete';
  current: number;
  total: number;
  message: string;
}

export type CheckoutProgressCallback = (progress: CheckoutProgress) => void;

// ===============================
// Helper Functions
// ===============================

/**
 * Convert API DWR to offline DWR format
 */
const convertToOfflineDWR = (
  apiDWR: Record<string, unknown>,
  checkoutId: string
): OfflineDWR => {
  const localId = generateLocalId();
  
  return {
    id: apiDWR.id as number | undefined,
    local_id: localId,
    server_id: apiDWR.id as number,
    subproject_id: (apiDWR.subproject as { id: number })?.id || (apiDWR.subproject_id as number),
    subproject: apiDWR.subproject as OfflineDWR['subproject'],
    date: apiDWR.date as string,
    ticket_number: apiDWR.ticket_number as string || '',
    notes: apiDWR.notes as string || '',
    contact_id: apiDWR.contact as number | null,
    contact: apiDWR.contact_details as OfflineDWR['contact'] || null,
    is_last_day: apiDWR.is_last_day as boolean || false,
    is_locked: apiDWR.is_locked as boolean || false,
    lock_date: apiDWR.lock_date as string | null,
    is_approved: apiDWR.is_approved as boolean || false,
    approved_at: apiDWR.approved_at as string | null,
    approved_by: apiDWR.approved_by as number | null,
    status: apiDWR.status as DWRStatus || 'draft',
    // Offline metadata
    is_checked_out: true,
    has_local_changes: false,
    created_locally: false,
    last_synced_at: Date.now(),
    // Related data will be populated separately
    work_assignments: [],
    time_records: [],
    charge_record: undefined,
  };
};

/**
 * Convert API work assignment to offline format
 */
const convertToOfflineWorkAssignment = (
  apiAssignment: Record<string, unknown>,
  dwrLocalId: string
): OfflineWorkAssignment => {
  return {
    id: apiAssignment.id as number | undefined,
    local_id: generateLocalId(),
    server_id: apiAssignment.id as number,
    dwr_id: dwrLocalId,
    work_description_id: apiAssignment.work_description_id as number | undefined,
    work_description: apiAssignment.work_description as OfflineWorkAssignment['work_description'],
    description: apiAssignment.description as string || '',
    from_time: (apiAssignment.from_time || apiAssignment.fromTime) as string || '',
    to_time: (apiAssignment.to_time || apiAssignment.toTime) as string | null,
    input_values: apiAssignment.input_values as Record<string, unknown> || {},
    is_legacy: apiAssignment.is_legacy as boolean || false,
    has_local_changes: false,
    created_locally: false,
    deleted_locally: false,
  };
};

/**
 * Convert API time record to offline format
 */
const convertToOfflineTimeRecord = (
  apiRecord: Record<string, unknown>,
  dwrLocalId: string
): OfflineEmployeeTimeRecord => {
  const employee = apiRecord.employee as Record<string, unknown> | number;
  const role = apiRecord.role as Record<string, unknown> | number;
  
  return {
    id: apiRecord.id as number | undefined,
    local_id: generateLocalId(),
    server_id: apiRecord.id as number,
    employee_id: typeof employee === 'number' ? employee : (employee?.id as number),
    employee: typeof employee === 'object' ? employee as OfflineEmployeeTimeRecord['employee'] : undefined,
    dwr_id: dwrLocalId,
    start_time: apiRecord.start_time as string | null,
    stop_time: apiRecord.stop_time as string | null,
    rig_time: apiRecord.rig_time as string | null,
    travel_time: apiRecord.travel_time as string | null,
    role_id: typeof role === 'number' ? role : (role?.id as number),
    role: typeof role === 'object' ? role as OfflineEmployeeTimeRecord['role'] : undefined,
    has_local_changes: false,
    created_locally: false,
    deleted_locally: false,
  };
};

/**
 * Convert API charge record to offline format
 */
const convertToOfflineChargeRecord = (
  apiRecord: Record<string, unknown>,
  dwrLocalId: string
): OfflineChargeRecord => {
  const inventoryCharges = (apiRecord.inventory_charges as Array<Record<string, unknown>> || []).map((charge) => ({
    id: charge.id as number | undefined,
    local_id: generateLocalId(),
    server_id: charge.id as number,
    charge_record_id: apiRecord.id as number,
    inventory_item_id: charge.inventory_item as number,
    item_name: charge.item_name as string | undefined,
    quantity_used: charge.quantity_used as number || 0,
    price_at_use: charge.price_at_use as number || 0,
    is_billable: charge.is_billable as boolean || true,
    off_turnkey: charge.off_turnkey as boolean || false,
    total: charge.total as number | undefined,
    unit_name: charge.unit_name as string | undefined,
    unit_abbreviation: charge.unit_abbreviation as string | undefined,
    has_local_changes: false,
    created_locally: false,
    deleted_locally: false,
  }));

  const serviceCharges = (apiRecord.service_charges as Array<Record<string, unknown>> || []).map((charge) => ({
    id: charge.id as number | undefined,
    local_id: generateLocalId(),
    server_id: charge.id as number,
    charge_record_id: apiRecord.id as number,
    service_item_id: charge.service_item as number,
    item_name: charge.item_name as string | undefined,
    quantity_used: charge.quantity_used as number || 0,
    price_at_use: charge.price_at_use as number || 0,
    is_billable: charge.is_billable as boolean || true,
    off_turnkey: charge.off_turnkey as boolean || false,
    total: charge.total as number | undefined,
    unit_name: charge.unit_name as string | undefined,
    unit_abbreviation: charge.unit_abbreviation as string | undefined,
    has_local_changes: false,
    created_locally: false,
    deleted_locally: false,
  }));

  const miscCharges = (apiRecord.miscellaneous_charges as Array<Record<string, unknown>> || []).map((charge) => ({
    id: charge.id as number | undefined,
    local_id: generateLocalId(),
    server_id: charge.id as number,
    charge_record_id: apiRecord.id as number,
    miscellaneous_item_id: charge.miscellaneous_item as number,
    custom_name: charge.custom_name as string || '',
    quantity_used: charge.quantity_used as number || 0,
    price_at_use: charge.price_at_use as number || 0,
    is_billable: charge.is_billable as boolean || true,
    off_turnkey: charge.off_turnkey as boolean || false,
    total: charge.total as number | undefined,
    unit_name: charge.unit_name as string | undefined,
    unit_abbreviation: charge.unit_abbreviation as string | undefined,
    has_local_changes: false,
    created_locally: false,
    deleted_locally: false,
  }));

  return {
    id: apiRecord.id as number | undefined,
    local_id: generateLocalId(),
    server_id: apiRecord.id as number,
    dwr_id: dwrLocalId,
    inventory_charges: inventoryCharges,
    service_charges: serviceCharges,
    miscellaneous_charges: miscCharges,
    total_amount: apiRecord.total_amount as number || 0,
    is_manual_total: apiRecord.is_manual_total as boolean || false,
    has_local_changes: false,
  };
};

// ===============================
// Main Checkout Function
// ===============================

/**
 * Checkout records for offline use
 */
export const checkoutRecords = async (
  rigId: number,
  userId: number,
  username?: string,
  onProgress?: CheckoutProgressCallback
): Promise<CheckoutResult> => {
  try {
    // Check if already checked out
    const existingCheckout = await getCheckoutMetadata();
    if (existingCheckout.success && existingCheckout.data?.is_active) {
      if (existingCheckout.data.expires_at > Date.now()) {
        return {
          success: false,
          error: 'Already have an active checkout. Please check in first.',
        };
      }
      // Expired checkout - clear it
      await clearAllOfflineData();
    }

    const deviceId = await getDeviceId();

    // Report progress
    onProgress?.({
      phase: 'fetching',
      current: 0,
      total: 100,
      message: 'Requesting checkout from server...',
    });

    // Call checkout API
    const request: CheckoutRequest = {
      rig_id: rigId,
      statuses: ['draft', 'pending', 'in_progress', 'in_review'],
      device_id: deviceId,
    };

    let response: CheckoutResponse;
    
    try {
      const apiResponse = await apiClient.post<CheckoutResponse>(
        '/api/workrecords/checkout/',
        request
      );
      response = apiResponse.data;
    } catch (apiError) {
      // If the checkout endpoint doesn't exist yet, fallback to fetching DWRs directly
      console.warn('Checkout endpoint not available, using fallback:', apiError);
      
      // Fallback: Fetch DWRs for active subprojects
      // First get subprojects for the rig, then fetch DWRs by subproject
      // Endpoint: /api/wells/subprojects/
      const subprojectsRes = await apiClient.get('/api/wells/subprojects/', {
        params: {
          assigned_rig: rigId,
          status: 'active',
          page_size: 100,
        },
      });
      
      const subprojectIds = (subprojectsRes.data.results || subprojectsRes.data || [])
        .map((sp: { id: number }) => sp.id);
      
      // Fetch DWRs for each subproject (backend doesn't support filtering by multiple subprojects at once)
      // Note: In production, a dedicated checkout endpoint would be more efficient
      const dwrPromises = subprojectIds.map((spId: number) =>
        apiClient.get('/api/workrecords/dailyworkrecords/', {
          params: {
            subproject_id: spId,
            page_size: 50,
          },
        })
      );
      
      const dwrResponses = await Promise.all(dwrPromises);
      const allDwrs = dwrResponses.flatMap(res => res.data.results || res.data || []);
      
      // Create a mock response structure
      const dwrResponse = { data: { results: allDwrs } };
      
      const dwrList = dwrResponse.data.results || dwrResponse.data || [];
      
      // Create a mock checkout response
      response = {
        checkout_id: generateLocalId(),
        checked_out_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        rig_id: rigId,
        records: dwrList.map((dwr: Record<string, unknown>) => ({
          id: dwr.id,
          type: 'daily_work_record' as const,
          data: dwr,
        })),
      };
    }

    onProgress?.({
      phase: 'saving',
      current: 10,
      total: 100,
      message: `Saving ${response.records.length} records...`,
    });

    // Save checkout metadata
    const metadata: CheckoutMetadata = {
      checkout_id: response.checkout_id,
      rig_id: rigId,
      rig_name: undefined, // Will be populated if available
      user_id: userId,
      username,
      device_id: deviceId,
      checked_out_at: new Date(response.checked_out_at).getTime(),
      expires_at: new Date(response.expires_at).getTime(),
      is_active: true,
      record_count: response.records.length,
      last_sync_at: Date.now(),
    };

    await saveCheckoutMetadata(metadata);

    // Process and save records
    const dwrLocalIds: string[] = [];
    const dwrRecords = response.records.filter((r) => r.type === 'daily_work_record');
    
    for (let i = 0; i < dwrRecords.length; i++) {
      const record = dwrRecords[i];
      const progress = 10 + Math.floor((i / dwrRecords.length) * 60);
      
      onProgress?.({
        phase: 'saving',
        current: progress,
        total: 100,
        message: `Saving DWR ${i + 1} of ${dwrRecords.length}...`,
      });

      // Convert and save DWR
      const offlineDWR = convertToOfflineDWR(record.data, response.checkout_id);
      dwrLocalIds.push(offlineDWR.local_id);

      // Fetch related data if not included
      try {
        // Fetch work assignments for this DWR
        // Endpoint: /api/workrecords/work-assignments/?daily_work_record={id}
        const waResponse = await apiClient.get('/api/workrecords/work-assignments/', {
          params: { daily_work_record: record.id, page_size: 100 },
        });
        const workAssignments = (waResponse.data.results || waResponse.data || []).map(
          (wa: Record<string, unknown>) => convertToOfflineWorkAssignment(wa, offlineDWR.local_id)
        );
        offlineDWR.work_assignments = workAssignments;

        // Save work assignments individually for easier access
        for (const wa of workAssignments) {
          await saveWorkAssignment(wa);
        }

        // Fetch time records for this DWR
        // Endpoint: /api/workrecords/employee-time-records/?daily_work_record={id}
        const trResponse = await apiClient.get('/api/workrecords/employee-time-records/', {
          params: { daily_work_record: record.id, page_size: 100 },
        });
        const timeRecords = (trResponse.data.results || trResponse.data || []).map(
          (tr: Record<string, unknown>) => convertToOfflineTimeRecord(tr, offlineDWR.local_id)
        );
        offlineDWR.time_records = timeRecords;

        // Save time records individually
        for (const tr of timeRecords) {
          await saveTimeRecord(tr);
        }

        // Fetch charge records for this DWR
        // Endpoint: /api/workrecords/charge-records/?daily_work_record={id}
        const crResponse = await apiClient.get('/api/workrecords/charge-records/', {
          params: { daily_work_record: record.id, page_size: 100 },
        });
        if (crResponse.data) {
          const chargeRecord = convertToOfflineChargeRecord(crResponse.data, offlineDWR.local_id);
          offlineDWR.charge_record = chargeRecord;
          await saveChargeRecord(chargeRecord);
        }
      } catch (relatedError) {
        console.warn(`Failed to fetch related data for DWR ${record.id}:`, relatedError);
        // Continue with partial data
      }

      await saveDWR(offlineDWR);
    }

    // Save list of DWR local IDs
    await saveCheckedOutDWRIds(dwrLocalIds);

    // Fetch reference data
    onProgress?.({
      phase: 'reference_data',
      current: 75,
      total: 100,
      message: 'Downloading reference data...',
    });

    await fetchAndSaveReferenceData(rigId);

    onProgress?.({
      phase: 'complete',
      current: 100,
      total: 100,
      message: 'Checkout complete!',
    });

    return {
      success: true,
      checkoutId: response.checkout_id,
      recordCount: dwrLocalIds.length,
    };
  } catch (error) {
    console.error('Checkout error:', error);
    // Clear any partial data
    await clearAllOfflineData();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Checkout failed',
    };
  }
};

/**
 * Fetch and cache reference data for offline use
 */
const fetchAndSaveReferenceData = async (rigId: number): Promise<void> => {
  try {
    // Fetch projects and subprojects for the rig
    await fetchAndSaveProjectsSubprojects(rigId);

    // Fetch employees for the rig
    // Endpoint: /api/employees/employees/
    const employeesResponse = await apiClient.get('/api/employees/employees/', {
      params: { assigned_rig: rigId, is_active: true, page_size: 500 },
    });
    await saveReferenceData(
      STORAGE_KEYS.EMPLOYEES,
      employeesResponse.data.results || employeesResponse.data || []
    );

    // Fetch employee types
    // Endpoint: /api/employees/employee-types/
    const typesResponse = await apiClient.get('/api/employees/employee-types/');
    await saveReferenceData(
      STORAGE_KEYS.EMPLOYEE_TYPES,
      typesResponse.data.results || typesResponse.data || []
    );

    // Fetch work descriptions
    // Endpoint: /api/tenants/work-descriptions/
    const wdResponse = await apiClient.get('/api/tenants/work-descriptions/');
    await saveReferenceData(
      STORAGE_KEYS.WORK_DESCRIPTIONS,
      wdResponse.data.results || wdResponse.data || []
    );

    // Fetch inventory items
    // Endpoint: /api/inventory/inventory/
    try {
      const invResponse = await apiClient.get('/api/inventory/inventory/', {
        params: { page_size: 500 },
      });
      await saveReferenceData(
        STORAGE_KEYS.INVENTORY_ITEMS,
        invResponse.data.results || invResponse.data || []
      );
    } catch (e) {
      console.warn('Failed to fetch inventory items:', e);
    }

    // Fetch service items
    // Endpoint: /api/inventory/services/
    try {
      const svcResponse = await apiClient.get('/api/inventory/services/', {
        params: { page_size: 500 },
      });
      await saveReferenceData(
        STORAGE_KEYS.SERVICE_ITEMS,
        svcResponse.data.results || svcResponse.data || []
      );
    } catch (e) {
      console.warn('Failed to fetch service items:', e);
    }
  } catch (error) {
    console.error('Error fetching reference data:', error);
    // Non-fatal - continue without reference data
  }
};

/**
 * Fetch and save projects and subprojects for a rig
 */
const fetchAndSaveProjectsSubprojects = async (rigId: number): Promise<void> => {
  try {
    // Fetch subprojects assigned to this rig
    // Endpoint: /api/wells/subprojects/
    const subprojectsResponse = await apiClient.get('/api/wells/subprojects/', {
      params: { 
        assigned_rig: rigId, 
        is_active: true,
        page_size: 500,
      },
    });
    
    const subprojects = subprojectsResponse.data.results || subprojectsResponse.data || [];
    const savedProjects = new Set<number>();

    // Save subprojects and extract project info from nested data
    for (const sp of subprojects) {
      const offlineSubproject: OfflineSubproject = {
        server_id: sp.id,
        project_id: sp.project?.id || sp.project_id,
        name: sp.name,
        job_number: sp.job_number,
        description: sp.description,
        assigned_rig_id: sp.assigned_rig?.id || sp.assigned_rig_id || rigId,
        assigned_rig_name: sp.assigned_rig?.name || sp.assigned_rig_name,
        assigned_rig_number: sp.assigned_rig?.rig_number || sp.assigned_rig_number,
        well_id: sp.well?.id || sp.well_id,
        well_name: sp.well?.name,
        well_api_number: sp.well?.api_number,
        customer_id: sp.well?.customer?.id || sp.customer?.id,
        customer_name: sp.well?.customer?.name || sp.customer?.name,
        status: sp.status || 'active',
        is_active: sp.is_active !== false,
      };

      await saveSubproject(offlineSubproject);

      // Save project info from nested data in subproject (no separate endpoint needed)
      if (sp.project && sp.project.id && !savedProjects.has(sp.project.id)) {
        const offlineProject: OfflineProject = {
          server_id: sp.project.id,
          name: sp.project.name || '',
          description: sp.project.description,
          customer_id: sp.project.customer?.id || sp.project.customer_id,
          customer_name: sp.project.customer?.name || sp.project.customer_name,
          status: sp.project.status || 'active',
          start_date: sp.project.start_date,
          end_date: sp.project.end_date,
          is_active: sp.project.is_active !== false,
        };

        await saveProject(offlineProject);
        savedProjects.add(sp.project.id);
      }
    }

    console.log(`Saved ${subprojects.length} subprojects and ${savedProjects.size} projects for rig ${rigId}`);
  } catch (error) {
    console.warn('Failed to fetch projects/subprojects:', error);
    // Non-fatal - continue without project data
  }
};

/**
 * Check if currently checked out
 */
export const hasActiveCheckout = async (): Promise<boolean> => {
  const result = await getCheckoutMetadata();
  if (!result.success || !result.data) {
    return false;
  }
  return result.data.is_active && result.data.expires_at > Date.now();
};

/**
 * Get current checkout info
 */
export const getCheckoutInfo = async (): Promise<CheckoutMetadata | null> => {
  const result = await getCheckoutMetadata();
  if (!result.success || !result.data) {
    return null;
  }
  if (!result.data.is_active || result.data.expires_at <= Date.now()) {
    return null;
  }
  return result.data;
};

export default {
  checkoutRecords,
  hasActiveCheckout,
  getCheckoutInfo,
};
