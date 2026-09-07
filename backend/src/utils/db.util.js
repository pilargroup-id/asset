const { db } = require('../config/database.config');
const { appError } = require('./app-error.util');
function requireDb() {
  if (!db) throw appError('Project database is not configured', 503, 'DATABASE_NOT_CONFIGURED');
  return db;
}
async function withTransaction(work) {
  const pool = requireDb();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
module.exports = { requireDb, withTransaction };
