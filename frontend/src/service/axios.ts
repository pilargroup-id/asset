import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL

if (!baseURL) {
  throw new Error('VITE_API_BASE_URL is not defined. Set it in your .env file.')
}

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api

export interface AssetListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  category_id?: number | string
  location_id?: number | string
}

export interface AssetListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AssetRecord {
  id: number
  asset_number: string
  asset_name: string
  category_id: number
  category_name?: string
  brand_name?: string | null
  model_name?: string | null
  serial_number?: string | null
  current_location_name?: string | null
  status: string
  asset_condition: string
  purchase_date?: string | null
  purchase_cost?: number | string | null
  vendor_name?: string | null
  [key: string]: unknown
}

export interface AssetListResponse {
  success: boolean
  message: string
  data: AssetRecord[]
  meta: AssetListMeta
}

// GET /api/assets
export async function getAssets(params: AssetListParams = {}): Promise<AssetListResponse> {
  const { data } = await api.get<AssetListResponse>('/assets', { params })
  return data
}

export interface CreateAssetPayload {
  asset_name: string
  category_id: number | string
  managing_department_id: number | string
  company_id: string
  asset_number?: string
  brand_id?: number | string
  model_id?: number | string
  serial_number?: string
  current_location_id?: number | string
  status?: 'REGISTERED' | 'AVAILABLE'
  asset_condition?: 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED'
  purchase_date?: string
  purchase_cost?: number
  vendor_id?: number | string
  warranty_until?: string
  notes?: string
}

export interface AssetResponse {
  success: boolean
  message: string
  data: AssetRecord
}

// POST /api/assets
export async function createAsset(payload: CreateAssetPayload): Promise<AssetResponse> {
  const { data } = await api.post<AssetResponse>('/assets', payload)
  return data
}

export interface UpdateAssetPayload {
  asset_name?: string
  category_id?: number | string
  brand_id?: number | string
  model_id?: number | string
  serial_number?: string
  asset_condition?: 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED'
  purchase_date?: string
  purchase_cost?: number
  vendor_id?: number | string
  warranty_until?: string
  notes?: string
}

// PUT /api/assets/:id
export async function updateAsset(id: number | string, payload: UpdateAssetPayload): Promise<AssetResponse> {
  const { data } = await api.put<AssetResponse>(`/assets/${id}`, payload)
  return data
}

export interface MasterDataRecord {
  id: number | string
  code?: string | null
  name: string
  brand_id?: number | string | null
  parent_id?: number | string | null
  location_type?: string | null
  tracking_type?: string
  is_depreciable?: number | boolean
  is_active?: number | boolean
  [key: string]: unknown
}

export interface MasterDataListResponse {
  success: boolean
  message: string
  data: MasterDataRecord[]
}

// GET /api/master/:type
export async function getMasterData(
  type: string,
  params: Record<string, unknown> = {}
): Promise<MasterDataListResponse> {
  const { data } = await api.get<MasterDataListResponse>(`/master/${type}`, { params })
  return data
}

export interface NumberingConfigRecord {
  id: number
  managing_department_id: string
  company_id?: string | null
  sequence_type: string
  name: string
  prefix?: string | null
  company_token?: string | null
  department_token?: string | null
  pattern: string
  sequence_length: number
  starting_sequence: number
  current_sequence: number
  reset_period?: string | null
  is_active?: number | boolean
  last_reset_key?: string | null
  [key: string]: unknown
}

export interface NumberingConfigListResponse {
  success: boolean
  message: string
  data: NumberingConfigRecord[]
}

// GET /api/numbering
export async function getNumberingConfigs(
  params: Record<string, unknown> = {}
): Promise<NumberingConfigListResponse> {
  const { data } = await api.get<NumberingConfigListResponse>('/numbering', { params })
  return data
}

export interface PermissionRecord {
  id: number
  code: string
  name: string
  description?: string | null
  is_active?: number | boolean
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface PermissionListResponse {
  success: boolean
  message: string
  data: PermissionRecord[]
}

// GET /api/permissions
export async function getPermissions(): Promise<PermissionListResponse> {
  const { data } = await api.get<PermissionListResponse>('/permissions')
  return data
}

export interface PermissionAssignmentRecord {
  id: number
  permission_id: number
  permission_code: string
  permission_name: string
  subject_type: 'USER' | 'COMPANY' | 'DEPARTMENT'
  subject_id: string
  access_scope_type: 'GLOBAL' | 'COMPANY' | 'DEPARTMENT'
  access_scope_id: string | null
  is_active?: number | boolean
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface PermissionAssignmentListParams {
  subject_type?: string
  subject_id?: string
  permission_code?: string
  access_scope_type?: string
  access_scope_id?: string
}

export interface PermissionAssignmentListResponse {
  success: boolean
  message: string
  data: PermissionAssignmentRecord[]
}

// GET /api/permissions/assignments
export async function getPermissionAssignments(
  params: PermissionAssignmentListParams = {}
): Promise<PermissionAssignmentListResponse> {
  const { data } = await api.get<PermissionAssignmentListResponse>('/permissions/assignments', { params })
  return data
}

export interface CreatePermissionAssignmentPayload {
  permission_code: string
  subject_type: 'USER' | 'COMPANY' | 'DEPARTMENT'
  subject_id: string
  access_scope_type: 'GLOBAL' | 'COMPANY' | 'DEPARTMENT'
  access_scope_id?: string
}

export interface PermissionAssignmentResponse {
  success: boolean
  message: string
  data: PermissionAssignmentRecord
}

// POST /api/permissions/assignments
export async function createPermissionAssignment(
  payload: CreatePermissionAssignmentPayload
): Promise<PermissionAssignmentResponse> {
  const { data } = await api.post<PermissionAssignmentResponse>('/permissions/assignments', payload)
  return data
}

export interface DirectoryRecord {
  id: string | number
  name?: string
  full_name?: string
  display_name?: string
  department_name?: string
  company_name?: string
  username?: string
  email?: string
  [key: string]: unknown
}

export interface DirectoryListResponse {
  success: boolean
  message: string
  data: DirectoryRecord[] | Record<string, unknown>
}

// GET /api/directory/users
export async function getDirectoryUsers(params: Record<string, unknown> = {}): Promise<DirectoryListResponse> {
  const { data } = await api.get<DirectoryListResponse>('/directory/users', { params })
  return data
}

// GET /api/directory/departments
export async function getDirectoryDepartments(params: Record<string, unknown> = {}): Promise<DirectoryListResponse> {
  const { data } = await api.get<DirectoryListResponse>('/directory/departments', { params })
  return data
}

// GET /api/directory/companies
export async function getDirectoryCompanies(params: Record<string, unknown> = {}): Promise<DirectoryListResponse> {
  const { data } = await api.get<DirectoryListResponse>('/directory/companies', { params })
  return data
}
