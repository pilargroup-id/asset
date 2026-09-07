const { requireDb }=require('../utils/db.util');
async function list({whereSql='1=1',params=[],filters={},limit=25,offset=0},conn=requireDb()){
  const where=[whereSql]; const p=[...params];
  if(filters.status){where.push('a.status=?');p.push(filters.status);} if(filters.category_id){where.push('a.category_id=?');p.push(filters.category_id);} if(filters.location_id){where.push('a.current_location_id=?');p.push(filters.location_id);} if(filters.search){where.push('(a.asset_number LIKE ? OR a.asset_name LIKE ? OR a.serial_number LIKE ?)'); const q=`%${filters.search}%`;p.push(q,q,q);}
  const w=where.join(' AND ');
  const [[count]]=await conn.query(`SELECT COUNT(*) total FROM assets a WHERE ${w}`,p);
  const [rows]=await conn.query(`SELECT a.*,c.name category_name,c.is_depreciable,b.name brand_name,m.name model_name,l.name current_location_name,v.name vendor_name
    FROM assets a JOIN master_categories c ON c.id=a.category_id LEFT JOIN master_brands b ON b.id=a.brand_id LEFT JOIN master_models m ON m.id=a.model_id LEFT JOIN master_locations l ON l.id=a.current_location_id LEFT JOIN master_vendors v ON v.id=a.vendor_id
    WHERE ${w} ORDER BY a.id DESC LIMIT ? OFFSET ?`,[...p,limit,offset]);
  return {rows,total:count.total};
}
async function get(id,conn=requireDb(),forUpdate=false){ let sql=`SELECT a.*,c.name category_name,c.tracking_type,c.is_depreciable,b.name brand_name,m.name model_name,l.name current_location_name,v.name vendor_name FROM assets a JOIN master_categories c ON c.id=a.category_id LEFT JOIN master_brands b ON b.id=a.brand_id LEFT JOIN master_models m ON m.id=a.model_id LEFT JOIN master_locations l ON l.id=a.current_location_id LEFT JOIN master_vendors v ON v.id=a.vendor_id WHERE a.id=? LIMIT 1`; if(forUpdate)sql+=' FOR UPDATE'; const [r]=await conn.query(sql,[id]);return r[0]||null; }
async function create(data,conn=requireDb()){ const [r]=await conn.query(`INSERT INTO assets (asset_number,asset_name,category_id,brand_id,model_id,serial_number,managing_department_id,company_id,current_location_id,status,asset_condition,purchase_date,purchase_cost,vendor_id,warranty_until,notes,created_by,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[data.asset_number,data.asset_name,data.category_id,data.brand_id||null,data.model_id||null,data.serial_number||null,data.managing_department_id,data.company_id,data.current_location_id||null,data.status||'AVAILABLE',data.asset_condition||'GOOD',data.purchase_date||null,data.purchase_cost??null,data.vendor_id||null,data.warranty_until||null,data.notes||null,data.created_by||null,data.created_by||null]);return r.insertId; }
async function update(id,data,conn=requireDb()){ const fields=['asset_name','category_id','brand_id','model_id','serial_number','asset_condition','purchase_date','purchase_cost','vendor_id','warranty_until','notes','updated_by']; const set=[];const p=[];for(const f of fields){if(data[f]!==undefined){set.push(`${f}=?`);p.push(data[f]);}}if(set.length){p.push(id);await conn.query(`UPDATE assets SET ${set.join(',')} WHERE id=?`,p);} }
async function setState(id,state,conn=requireDb()){const fields=['status','current_assignment_id','current_location_id','managing_department_id','company_id','asset_condition','updated_by'];const set=[];const p=[];for(const f of fields){if(state[f]!==undefined){set.push(`${f}=?`);p.push(state[f]);}}if(set.length){p.push(id);await conn.query(`UPDATE assets SET ${set.join(',')} WHERE id=?`,p);}}
async function saveAttributes(assetId,categoryId,attributes=[],conn=requireDb()){
  if(!Array.isArray(attributes))return;
  for(const item of attributes){
    const [defs]=await conn.query('SELECT * FROM master_category_attributes WHERE id=? AND category_id=? AND is_active=1 LIMIT 1',[item.attribute_id,categoryId]); if(!defs.length)throw Object.assign(new Error(`Attribute ${item.attribute_id} is invalid for category`),{statusCode:400,code:'INVALID_ASSET_ATTRIBUTE'});
    const d=defs[0]; const cols={value_text:null,value_number:null,value_date:null,value_boolean:null,value_json:null};
    if(d.data_type==='NUMBER')cols.value_number=item.value; else if(d.data_type==='DATE')cols.value_date=item.value; else if(d.data_type==='BOOLEAN')cols.value_boolean=item.value?1:0; else if(d.data_type==='JSON')cols.value_json=JSON.stringify(item.value); else cols.value_text=item.value==null?null:String(item.value);
    await conn.query(`INSERT INTO asset_attribute_values (asset_id,attribute_id,value_text,value_number,value_date,value_boolean,value_json) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE value_text=VALUES(value_text),value_number=VALUES(value_number),value_date=VALUES(value_date),value_boolean=VALUES(value_boolean),value_json=VALUES(value_json)`,[assetId,item.attribute_id,cols.value_text,cols.value_number,cols.value_date,cols.value_boolean,cols.value_json]);
  }
}
async function getAttributes(assetId,conn=requireDb()){const [r]=await conn.query(`SELECT av.*,ca.attribute_code,ca.attribute_name,ca.data_type FROM asset_attribute_values av JOIN master_category_attributes ca ON ca.id=av.attribute_id WHERE av.asset_id=? ORDER BY ca.sort_order,ca.id`,[assetId]);return r;}
async function createAssignment(data,conn=requireDb()){const [r]=await conn.query(`INSERT INTO asset_assignments (asset_id,assignment_type,assigned_user_id,assigned_user_name_snapshot,assigned_department_id,assigned_department_name_snapshot,assigned_location_id,assigned_location_name_snapshot,purpose,assigned_at,assigned_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,[data.asset_id,data.assignment_type,data.assigned_user_id||null,data.assigned_user_name_snapshot||null,data.assigned_department_id||null,data.assigned_department_name_snapshot||null,data.assigned_location_id||null,data.assigned_location_name_snapshot||null,data.purpose||null,data.assigned_at,data.assigned_by]);return r.insertId;}
async function getAssignment(id,conn=requireDb(),forUpdate=false){let sql='SELECT * FROM asset_assignments WHERE id=? LIMIT 1';if(forUpdate)sql+=' FOR UPDATE';const [r]=await conn.query(sql,[id]);return r[0]||null;}
async function closeAssignment(id,data,conn=requireDb()){await conn.query(`UPDATE asset_assignments SET returned_at=?,returned_by=?,return_condition=?,return_location_id=?,return_note=? WHERE id=? AND returned_at IS NULL`,[data.returned_at,data.returned_by,data.return_condition||null,data.return_location_id||null,data.return_note||null,id]);}
async function createTransfer(data,conn=requireDb()){const [r]=await conn.query(`INSERT INTO asset_transfers (asset_id,transfer_date,from_location_id,to_location_id,from_company_id,to_company_id,from_managing_department_id,to_managing_department_id,reason,notes,transferred_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,[data.asset_id,data.transfer_date,data.from_location_id||null,data.to_location_id||null,data.from_company_id||null,data.to_company_id||null,data.from_managing_department_id||null,data.to_managing_department_id||null,data.reason||null,data.notes||null,data.transferred_by]);return r.insertId;}
async function createMaintenance(data,conn=requireDb()){const [r]=await conn.query(`INSERT INTO asset_maintenances (asset_id,maintenance_type,vendor_id,start_date,cost,problem_description,status,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?)`,[data.asset_id,data.maintenance_type,data.vendor_id||null,data.start_date,data.cost??null,data.problem_description||null,data.status||'OPEN',data.notes||null,data.created_by]);return r.insertId;}
async function getMaintenance(id,conn=requireDb(),forUpdate=false){let sql='SELECT * FROM asset_maintenances WHERE id=? LIMIT 1';if(forUpdate)sql+=' FOR UPDATE';const [r]=await conn.query(sql,[id]);return r[0]||null;}
async function completeMaintenance(id,data,conn=requireDb()){await conn.query(`UPDATE asset_maintenances SET status='COMPLETED',completion_date=?,result=?,cost=COALESCE(?,cost),notes=COALESCE(?,notes),completed_by=? WHERE id=?`,[data.completion_date,data.result||null,data.cost??null,data.notes||null,data.completed_by,id]);}
async function addHistory(data,conn=requireDb()){const [r]=await conn.query(`INSERT INTO asset_history (asset_id,event_type,event_date,reference_type,reference_id,description,details,performed_by) VALUES (?,?,?,?,?,?,?,?)`,[data.asset_id,data.event_type,data.event_date,data.reference_type||null,data.reference_id||null,data.description||null,data.details?JSON.stringify(data.details):null,data.performed_by||null]);return r.insertId;}
async function history(assetId,conn=requireDb()){const [r]=await conn.query('SELECT * FROM asset_history WHERE asset_id=? ORDER BY event_date DESC,id DESC',[assetId]);return r;}
async function assignments(assetId,conn=requireDb()){const [r]=await conn.query('SELECT * FROM asset_assignments WHERE asset_id=? ORDER BY assigned_at DESC,id DESC',[assetId]);return r;}
async function transfers(assetId,conn=requireDb()){const [r]=await conn.query('SELECT * FROM asset_transfers WHERE asset_id=? ORDER BY transfer_date DESC,id DESC',[assetId]);return r;}
async function maintenances(assetId,conn=requireDb()){const [r]=await conn.query('SELECT am.*,v.name vendor_name FROM asset_maintenances am LEFT JOIN master_vendors v ON v.id=am.vendor_id WHERE am.asset_id=? ORDER BY am.start_date DESC,id DESC',[assetId]);return r;}

async function findCurrentAssetsByAssignedUser({userId,managingDepartmentId=null,companyId=null},conn=requireDb()){
  const where=["x.assignment_type='USER'","x.assigned_user_id=?","x.returned_at IS NULL","a.current_assignment_id=x.id"];
  const params=[String(userId)];
  if(managingDepartmentId!=null){where.push('a.managing_department_id=?');params.push(managingDepartmentId);}
  if(companyId!=null){where.push('a.company_id=?');params.push(String(companyId));}
  const [rows]=await conn.query(`SELECT a.id,a.asset_number,a.asset_name,a.serial_number,a.managing_department_id,a.company_id,a.current_location_id,a.status,a.asset_condition,
    c.id category_id,c.name category_name,b.name brand_name,m.name model_name,l.code current_location_code,l.name current_location_name,
    x.id assignment_id,x.assigned_user_id,x.assigned_user_name_snapshot,x.assigned_at,x.purpose assignment_purpose
    FROM assets a JOIN asset_assignments x ON x.id=a.current_assignment_id
    JOIN master_categories c ON c.id=a.category_id
    LEFT JOIN master_brands b ON b.id=a.brand_id LEFT JOIN master_models m ON m.id=a.model_id LEFT JOIN master_locations l ON l.id=a.current_location_id
    WHERE ${where.join(' AND ')} ORDER BY a.asset_number`,params);
  return rows;
}
async function findExternalReference(data,conn=requireDb()){
  const [rows]=await conn.query(`SELECT * FROM asset_external_references WHERE asset_id=? AND source_system=? AND reference_type=? AND reference_id=? LIMIT 1`,[data.asset_id,data.source_system,data.reference_type,data.reference_id]);
  return rows[0]||null;
}
async function createExternalReference(data,conn=requireDb()){
  const [result]=await conn.query(`INSERT INTO asset_external_references (asset_id,source_system,reference_type,reference_id,reference_number,linked_by_user_id) VALUES (?,?,?,?,?,?)`,[data.asset_id,data.source_system,data.reference_type,data.reference_id,data.reference_number||null,data.linked_by_user_id||null]);
  return result.insertId;
}
async function getExternalReference(id,conn=requireDb()){
  const [rows]=await conn.query('SELECT * FROM asset_external_references WHERE id=? LIMIT 1',[id]);
  return rows[0]||null;
}
async function externalReferences(assetId,sourceSystem=null,conn=requireDb()){
  const params=[assetId];let sql='SELECT * FROM asset_external_references WHERE asset_id=?';
  if(sourceSystem){sql+=' AND source_system=?';params.push(String(sourceSystem).toLowerCase());}
  sql+=' ORDER BY linked_at DESC,id DESC';
  const [rows]=await conn.query(sql,params);return rows;
}
module.exports={list,get,create,update,setState,saveAttributes,getAttributes,createAssignment,getAssignment,closeAssignment,createTransfer,createMaintenance,getMaintenance,completeMaintenance,addHistory,history,assignments,transfers,maintenances,findCurrentAssetsByAssignedUser,findExternalReference,createExternalReference,getExternalReference,externalReferences};
