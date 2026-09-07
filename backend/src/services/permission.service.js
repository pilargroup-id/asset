const PermissionModel = require('../models/permission.model');
const { appError } = require('../utils/app-error.util');
const { SCOPE_TYPES } = require('../constants/domain.constants');
function matchesScope(grant, companyId, departmentId) {
  if (grant.scope_type === SCOPE_TYPES.GLOBAL) return true;
  if (grant.scope_type === SCOPE_TYPES.COMPANY) return companyId != null && String(grant.company_id) === String(companyId);
  if (grant.scope_type === SCOPE_TYPES.DEPARTMENT) {
    const deptMatch = departmentId != null && Number(grant.department_id) === Number(departmentId);
    const companyMatch = grant.company_id == null || (companyId != null && String(grant.company_id) === String(companyId));
    return deptMatch && companyMatch;
  }
  return false;
}
async function getGrants(userId, permissionCode, conn) { return PermissionModel.getUserGrants(userId, permissionCode, conn); }
async function assertAny(userId, permissionCode, conn) {
  const grants = await getGrants(userId, permissionCode, conn);
  if (!grants.length) throw appError(`Permission ${permissionCode} is required`, 403, 'PERMISSION_FORBIDDEN');
  return grants;
}
async function assertScope(userId, permissionCode, companyId, departmentId, conn) {
  const grants = await assertAny(userId, permissionCode, conn);
  if (!grants.some((g) => matchesScope(g, companyId, departmentId))) {
    throw appError('Permission scope does not allow this operation', 403, 'PERMISSION_SCOPE_FORBIDDEN');
  }
  return grants;
}
async function assertGlobal(userId, permissionCode, conn) {
  const grants = await assertAny(userId, permissionCode, conn);
  if (!grants.some((g) => g.scope_type === SCOPE_TYPES.GLOBAL)) throw appError('GLOBAL scope is required', 403, 'GLOBAL_SCOPE_REQUIRED');
  return grants;
}
async function buildScopeSql(userId, permissionCode, alias = 't', departmentColumn = 'managing_department_id', companyColumn = 'company_id', conn) {
  const grants = await assertAny(userId, permissionCode, conn);
  if (grants.some((g) => g.scope_type === SCOPE_TYPES.GLOBAL)) return { sql: '1=1', params: [], grants };
  const clauses = []; const params = [];
  for (const g of grants) {
    if (g.scope_type === SCOPE_TYPES.COMPANY) { clauses.push(`${alias}.${companyColumn}=?`); params.push(g.company_id); }
    if (g.scope_type === SCOPE_TYPES.DEPARTMENT) {
      if (g.company_id != null) { clauses.push(`(${alias}.${departmentColumn}=? AND ${alias}.${companyColumn}=?)`); params.push(g.department_id, g.company_id); }
      else { clauses.push(`${alias}.${departmentColumn}=?`); params.push(g.department_id); }
    }
  }
  return { sql: clauses.length ? `(${clauses.join(' OR ')})` : '0=1', params, grants };
}
function validateGrantScope(data) {
  if (!Object.values(SCOPE_TYPES).includes(data.scope_type)) throw appError('Invalid scope_type', 400, 'VALIDATION_ERROR');
  if (data.scope_type === SCOPE_TYPES.COMPANY && !data.company_id) throw appError('company_id is required for COMPANY scope', 400, 'VALIDATION_ERROR');
  if (data.scope_type === SCOPE_TYPES.DEPARTMENT && !data.department_id) throw appError('department_id is required for DEPARTMENT scope', 400, 'VALIDATION_ERROR');
}
async function grantPermission(actorId, data) {
  validateGrantScope(data);
  const permission = await PermissionModel.getPermissionByCode(data.permission_code);
  if (!permission) throw appError('Permission code not found', 404, 'PERMISSION_NOT_FOUND');
  if (data.scope_type === SCOPE_TYPES.GLOBAL) await assertGlobal(actorId, 'PERMISSION_MANAGE');
  else await assertScope(actorId, 'PERMISSION_MANAGE', data.company_id || null, data.department_id || null);
  const existing = (await PermissionModel.getUserGrants(data.user_id, data.permission_code)).find((g) => g.scope_type === data.scope_type && String(g.company_id||'') === String(data.company_id||'') && Number(g.department_id||0) === Number(data.department_id||0));
  if (existing) return existing;
  const id = await PermissionModel.grant({ ...data, permission_id: permission.id, granted_by: actorId });
  return PermissionModel.getGrantById(id);
}
async function revokePermission(actorId, id) {
  const grant = await PermissionModel.getGrantById(id);
  if (!grant) throw appError('Permission grant not found', 404, 'PERMISSION_GRANT_NOT_FOUND');
  if (grant.scope_type === SCOPE_TYPES.GLOBAL) await assertGlobal(actorId, 'PERMISSION_MANAGE');
  else await assertScope(actorId, 'PERMISSION_MANAGE', grant.company_id, grant.department_id);
  await PermissionModel.revoke(id);
  return grant;
}

async function listManageableUserPermissions(actorId,targetUserId){
  const actor=await assertAny(actorId,'PERMISSION_MANAGE');
  const target=await PermissionModel.getUserGrants(targetUserId);
  return target.filter((grant)=>actor.some((a)=>{
    if(a.scope_type==='GLOBAL')return true;
    if(grant.scope_type==='GLOBAL')return false;
    return matchesScope(a,grant.company_id,grant.department_id);
  }));
}
module.exports = { listManageableUserPermissions, getGrants, assertAny, assertScope, assertGlobal, buildScopeSql, matchesScope, grantPermission, revokePermission, listPermissions: PermissionModel.listPermissions, listUserPermissions: PermissionModel.getUserGrants };
