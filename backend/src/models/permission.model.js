const { requireDb } = require('../utils/db.util');
async function getPermissionByCode(code, conn = requireDb()) {
  const [rows] = await conn.query('SELECT * FROM master_permissions WHERE code=? AND is_active=1 LIMIT 1', [code]);
  return rows[0] || null;
}
async function getUserGrants(userId, permissionCode = null, conn = requireDb()) {
  const params = [userId];
  let sql = `SELECT up.*, mp.code permission_code, mp.name permission_name
             FROM user_permissions up JOIN master_permissions mp ON mp.id=up.permission_id
             WHERE up.user_id=? AND mp.is_active=1`;
  if (permissionCode) { sql += ' AND mp.code=?'; params.push(permissionCode); }
  sql += ' ORDER BY mp.code, up.scope_type, up.company_id, up.department_id';
  const [rows] = await conn.query(sql, params);
  return rows;
}
async function listPermissions(conn = requireDb()) {
  const [rows] = await conn.query('SELECT * FROM master_permissions WHERE is_active=1 ORDER BY code');
  return rows;
}
async function grant(data, conn = requireDb()) {
  const [result] = await conn.query(`INSERT INTO user_permissions (user_id,permission_id,scope_type,company_id,department_id,granted_by) VALUES (?,?,?,?,?,?)`, [data.user_id,data.permission_id,data.scope_type,data.company_id||null,data.department_id||null,data.granted_by||null]);
  return result.insertId;
}
async function revoke(id, conn = requireDb()) {
  const [result] = await conn.query('DELETE FROM user_permissions WHERE id=?', [id]);
  return result.affectedRows;
}
async function getGrantById(id, conn = requireDb()) {
  const [rows] = await conn.query(`SELECT up.*, mp.code permission_code FROM user_permissions up JOIN master_permissions mp ON mp.id=up.permission_id WHERE up.id=? LIMIT 1`, [id]);
  return rows[0] || null;
}
module.exports = { getPermissionByCode, getUserGrants, listPermissions, grant, revoke, getGrantById };
