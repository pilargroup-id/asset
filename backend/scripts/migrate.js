const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../src/config');
async function main() {
  if (!config.db.name) throw new Error('DB_NAME is required');
  const conn = await mysql.createConnection({ host: config.db.host, port: config.db.port, user: config.db.user, password: config.db.password, database: config.db.name, multipleStatements: true, timezone: '+07:00' });
  await conn.query('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(255) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)');
  const dir = path.resolve('database/migrations');
  const files = fs.readdirSync(dir).filter((name) => name.endsWith('.sql')).sort();
  for (const name of files) {
    const [rows] = await conn.query('SELECT name FROM schema_migrations WHERE name=? LIMIT 1', [name]);
    if (rows.length) continue;
    const sql = fs.readFileSync(path.join(dir, name), 'utf8');
    await conn.beginTransaction();
    try {
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [name]);
      await conn.commit();
      console.log(`[migration] applied ${name}`);
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  }
  await conn.end();
}
main().catch((err) => { console.error(err); process.exit(1); });
