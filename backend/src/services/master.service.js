const MasterModel=require('../models/master.model');
const PermissionService=require('./permission.service');
const ActivityLog=require('./activity-log.service');
const { appError }=require('../utils/app-error.util');
const { TRACKING_TYPES }=require('../constants/domain.constants');
const { ACTIVITY_ACTIONS }=require('../constants/activity.constants');
function validate(type,data,isCreate=false){
  const required={categories:['code','name','tracking_type'],category_attributes:['category_id','attribute_code','attribute_name'],locations:['code','name'],vendors:['name'],brands:['name'],models:['name'],uoms:['code','name']};
  if(isCreate){const missing=(required[type]||[]).filter((f)=>data[f]===undefined||data[f]===null||data[f]==='');if(missing.length)throw appError('Validation failed',400,'VALIDATION_ERROR',{missing_fields:missing});}
  if(type==='categories' && data.tracking_type!==undefined && !Object.values(TRACKING_TYPES).includes(data.tracking_type)) throw appError('Invalid tracking_type',400,'VALIDATION_ERROR');
  if(type==='category_attributes' && data.data_type!==undefined && !['TEXT','NUMBER','DATE','BOOLEAN','JSON'].includes(data.data_type)) throw appError('Invalid data_type',400,'VALIDATION_ERROR');
}
function ensureType(type){if(!MasterModel.TABLES[type])throw appError('Unsupported master type',400,'MASTER_TYPE_NOT_SUPPORTED');}
async function list(req){ ensureType(req.params.type); await PermissionService.assertAny(req.user,'MASTER_VIEW'); return MasterModel.list(req.params.type,req.query); }
async function get(req){ ensureType(req.params.type); await PermissionService.assertAny(req.user,'MASTER_VIEW'); const row=await MasterModel.get(req.params.type,req.params.id); if(!row)throw appError('Master data not found',404,'MASTER_NOT_FOUND'); return row; }
async function create(req){ ensureType(req.params.type); await PermissionService.assertGlobal(req.user,'MASTER_MANAGE'); validate(req.params.type,req.body,true); const id=await MasterModel.create(req.params.type,req.body); const row=await MasterModel.get(req.params.type,id); await ActivityLog.log(req,{module:'MASTER_DATA',action:ACTIVITY_ACTIONS.CREATE,entity_type:req.params.type,entity_id:id,entity_reference:row.code||String(id),entity_name_snapshot:row.name||row.attribute_name,new_values:row,description:`Created ${req.params.type}`}); return row; }
async function update(req){ ensureType(req.params.type); await PermissionService.assertGlobal(req.user,'MASTER_MANAGE'); const old=await MasterModel.get(req.params.type,req.params.id); if(!old)throw appError('Master data not found',404,'MASTER_NOT_FOUND'); validate(req.params.type,req.body); await MasterModel.update(req.params.type,old.id,req.body); const row=await MasterModel.get(req.params.type,old.id); await ActivityLog.log(req,{module:'MASTER_DATA',action:ACTIVITY_ACTIONS.UPDATE,entity_type:req.params.type,entity_id:old.id,entity_reference:row.code||String(old.id),entity_name_snapshot:row.name||row.attribute_name,old_values:old,new_values:row,description:`Updated ${req.params.type}`}); return row; }
module.exports={list,get,create,update};
