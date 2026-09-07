const PermissionService = require('../services/permission.service');
const R = require('../utils/response.util');

function requirePermission(permissionCode) {
  return async function permissionMiddleware(req, res, next) {
    try {
      await PermissionService.assertAny(req.user, permissionCode);
      return next();
    } catch (error) {
      if (error.statusCode === 403) {
        return R.forbidden(res, error.message, { code: error.code || 'PERMISSION_FORBIDDEN', permission: permissionCode });
      }
      return next(error);
    }
  };
}

module.exports = { requirePermission };
