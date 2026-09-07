const { requireDb } = require('../utils/db.util');

function subjectIds(user) {
  const userIds = user?.id ? [String(user.id)] : [];
  const departmentIds = [...new Set([
    ...(Array.isArray(user?.departments) ? user.departments.map((row) => row?.id ?? row?.department_id) : []),
    user?.department_id,
    user?.context_department_id,
  ].filter((value) => value !== undefined && value !== null && value !== '').map(String))];
  const companyIds = [...new Set([
    ...(Array.isArray(user?.companies) ? user.companies.map((row) => row?.id) : []),
    user?.company_id,
  ].filter((value) => value !== undefined && value !== null && value !== '').map(String))];
  return { userIds, departmentIds, companyIds };
}

async function getPermissionByCode(code, conn = requireDb()) {
  const [rows] = await conn.query('SELECT * FROM master_permissions WHERE code=? AND is_active=1 LIMIT 1', [code]);
  return rows[0] || null;
}

async function getMatchingAssignments(user, permissionCode = null, conn = requireDb()) {
  const ids = subjectIds(user);
  const clauses = [];
  const params = [];

  if (ids.userIds.length) {
    clauses.push(`(pa.subject_type='USER' AND pa.subject_id IN (${ids.userIds.map(() => '?').join(',')}))`);
    params.push(...ids.userIds);
  }
  if (ids.departmentIds.length) {
    clauses.push(`(pa.subject_type='DEPARTMENT' AND pa.subject_id IN (${ids.departmentIds.map(() => '?').join(',')}))`);
    params.push(...ids.departmentIds);
  }
  if (ids.companyIds.length) {
    clauses.push(`(pa.subject_type='COMPANY' AND pa.subject_id IN (${ids.companyIds.map(() => '?').join(',')}))`);
    params.push(...ids.companyIds);
  }

  if (!clauses.length) return [];

  let sql = `SELECT pa.*, mp.code permission_code, mp.name permission_name
             FROM permission_assignments pa
             JOIN master_permissions mp ON mp.id=pa.permission_id
             WHERE pa.is_active=1 AND mp.is_active=1 AND (${clauses.join(' OR ')})`;
  if (permissionCode) {
    sql += ' AND mp.code=?';
    params.push(permissionCode);
  }
  sql += ' ORDER BY mp.code, pa.access_scope_type, pa.access_scope_id, pa.subject_type, pa.subject_id';
  const [rows] = await conn.query(sql, params);
  return rows;
}

async function listPermissions(conn = requireDb()) {
  const [rows] = await conn.query('SELECT * FROM master_permissions WHERE is_active=1 ORDER BY code');
  return rows;
}

async function listAssignments(filters = {}, conn = requireDb()) {
  const where = ['pa.is_active=1', 'mp.is_active=1'];
  const params = [];
  if (filters.subject_type) { where.push('pa.subject_type=?'); params.push(filters.subject_type); }
  if (filters.subject_id) { where.push('pa.subject_id=?'); params.push(String(filters.subject_id)); }
  if (filters.permission_code) { where.push('mp.code=?'); params.push(filters.permission_code); }
  if (filters.access_scope_type) { where.push('pa.access_scope_type=?'); params.push(filters.access_scope_type); }
  if (filters.access_scope_id !== undefined && filters.access_scope_id !== null && filters.access_scope_id !== '') {
    where.push('pa.access_scope_id=?'); params.push(String(filters.access_scope_id));
  }
  const [rows] = await conn.query(`SELECT pa.*,mp.code permission_code,mp.name permission_name
    FROM permission_assignments pa JOIN master_permissions mp ON mp.id=pa.permission_id
    WHERE ${where.join(' AND ')} ORDER BY mp.code,pa.subject_type,pa.subject_id,pa.access_scope_type,pa.access_scope_id`, params);
  return rows;
}

async function findExact(data, conn = requireDb()) {
  const [rows] = await conn.query(`SELECT pa.*,mp.code permission_code,mp.name permission_name
    FROM permission_assignments pa JOIN master_permissions mp ON mp.id=pa.permission_id
    WHERE pa.permission_id=? AND pa.subject_type=? AND pa.subject_id=? AND pa.access_scope_type=? AND pa.access_scope_id=?
    LIMIT 1`, [data.permission_id, data.subject_type, String(data.subject_id), data.access_scope_type, String(data.access_scope_id || '')]);
  return rows[0] || null;
}

async function createAssignment(data, conn = requireDb()) {
  const [result] = await conn.query(`INSERT INTO permission_assignments
    (permission_id,subject_type,subject_id,access_scope_type,access_scope_id,is_active,created_by,updated_by)
    VALUES (?,?,?,?,?,1,?,?)
    ON DUPLICATE KEY UPDATE is_active=1,updated_by=VALUES(updated_by),updated_at=CURRENT_TIMESTAMP`, [
    data.permission_id,
    data.subject_type,
    String(data.subject_id),
    data.access_scope_type,
    String(data.access_scope_id || ''),
    data.created_by || null,
    data.created_by || null,
  ]);
  return result.insertId;
}

async function revoke(id, actorId, conn = requireDb()) {
  const [result] = await conn.query('UPDATE permission_assignments SET is_active=0,updated_by=? WHERE id=? AND is_active=1', [actorId || null, id]);
  return result.affectedRows;
}

async function getAssignmentById(id, conn = requireDb()) {
  const [rows] = await conn.query(`SELECT pa.*,mp.code permission_code,mp.name permission_name
    FROM permission_assignments pa JOIN master_permissions mp ON mp.id=pa.permission_id WHERE pa.id=? LIMIT 1`, [id]);
  return rows[0] || null;
}

module.exports = {
  subjectIds,
  getPermissionByCode,
  getMatchingAssignments,
  listPermissions,
  listAssignments,
  findExact,
  createAssignment,
  revoke,
  getAssignmentById,
};
