const { requireDb } = require('../utils/db.util');
async function insert(data, conn = requireDb()) {
  const [result] = await conn.query(`INSERT INTO activity_logs
    (user_id,username_snapshot,user_name_snapshot,department_id_snapshot,department_name_snapshot,company_id_snapshot,company_name_snapshot,module,action,source,correlation_id,entity_type,entity_id,entity_reference,entity_name_snapshot,description,old_values,new_values,ip_address,user_agent,request_method,request_path,status,error_message)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
    data.user_id||null,data.username_snapshot||null,data.user_name_snapshot||null,data.department_id_snapshot||null,data.department_name_snapshot||null,data.company_id_snapshot||null,data.company_name_snapshot||null,
    data.module,data.action,data.source||'APPLICATION',data.correlation_id||null,data.entity_type||null,data.entity_id||null,data.entity_reference||null,data.entity_name_snapshot||null,data.description||null,
    data.old_values ? JSON.stringify(data.old_values) : null,data.new_values ? JSON.stringify(data.new_values) : null,data.ip_address||null,data.user_agent||null,data.request_method||null,data.request_path||null,data.status||'SUCCESS',data.error_message||null
  ]);
  return result.insertId;
}
module.exports = { insert };
