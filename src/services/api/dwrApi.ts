/**
 * Daily Work Record (DWR) API Service
 * Handles DWR data fetching and management
 */

import apiClient from './client';
import { OfflineDWR } from '../../types/offline.types';
import { getAllDWRs } from '../offline/storageService';

// ===============================
// Types
// ===============================

export interface DailyWorkRecord {
  id: number;
  subproject: {
    id: number;
    name: string;
    job_number?: string;
  };
  date: string;
  ticket_number: string;
  notes: string;
  status: 'draft' | 'pending' | 'in_progress' | 'in_review' | 'approved' | 'rejected';
  is_locked: boolean;
  is_approved: boolean;
  approved_at?: string;
  approved_by?: number;
  contact?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  work_assignments_count?: number;
  time_records_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DWRListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DailyWorkRecord[];
}

export interface DWRSummary {
  total: number;
  draft: number;
  pending: number;
  in_progress: number;
  in_review: number;
  approved: number;
  unapproved: number;
}

// ===============================
// API Functions
// ===============================

/**
 * Fetch DWRs from API
 * Endpoint: /api/workrecords/dailyworkrecords/
 * Note: Use subproject_id to filter by subproject (same as web app)
 */
export const fetchDWRs = async (params?: {
  subproject_id?: number;
  status?: string;
  date_after?: string;
  date_before?: string;
  is_approved?: boolean;
  search?: string;
  ordering?: string;
  page_size?: number;
  page?: number;
}): Promise<DWRListResponse> => {
  const response = await apiClient.get<DWRListResponse>('/api/workrecords/dailyworkrecords/', {
    params: {
      page_size: params?.page_size || 50,
      ...params,
    },
  });
  return response.data;
};

/**
 * Fetch a single DWR by ID
 * Endpoint: /api/workrecords/dailyworkrecords/{id}/
 */
export const fetchDWRById = async (id: number): Promise<DailyWorkRecord> => {
  const response = await apiClient.get<DailyWorkRecord>(`/api/workrecords/dailyworkrecords/${id}/`);
  return response.data;
};

/**
 * Get DWRs from local database (for offline mode)
 */
export const getOfflineDWRs = async (): Promise<OfflineDWR[]> => {
  return getAllDWRs();
};

/**
 * Get unapproved DWRs count for a subproject
 */
export const fetchUnapprovedCount = async (subprojectId?: number): Promise<number> => {
  try {
    const response = await fetchDWRs({
      subproject_id: subprojectId,
      is_approved: false,
      page_size: 1, // We only need the count
    });
    return response.count;
  } catch (error) {
    console.error('Error fetching unapproved count:', error);
    return 0;
  }
};

/**
 * Get DWR summary statistics for a subproject
 * If no subprojectId is provided, gets all DWRs for the user
 */
export const fetchDWRSummary = async (subprojectId?: number): Promise<DWRSummary> => {
  try {
    // Build base params - only include subproject_id if provided
    const baseParams = subprojectId ? { subproject_id: subprojectId } : {};
    
    // Fetch all statuses in parallel
    const [draftRes, pendingRes, inProgressRes, inReviewRes, approvedRes, unapprovedRes] = await Promise.all([
      fetchDWRs({ ...baseParams, status: 'draft', page_size: 1 }),
      fetchDWRs({ ...baseParams, status: 'pending', page_size: 1 }),
      fetchDWRs({ ...baseParams, status: 'in_progress', page_size: 1 }),
      fetchDWRs({ ...baseParams, status: 'in_review', page_size: 1 }),
      fetchDWRs({ ...baseParams, status: 'approved', page_size: 1 }),
      fetchDWRs({ ...baseParams, is_approved: false, page_size: 1 }),
    ]);

    return {
      total: draftRes.count + pendingRes.count + inProgressRes.count + inReviewRes.count + approvedRes.count,
      draft: draftRes.count,
      pending: pendingRes.count,
      in_progress: inProgressRes.count,
      in_review: inReviewRes.count,
      approved: approvedRes.count,
      unapproved: unapprovedRes.count,
    };
  } catch (error) {
    console.error('Error fetching DWR summary:', error);
    return {
      total: 0,
      draft: 0,
      pending: 0,
      in_progress: 0,
      in_review: 0,
      approved: 0,
      unapproved: 0,
    };
  }
};

/**
 * Create a new DWR
 * Endpoint: /api/workrecords/dailyworkrecords/
 */
export const createDWR = async (data: {
  subproject: number;
  date: string;
  ticket_number?: string;
  notes?: string;
}): Promise<DailyWorkRecord> => {
  const response = await apiClient.post<DailyWorkRecord>('/api/workrecords/dailyworkrecords/', data);
  return response.data;
};

/**
 * Update a DWR
 * Endpoint: /api/workrecords/dailyworkrecords/{id}/
 */
export const updateDWR = async (
  id: number,
  data: Partial<{
    ticket_number: string;
    notes: string;
    status: string;
  }>
): Promise<DailyWorkRecord> => {
  const response = await apiClient.patch<DailyWorkRecord>(`/api/workrecords/dailyworkrecords/${id}/`, data);
  return response.data;
};

export default {
  fetchDWRs,
  fetchDWRById,
  getOfflineDWRs,
  fetchUnapprovedCount,
  fetchDWRSummary,
  createDWR,
  updateDWR,
};
