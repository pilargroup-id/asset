const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../src/config');
async function main() {
  const conn = await mysql.createConnection({ host: config.db.host, port: config.db.port, user: config.db.user, password: config.db.password, database: config.db.name, multipleStatements: true, timezone: '+07:00' });
  const dir = path.resolve('database/seeds');
  const files = fs.readdirSync(dir).filter((name) => name.endsWith('.sql')).sort();
  for (const name of files) {
    await conn.query(fs.readFileSync(path.join(dir, name), 'utf8'));
    console.log(`[seed] applied ${name}`);
  }
  await conn.end();
}
main().catch((err) => { console.error(err); process.exit(1); });
