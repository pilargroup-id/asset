const config = require('../config');
const { appError } = require('../utils/app-error.util');
function extractData(body) { return body && typeof body === 'object' && body.data !== undefined ? body.data : body; }
async function request(pathname, query = {}) {
  if (!config.directory.internalSecret) throw appError('INTERNAL_SYNC_SECRET is not configured', 503, 'DIRECTORY_SECRET_NOT_CONFIGURED');
  const qs = new URLSearchParams(); Object.entries(query).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k,String(v)); });
  const url = `${config.auth.pilargroupUrl}${config.directory.basePath}${pathname}${qs.size ? `?${qs.toString()}` : ''}`;
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), config.directory.timeoutMs);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json', 'X-Internal-Secret': config.directory.internalSecret }, signal: controller.signal });
    let body = null; try { body = await response.json(); } catch (_) { body = null; }
    if (!response.ok) throw appError(body?.message || 'Central directory request failed', response.status || 502, 'DIRECTORY_UPSTREAM_ERROR');
    return extractData(body);
  } catch (err) {
    if (err.name === 'AbortError') throw appError('Central directory timeout', 504, 'DIRECTORY_TIMEOUT');
    throw err;
  } finally { clearTimeout(timeout); }
}
module.exports = { users: (q) => request('/users',q), departments: (q) => request('/departments',q), companies: (q) => request('/companies',q), request };
