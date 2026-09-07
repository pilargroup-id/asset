const R = require('../utils/response.util');
const PermissionService = require('../services/permission.service');
const ActivityLog = require('../services/activity-log.service');
const { ACTIVITY_ACTIONS } = require('../constants/activity.constants');

async function listPermissions(req, res, next) {
  try { return R.ok(res, await PermissionService.listPermissions(), 'Permissions loaded'); } catch (error) { return next(error); }
}

async function listAssignments(req, res, next) {
  try { return R.ok(res, await PermissionService.listManageableAssignments(req.user, req.query), 'Permission assignments loaded'); } catch (error) { return next(error); }
}

async function effective(req, res, next) {
  try { return R.ok(res, await PermissionService.effectivePermissions(req.user), 'Effective permissions loaded'); } catch (error) { return next(error); }
}

async function grant(req, res, next) {
  try {
    const row = await PermissionService.grantPermission(req.user, req.body);
    await ActivityLog.log(req, {
      module: 'PERMISSION', action: ACTIVITY_ACTIONS.PERMISSION_GRANT,
      entity_type: 'PERMISSION_ASSIGNMENT', entity_id: row.id,
      entity_reference: `${row.subject_type}:${row.subject_id}`,
      new_values: row,
      description: `Granted ${row.permission_code} to ${row.subject_type} ${row.subject_id}`,
    });
    return R.created(res, row, 'Permission assignment created');
  } catch (error) { return next(error); }
}

async function revoke(req, res, next) {
  try {
    const row = await PermissionService.revokePermission(req.user, req.params.id);
    await ActivityLog.log(req, {
      module: 'PERMISSION', action: ACTIVITY_ACTIONS.PERMISSION_REVOKE,
      entity_type: 'PERMISSION_ASSIGNMENT', entity_id: row.id,
      entity_reference: `${row.subject_type}:${row.subject_id}`,
      old_values: row,
      description: `Revoked ${row.permission_code} from ${row.subject_type} ${row.subject_id}`,
    });
    return R.ok(res, row, 'Permission assignment revoked');
  } catch (error) { return next(error); }
}

module.exports = { listPermissions, listAssignments, effective, grant, revoke };
