const PermissionModel = require('../models/permission.model');
const { appError } = require('../utils/app-error.util');
const { SCOPE_TYPES, PERMISSION_SUBJECT_TYPES } = require('../constants/domain.constants');

function requireUserContext(user) {
  if (!user || !user.id) throw appError('Authenticated user context is required', 401, 'AUTH_CONTEXT_REQUIRED');
  return user;
}

function matchesScope(assignment, companyId, departmentId) {
  if (assignment.access_scope_type === SCOPE_TYPES.GLOBAL) return true;
  if (assignment.access_scope_type === SCOPE_TYPES.COMPANY) {
    return companyId != null && String(assignment.access_scope_id) === String(companyId);
  }
  if (assignment.access_scope_type === SCOPE_TYPES.DEPARTMENT) {
    return departmentId != null && Number(assignment.access_scope_id) === Number(departmentId);
  }
  return false;
}

async function getGrants(user, permissionCode, conn) {
  return PermissionModel.getMatchingAssignments(requireUserContext(user), permissionCode, conn);
}

async function assertAny(user, permissionCode, conn) {
  const grants = await getGrants(user, permissionCode, conn);
  if (!grants.length) throw appError(`Permission ${permissionCode} is required`, 403, 'PERMISSION_FORBIDDEN');
  return grants;
}

async function assertScope(user, permissionCode, companyId, departmentId, conn) {
  const grants = await assertAny(user, permissionCode, conn);
  if (!grants.some((grant) => matchesScope(grant, companyId, departmentId))) {
    throw appError('Permission scope does not allow this operation', 403, 'PERMISSION_SCOPE_FORBIDDEN');
  }
  return grants;
}

async function assertGlobal(user, permissionCode, conn) {
  const grants = await assertAny(user, permissionCode, conn);
  if (!grants.some((grant) => grant.access_scope_type === SCOPE_TYPES.GLOBAL)) {
    throw appError('GLOBAL access scope is required', 403, 'GLOBAL_SCOPE_REQUIRED');
  }
  return grants;
}

async function buildScopeSql(user, permissionCode, alias = 't', departmentColumn = 'managing_department_id', companyColumn = 'company_id', conn) {
  const grants = await assertAny(user, permissionCode, conn);
  if (grants.some((grant) => grant.access_scope_type === SCOPE_TYPES.GLOBAL)) {
    return { sql: '1=1', params: [], grants };
  }

  const companyIds = [...new Set(grants.filter((g) => g.access_scope_type === SCOPE_TYPES.COMPANY).map((g) => String(g.access_scope_id)))];
  const departmentIds = [...new Set(grants.filter((g) => g.access_scope_type === SCOPE_TYPES.DEPARTMENT).map((g) => String(g.access_scope_id)))];
  const clauses = [];
  const params = [];

  if (companyIds.length) {
    clauses.push(`${alias}.${companyColumn} IN (${companyIds.map(() => '?').join(',')})`);
    params.push(...companyIds);
  }
  if (departmentIds.length) {
    clauses.push(`${alias}.${departmentColumn} IN (${departmentIds.map(() => '?').join(',')})`);
    params.push(...departmentIds.map(Number));
  }

  return { sql: clauses.length ? `(${clauses.join(' OR ')})` : '0=1', params, grants };
}

function validateAssignment(data) {
  if (!Object.values(PERMISSION_SUBJECT_TYPES).includes(data.subject_type)) {
    throw appError('Invalid subject_type', 400, 'VALIDATION_ERROR');
  }
  if (!data.subject_id && data.subject_id !== 0) throw appError('subject_id is required', 400, 'VALIDATION_ERROR');
  if (!Object.values(SCOPE_TYPES).includes(data.access_scope_type)) {
    throw appError('Invalid access_scope_type', 400, 'VALIDATION_ERROR');
  }

  const subjectId = String(data.subject_id).trim();
  if (!subjectId) throw appError('subject_id is required', 400, 'VALIDATION_ERROR');
  if (data.subject_type === PERMISSION_SUBJECT_TYPES.USER) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(subjectId)) throw appError('USER subject_id must be a PilarGroup user UUID', 400, 'VALIDATION_ERROR');
  }
  if (data.subject_type === PERMISSION_SUBJECT_TYPES.DEPARTMENT && (!/^\d+$/.test(subjectId) || Number(subjectId) <= 0)) {
    throw appError('DEPARTMENT subject_id must be a positive department id', 400, 'VALIDATION_ERROR');
  }

  if (data.access_scope_type === SCOPE_TYPES.GLOBAL) {
    data.access_scope_id = '';
  } else {
    const scopeId = String(data.access_scope_id ?? '').trim();
    if (!scopeId) throw appError('access_scope_id is required for COMPANY/DEPARTMENT access scope', 400, 'VALIDATION_ERROR');
    if (data.access_scope_type === SCOPE_TYPES.DEPARTMENT && (!/^\d+$/.test(scopeId) || Number(scopeId) <= 0)) {
      throw appError('DEPARTMENT access_scope_id must be a positive department id', 400, 'VALIDATION_ERROR');
    }
    data.access_scope_id = scopeId;
  }
  data.subject_id = subjectId;
}

