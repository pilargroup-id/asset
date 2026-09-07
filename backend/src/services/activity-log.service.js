const ActivityLogModel = require('../models/activity-log.model');
const { userSnapshot } = require('../utils/user-snapshot.util');
const PermissionService = require('./permission.service');
const { requireDb } = require('../utils/db.util');
const { parsePagination, meta } = require('../utils/pagination.util');
function requestMeta(req) {
  return { ip_address: req?.ip || null, user_agent: req?.headers?.['user-agent'] || null, request_method: req?.method || null, request_path: req?.originalUrl || null };
}
async function log(req, event, conn) {
  return ActivityLogModel.insert({ ...userSnapshot(req?.user), ...requestMeta(req), ...event }, conn);
}
async function list(req) {
  const db = requireDb();
  const { page, limit, offset } = parsePagination(req.query);
  const scope = await PermissionService.buildScopeSql(req.user.id, 'ACTIVITY_LOG_VIEW', 'a', 'department_id_snapshot', 'company_id_snapshot');
  const where = [scope.sql]; const params = [...scope.params];
  if (req.query.module) { where.push('a.module=?'); params.push(req.query.module); }
  if (req.query.action) { where.push('a.action=?'); params.push(req.query.action); }
  if (req.query.user_id) { where.push('a.user_id=?'); params.push(req.query.user_id); }
  if (req.query.entity_type) { where.push('a.entity_type=?'); params.push(req.query.entity_type); }
  if (req.query.entity_id) { where.push('a.entity_id=?'); params.push(req.query.entity_id); }
  if (req.query.source) { where.push('a.source=?'); params.push(req.query.source); }
  if (req.query.correlation_id) { where.push('a.correlation_id=?'); params.push(req.query.correlation_id); }
  const sqlWhere = where.join(' AND ');
  const [[count]] = await db.query(`SELECT COUNT(*) total FROM activity_logs a WHERE ${sqlWhere}`, params);
  const [rows] = await db.query(`SELECT * FROM activity_logs a WHERE ${sqlWhere} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`, [...params,limit,offset]);
  return { rows, meta: meta(page, limit, count.total) };
}
module.exports = { log, list, requestMeta };
