const R = require('../utils/response.util');
const ActivityLog = require('../services/activity-log.service');
const { sanitize } = require('../utils/sanitize.util');

function notFound(req, res) {
  return R.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
}

function deriveModule(req) {
  const parts = String(req.originalUrl || '').split('?')[0].split('/').filter(Boolean);
  return String(parts[1] || 'SYSTEM').replace(/-/g, '_').toUpperCase();
}

async function logFailedMutation(err, req) {
  if (!req?.user?.id) return;
  const method = String(req.method || '').toUpperCase();
  const shouldAudit = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || String(req.originalUrl || '').startsWith('/api/export/');
  if (!shouldAudit || String(req.originalUrl || '').startsWith('/api/auth')) return;
  try {
    await ActivityLog.log(req, {
      module: deriveModule(req),
      action: 'REQUEST_FAILED',
      description: `${method} ${req.originalUrl} failed`,
      new_values: sanitize(req.body || null),
      status: 'FAILED',
      error_message: err?.message || 'Request failed',
    });
  } catch (auditErr) {
    console.error('[activity-log] failed to record request failure:', auditErr.message);
  }
}

async function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  await logFailedMutation(err, req);

  if (err?.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Import file exceeds the configured size limit' : err.message;
    const code = err.code === 'LIMIT_FILE_SIZE' ? 'IMPORT_FILE_TOO_LARGE' : 'IMPORT_UPLOAD_ERROR';
    return R.badRequest(res, message, { code });
  }
  if (err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062) {
    return R.badRequest(res, 'Data already exists', { code: 'DUPLICATE_ENTRY' });
  }
  if (err?.statusCode === 400) return R.badRequest(res, err.message, err.errors || { code: err.code || 'BAD_REQUEST' });
  if (err?.statusCode === 401) return R.unauthorized(res, err.message, { code: err.code || 'UNAUTHORIZED' });
  if (err?.statusCode === 403) return R.forbidden(res, err.message, { code: err.code || 'FORBIDDEN' });
  if (err?.statusCode && err.statusCode >= 400 && err.statusCode < 600) return R.error(res, err.message || 'Request failed', err.statusCode, { code: err.code || 'REQUEST_FAILED' });

  console.error(err);
  return R.error(res, 'Internal Server Error', 500, { code: 'INTERNAL_SERVER_ERROR' });
}

module.exports = { notFound, errorHandler };
