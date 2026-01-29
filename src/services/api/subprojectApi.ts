/**
 * Subproject API Service
 * Handles subproject data fetching and management
 */

import apiClient from './client';
import { OfflineSubproject, OfflineProject } from '../../types/offline.types';
import { getAllSubprojects, getAllProjects } from '../offline/storageService';

// ===============================
// Types
// ===============================

export interface Subproject {
  id: number;
  name: string;
  job_number?: string;
  status: string;
  assigned_rig?: {
    id: number;
    name: string;
    rig_number?: string;
  };
  well?: {
    id: number;
    name: string;
    api_number?: string;
    customer?: {
      id: number;
      name: string;
    };
  };
  project?: {
    id: number;
    name: string;
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubprojectListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Subproject[];
}

// ===============================
// API Functions
// ===============================

/**
 * Fetch subprojects from API (with optional offline fallback)
 * Endpoint: /api/wells/subprojects/
 * Note: The backend filters by user permissions/tenant automatically
 */
export const fetchSubprojects = async (params?: {
  project?: number;
  status?: string;
  region?: number;
  subproject_type?: number;
  search?: string;
  ordering?: string;
  page_size?: number;
}): Promise<Subproject[]> => {
  const requestParams = {
    page_size: params?.page_size || 100,
    ...params,
  };
  
  console.log('🔍 Fetching subprojects with params:', requestParams);
  console.log('🔍 API Base URL:', apiClient.defaults.baseURL);
  
  try {
    const response = await apiClient.get<SubprojectListResponse>('/api/wells/subprojects/', {
      params: requestParams,
    });
    
    console.log('🔍 Subprojects API response:', {
      status: response.status,
      count: response.data.count,
      resultsCount: response.data.results?.length || 0,
      next: response.data.next,
      requestUrl: response.config.url,
      authHeader: response.config.headers?.Authorization ? 'Bearer ...' + String(response.config.headers.Authorization).slice(-10) : 'none',
    });
    
    // Log full response for debugging
    if (response.data.count === 0) {
      console.log('🔍 API returned 0 subprojects - response:', JSON.stringify(response.data));
    } else {
      console.log('🔍 First few subprojects:', response.data.results?.slice(0, 3));
    }
    
    return response.data.results || [];
  } catch (error: unknown) {
    const axiosError = error as { 
      response?: { status: number; data: unknown; headers: unknown }; 
      message?: string;
      config?: { url: string; headers: unknown };
    };
    console.error('🔍 Error fetching subprojects from API:', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      message: axiosError.message,
      url: axiosError.config?.url,
      requestHeaders: axiosError.config?.headers,
    });
    throw error;
  }
};

/**
 * Get all subprojects (no filtering)
 * Backend automatically filters by user's tenant/permissions
 */
export const fetchAllSubprojects = async (): Promise<Subproject[]> => {
  return fetchSubprojects({});
};

/**
 * Get active subprojects
 * Matches web app behavior: fetch ALL subprojects, then filter client-side
 * Backend automatically filters by user's tenant/permissions
 */
export const fetchActiveSubprojects = async (_rigId?: number): Promise<Subproject[]> => {
  // Match web app: fetch all subprojects (no server filter), filter client-side
  const allSubprojects = await fetchSubprojects({});
  
  // Filter for active status client-side (same as web app)
  const activeSubprojects = allSubprojects.filter(sp => sp.status === 'active');
  
  console.log('🔍 Subprojects filter:', {
    total: allSubprojects.length,
    active: activeSubprojects.length,
    statuses: allSubprojects.map(sp => sp.status),
  });
  
  return activeSubprojects;
};

/**
 * Get subprojects from local database (for offline mode)
 */
export const getOfflineSubprojects = async (): Promise<OfflineSubproject[]> => {
  return getAllSubprojects();
};

/**
 * Get projects from local database (for offline mode)
 */
export const getOfflineProjects = async (): Promise<OfflineProject[]> => {
  return getAllProjects();
};

/**
 * Get a single subproject by ID
 * Endpoint: /api/wells/subprojects/{id}/
 */
export const fetchSubprojectById = async (id: number): Promise<Subproject> => {
  const response = await apiClient.get<Subproject>(`/api/wells/subprojects/${id}/`);
  return response.data;
};

export default {
  fetchSubprojects,
  fetchActiveSubprojects,
  fetchSubprojectById,
  getOfflineSubprojects,
  getOfflineProjects,
};
