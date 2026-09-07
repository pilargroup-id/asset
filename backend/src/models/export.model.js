const { requireDb }=require('../utils/db.util');
async function insert(data,conn=requireDb()){const [r]=await conn.query(`INSERT INTO export_history (export_number,export_type,format,filters,scope_snapshot,row_count,filename,created_by) VALUES (?,?,?,?,?,?,?,?)`,[data.export_number,data.export_type,data.format||'XLSX',data.filters?JSON.stringify(data.filters):null,data.scope_snapshot?JSON.stringify(data.scope_snapshot):null,data.row_count||0,data.filename||null,data.created_by]);return r.insertId;}
module.exports={insert};
