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
  const conn = await mysql.createConnection({ host: config.db.host, port: config.db.port, user: config.db.user, password: config.db.password, database: config.db.name });
  try {
    const [permissions] = await conn.query('SELECT id FROM master_permissions WHERE is_active=1');
    for (const userId of userIds) {
      let granted = 0;
      for (const permission of permissions) {
        const [existing] = await conn.query(`SELECT id,is_active FROM permission_assignments
          WHERE permission_id=? AND subject_type='USER' AND subject_id=? AND access_scope_type='GLOBAL' AND access_scope_id='' LIMIT 1`, [permission.id, userId]);
        if (existing.length && Number(existing[0].is_active)) continue;
        await conn.query(`INSERT INTO permission_assignments
          (permission_id,subject_type,subject_id,access_scope_type,access_scope_id,is_active,created_by,updated_by)
          VALUES (?,'USER',?,'GLOBAL','',1,NULL,NULL)
          ON DUPLICATE KEY UPDATE is_active=1,updated_at=CURRENT_TIMESTAMP`, [permission.id, userId]);
        granted += 1;
      }
      console.log(`Bootstrap user ${userId}: ${granted} new GLOBAL permission assignment(s)`);
    }
    console.log(`Bootstrap complete for ${userIds.length} user(s); ${permissions.length} active permission(s) available`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => { console.error(error.message); process.exit(1); });
