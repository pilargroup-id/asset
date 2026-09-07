const mysql = require('mysql2/promise');
const config = require('../src/config');

function parseUserIds() {
  const raw = String(process.env.BOOTSTRAP_ADMIN_USER_IDS || '').trim();
  if (!raw) throw new Error('BOOTSTRAP_ADMIN_USER_IDS is required');

  const ids = [...new Set(raw.split(',').map((value) => value.trim()).filter(Boolean))];
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const invalid = ids.filter((id) => !uuidPattern.test(id));
  if (invalid.length) throw new Error(`BOOTSTRAP_ADMIN_USER_IDS contains invalid UUID(s): ${invalid.join(', ')}`);
  return ids;
}

async function main() {
  const userIds = parseUserIds();
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  });

  try {
    const [permissions] = await conn.query('SELECT id FROM master_permissions WHERE is_active=1');

    for (const userId of userIds) {
      let granted = 0;
      for (const permission of permissions) {
        const [existing] = await conn.query(
          `SELECT id FROM user_permissions
           WHERE user_id=? AND permission_id=? AND scope_type='GLOBAL' LIMIT 1`,
          [userId, permission.id]
        );
        if (existing.length) continue;

        await conn.query(
          `INSERT INTO user_permissions (user_id,permission_id,scope_type,granted_by)
           VALUES (?,?,'GLOBAL',?)`,
          [userId, permission.id, null]
        );
        granted += 1;
      }
      console.log(`Bootstrap user ${userId}: ${granted} new GLOBAL permission grant(s)`);
    }

    console.log(`Bootstrap complete for ${userIds.length} user(s); ${permissions.length} active permission(s) available`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
