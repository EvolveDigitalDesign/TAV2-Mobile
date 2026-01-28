/**
 * Authentication types
 * Shared types compatible with TAV2 web app
 */

export type TenantType = 'EP' | 'PA' | 'PNA';
export type UserRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'region_manager'
  | 'human_resources'
  | 'superintendent'
  | 'rig_supervisor'
  | 'engineer'
  | 'user'
  | 'third_party'
  | 'standard_employee'
  | 'driver'
  | 'finance_admin'
  | 'operations_admin'
  | 'maintenance_admin'
  | 'safety_admin'
  | 'district_manager'
  | 'crew_supervisor'
  | 'bidding'
  | 'billing'
  | 'regulation'
  | 'maintenance_person'
  | 'dispatcher'
  | 'customer'
  | 'site_manager'
  | 'contract_manager'
  | 'bidding_manager'
  | 'billing_manager'
  | 'analyst';
export type AccessLevel = 'full_system' | 'limited' | 'read_only';

export interface TenantSettings {
  company_info?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  default_language?: string;
  default_timezone?: string;
  [key: string]: string | number | boolean | object | undefined;
}

export interface Tenant {
  id: number;
  name: string;
  tenant_type: TenantType;
  slug: string;
  domain?: string;
  is_active: boolean;
  settings: TenantSettings;
}

export interface TenantUserPermissions {
  can_manage_rigs?: boolean;
  can_manage_roles?: boolean;
  can_manage_users?: boolean;
  can_manage_tenant?: boolean;
  can_manage_bidding?: boolean;
  can_manage_billing?: boolean;
  can_configure_system?: boolean;
  can_manage_employees?: boolean;
  can_view_all_reports?: boolean;
  can_manage_integrations?: boolean;
  [key: string]: boolean | undefined;
}

export interface Region {
  id: number;
  name: string;
  code?: string;
}

export interface Department {
  id: number;
  name: string;
  rig_number?: string;
}

export interface TenantUser {
  id: number;
  role: UserRole;
  access_level: AccessLevel;
  is_active: boolean;
  is_primary: boolean;
  permissions: TenantUserPermissions;
  settings: Record<string, string | number | boolean | object | undefined>;
  managed_regions?: Region[];
  assigned_departments?: Department[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
  is_tenant_admin?: boolean;
  has_temporary_password?: boolean;
  roles?: string[];
  groups?: string[];
  permissions?: string[];
  managed_regions?: Region[];
  assigned_departments?: Department[];
  tenant?: Tenant;
  tenant_user?: TenantUser;
  available_tenants?: Array<{
    tenant: Tenant;
    role: UserRole;
    is_active: boolean;
    is_primary: boolean;
    managed_regions?: Region[];
    assigned_departments?: Department[];
  }>;
  primary_tenant?: Tenant;
  active_tenants?: Tenant[];
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  authenticated: boolean | null;
  user?: User;
}

export interface AuthContextProps {
  authState: AuthState;
  onLogin?: (
    email: string,
    password: string,
  ) => Promise<{access_token: string; refresh_token: string; user: User}>;
  onLogout?: () => Promise<void>;
  hasPermission?: (permission: string) => boolean;
  refreshToken?: () => Promise<boolean>;
}
