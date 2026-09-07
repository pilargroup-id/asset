const crypto = require('crypto');
const config = require('../config');
const R = require('../utils/response.util');

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

function requireInternalApi(req, res, next) {
  const configured = String(config.internalApi.secret || '');
  if (!configured) return R.error(res, 'Internal API is not configured', 503, { code: 'INTERNAL_API_NOT_CONFIGURED' });
  const provided = req.get('X-Internal-Secret');
  if (!safeEqual(provided, configured)) return R.forbidden(res, 'Invalid internal API secret', { code: 'INTERNAL_API_FORBIDDEN' });
  return next();
}

module.exports = { requireInternalApi };
