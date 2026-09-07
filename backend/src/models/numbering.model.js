const { requireDb } = require('../utils/db.util');
async function list(whereSql='1=1',params=[],conn=requireDb()) { const [r]=await conn.query(`SELECT * FROM numbering_configs n WHERE ${whereSql} ORDER BY managing_department_id,sequence_type,id`,params); return r; }
async function findActive(departmentId, companyId, sequenceType, conn=requireDb(), forUpdate=false) {
  let sql=`SELECT * FROM numbering_configs WHERE managing_department_id=? AND sequence_type=? AND is_active=1 AND (company_id=? OR company_id IS NULL) ORDER BY (company_id IS NOT NULL) DESC,id DESC LIMIT 1`;
  if (forUpdate) sql+=' FOR UPDATE';
  const [r]=await conn.query(sql,[departmentId,sequenceType,companyId||null]); return r[0]||null;
}
async function create(data, conn=requireDb()) { const [r]=await conn.query(`INSERT INTO numbering_configs (managing_department_id,company_id,sequence_type,name,prefix,company_token,department_token,pattern,sequence_length,starting_sequence,current_sequence,reset_period,is_active,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[data.managing_department_id,data.company_id||null,data.sequence_type,data.name,data.prefix||null,data.company_token||null,data.department_token||null,data.pattern,data.sequence_length||6,data.starting_sequence||1,Number(data.starting_sequence||1)-1,data.reset_period||'NEVER',data.is_active===false?0:1,data.created_by||null]); return r.insertId; }
async function updateSequence(id,currentSequence,lastResetKey,conn=requireDb()){ await conn.query('UPDATE numbering_configs SET current_sequence=?,last_reset_key=? WHERE id=?',[currentSequence,lastResetKey,id]); }
async function update(id,data,conn=requireDb()){ const fields=['name','prefix','company_token','department_token','pattern','sequence_length','starting_sequence','reset_period','is_active']; const set=[]; const p=[]; for(const f of fields){if(data[f]!==undefined){set.push(`${f}=?`);p.push(data[f]);}} if(!set.length)return; p.push(id); await conn.query(`UPDATE numbering_configs SET ${set.join(',')} WHERE id=?`,p); }
async function get(id,conn=requireDb()){const [r]=await conn.query('SELECT * FROM numbering_configs WHERE id=?',[id]);return r[0]||null;}
module.exports={list,findActive,create,updateSequence,update,get};
