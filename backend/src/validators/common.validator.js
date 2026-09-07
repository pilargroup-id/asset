const { appError } = require('../utils/app-error.util');
function requireFields(payload, fields) {
  const missing = fields.filter((field) => payload?.[field] === undefined || payload?.[field] === null || payload?.[field] === '');
  if (missing.length) throw appError('Validation failed', 400, 'VALIDATION_ERROR', { missing_fields: missing });
}
function ensureEnum(value, allowed, field) {
  if (value !== undefined && value !== null && !Object.values(allowed).includes(value)) {
    throw appError(`Invalid ${field}`, 400, 'VALIDATION_ERROR', { field, allowed: Object.values(allowed) });
  }
}
module.exports = { requireFields, ensureEnum };
