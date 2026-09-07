const { requireDb } = require('../utils/db.util');
const TABLES = Object.freeze({
  categories: { table:'master_categories', fields:['code','name','tracking_type','is_depreciable','is_active'] },
  category_attributes: { table:'master_category_attributes', fields:['category_id','attribute_code','attribute_name','data_type','is_required','sort_order','is_active'] },
  locations: { table:'master_locations', fields:['parent_id','code','name','location_type','company_id','is_active'] },
  vendors: { table:'master_vendors', fields:['code','name','contact_name','phone','email','address','notes','is_active'] },
  brands: { table:'master_brands', fields:['name','code','is_active'] },
  models: { table:'master_models', fields:['brand_id','name','code','is_active'] },
  uoms: { table:'master_uoms', fields:['code','name','is_active'] },
});
function cfg(type){ const c=TABLES[type]; if(!c) throw new Error(`Unsupported master type: ${type}`); return c; }
async function list(type, filters={}, conn=requireDb()){
  const c=cfg(type); const where=[]; const params=[];
  for(const key of ['is_active','tracking_type','company_id','category_id','brand_id','parent_id']) if(filters[key]!==undefined){where.push(`${key}=?`);params.push(filters[key]);}
  const [rows]=await conn.query(`SELECT * FROM ${c.table}${where.length?' WHERE '+where.join(' AND '):''} ORDER BY id`,params); return rows;
}
async function get(type,id,conn=requireDb()){ const c=cfg(type); const [r]=await conn.query(`SELECT * FROM ${c.table} WHERE id=? LIMIT 1`,[id]); return r[0]||null; }
async function create(type,data,conn=requireDb()){ const c=cfg(type); const fields=c.fields.filter((f)=>data[f]!==undefined); const vals=fields.map((f)=>data[f]); const [r]=await conn.query(`INSERT INTO ${c.table} (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`,vals); return r.insertId; }
async function update(type,id,data,conn=requireDb()){ const c=cfg(type); const fields=c.fields.filter((f)=>data[f]!==undefined); if(!fields.length)return; const vals=fields.map((f)=>data[f]); vals.push(id); await conn.query(`UPDATE ${c.table} SET ${fields.map((f)=>`${f}=?`).join(',')} WHERE id=?`,vals); }
module.exports={TABLES,list,get,create,update};