function assignmentTarget(assignment) {
  if (assignment.access_scope_type === SCOPE_TYPES.GLOBAL) return { companyId: null, departmentId: null };
  if (assignment.access_scope_type === SCOPE_TYPES.COMPANY) return { companyId: assignment.access_scope_id, departmentId: null };
  return { companyId: null, departmentId: assignment.access_scope_id };
}

async function assertCanManageAssignment(actor, assignment, conn) {
  if (assignment.access_scope_type === SCOPE_TYPES.GLOBAL) return assertGlobal(actor, 'PERMISSION_MANAGE', conn);
  const target = assignmentTarget(assignment);
  return assertScope(actor, 'PERMISSION_MANAGE', target.companyId, target.departmentId, conn);
}

async function grantPermission(actor, payload) {
  const data = { ...payload };
  validateAssignment(data);
  const permission = await PermissionModel.getPermissionByCode(data.permission_code);
  if (!permission) throw appError('Permission code not found', 404, 'PERMISSION_NOT_FOUND');
  await assertCanManageAssignment(actor, data);

  const normalized = {
    ...data,
    permission_id: permission.id,
    access_scope_id: String(data.access_scope_id || ''),
  };
  const existing = await PermissionModel.findExact(normalized);
  if (existing && Number(existing.is_active)) return existing;

  await PermissionModel.createAssignment({ ...normalized, created_by: actor.id });
  return PermissionModel.findExact(normalized);
}

async function revokePermission(actor, id) {
  const assignment = await PermissionModel.getAssignmentById(id);
  if (!assignment || !Number(assignment.is_active)) throw appError('Permission assignment not found', 404, 'PERMISSION_ASSIGNMENT_NOT_FOUND');
  await assertCanManageAssignment(actor, assignment);
  await PermissionModel.revoke(id, actor.id);
  return assignment;
}

async function listManageableAssignments(actor, filters = {}) {
  const actorGrants = await assertAny(actor, 'PERMISSION_MANAGE');
  const rows = await PermissionModel.listAssignments(filters);
  if (actorGrants.some((grant) => grant.access_scope_type === SCOPE_TYPES.GLOBAL)) return rows;
  return rows.filter((row) => {
    if (row.access_scope_type === SCOPE_TYPES.GLOBAL) return false;
    const target = assignmentTarget(row);
    return actorGrants.some((grant) => matchesScope(grant, target.companyId, target.departmentId));
  });
}

async function effectivePermissions(user) {
  const rows = await PermissionModel.getMatchingAssignments(requireUserContext(user));
  const byCode = new Map();
  for (const row of rows) {
    if (!byCode.has(row.permission_code)) byCode.set(row.permission_code, { permission_code: row.permission_code, global: false, companies: new Set(), departments: new Set(), sources: [] });
    const current = byCode.get(row.permission_code);
    current.sources.push({ assignment_id: row.id, subject_type: row.subject_type, subject_id: row.subject_id, access_scope_type: row.access_scope_type, access_scope_id: row.access_scope_id || null });
    if (row.access_scope_type === SCOPE_TYPES.GLOBAL) current.global = true;
    if (row.access_scope_type === SCOPE_TYPES.COMPANY) current.companies.add(String(row.access_scope_id));
    if (row.access_scope_type === SCOPE_TYPES.DEPARTMENT) current.departments.add(Number(row.access_scope_id));
  }
  return [...byCode.values()].map((item) => ({ permission_code: item.permission_code, global: item.global, companies: [...item.companies], departments: [...item.departments], sources: item.sources }));
}

module.exports = {
  getGrants,
  assertAny,
  assertScope,
  assertGlobal,
  buildScopeSql,
  matchesScope,
  validateAssignment,
  grantPermission,
  revokePermission,
  listManageableAssignments,
  effectivePermissions,
  listPermissions: PermissionModel.listPermissions,
};
