const PermissionService = require('../services/permission.service');
const R = require('../utils/response.util');
function requirePermission(permissionCode) {
  return async function permissionMiddleware(req, res, next) {
    try { await PermissionService.assertAny(req.user.id, permissionCode); return next(); }
    catch (err) {
      if (err.statusCode === 403) return R.forbidden(res, err.message, { code: err.code || 'PERMISSION_FORBIDDEN', permission: permissionCode });
      return next(err);
    }
  };
}
module.exports = { requirePermission };
