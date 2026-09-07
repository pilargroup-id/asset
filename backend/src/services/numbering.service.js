const NumberingModel=require('../models/numbering.model');
const { withTransaction }=require('../utils/db.util');
const { appError }=require('../utils/app-error.util');
const PermissionService=require('./permission.service');
const { RESET_PERIODS,SEQUENCE_TYPES }=require('../constants/domain.constants');
function validateConfig(b,isCreate=false){if(isCreate){for(const f of ['managing_department_id','sequence_type','name','pattern'])if(b[f]===undefined||b[f]===null||b[f]==='')throw appError(`${f} is required`,400,'VALIDATION_ERROR');}if(b.sequence_type&&!Object.values(SEQUENCE_TYPES).includes(b.sequence_type))throw appError('Invalid sequence_type',400,'VALIDATION_ERROR');if(b.reset_period&&!Object.values(RESET_PERIODS).includes(b.reset_period))throw appError('Invalid reset_period',400,'VALIDATION_ERROR');if(b.sequence_length!==undefined&&(Number(b.sequence_length)<1||Number(b.sequence_length)>20))throw appError('sequence_length must be 1..20',400,'VALIDATION_ERROR');}
function resetKey(period,date=new Date()){ if(period===RESET_PERIODS.YEARLY)return String(date.getFullYear()); if(period===RESET_PERIODS.MONTHLY)return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; return 'NEVER'; }
function renderPattern(config,sequence,date=new Date()){
  const yyyy=String(date.getFullYear()), yy=yyyy.slice(-2), mm=String(date.getMonth()+1).padStart(2,'0');
  let out=config.pattern.replaceAll('{PREFIX}',config.prefix||'').replaceAll('{COMPANY}',config.company_token||'').replaceAll('{DEPARTMENT}',config.department_token||'').replaceAll('{YYYY}',yyyy).replaceAll('{YY}',yy).replaceAll('{MM}',mm);
  out=out.replace(/\{SEQ(?::(\d+))?\}/g,(_,len)=>String(sequence).padStart(Number(len||config.sequence_length||6),'0'));
  return out;
}
async function generate({departmentId,companyId,sequenceType}){
  if(!Object.values(SEQUENCE_TYPES).includes(sequenceType))throw appError('Invalid sequence type',400,'VALIDATION_ERROR');
  return withTransaction(async(conn)=>{
    const config=await NumberingModel.findActive(departmentId,companyId,sequenceType,conn,true);
    if(!config)throw appError(`Active ${sequenceType} numbering configuration not found`,400,'NUMBERING_CONFIG_NOT_FOUND');
    const key=resetKey(config.reset_period); let current=Number(config.current_sequence||0);
    if(config.reset_period!=='NEVER' && config.last_reset_key!==key) current=Number(config.starting_sequence||1)-1;
    current+=1; await NumberingModel.updateSequence(config.id,current,key,conn); return renderPattern(config,current);
  });
}
async function create(req){ validateConfig(req.body,true); await PermissionService.assertScope(req.user.id,'NUMBERING_MANAGE',req.body.company_id||null,req.body.managing_department_id); return withTransaction(async(conn)=>{if(req.body.is_active!==false)await conn.query(`UPDATE numbering_configs SET is_active=0 WHERE managing_department_id=? AND sequence_type=? AND ((company_id IS NULL AND ? IS NULL) OR company_id=?)`,[req.body.managing_department_id,req.body.sequence_type,req.body.company_id||null,req.body.company_id||null]);return NumberingModel.create({...req.body,created_by:req.user.id},conn);}); }
async function update(req){ validateConfig(req.body,false); const old=await NumberingModel.get(req.params.id); if(!old)throw appError('Numbering configuration not found',404,'NUMBERING_NOT_FOUND'); await PermissionService.assertScope(req.user.id,'NUMBERING_MANAGE',old.company_id,old.managing_department_id); return withTransaction(async(conn)=>{if(req.body.is_active===true)await conn.query(`UPDATE numbering_configs SET is_active=0 WHERE id<>? AND managing_department_id=? AND sequence_type=? AND ((company_id IS NULL AND ? IS NULL) OR company_id=?)`,[old.id,old.managing_department_id,old.sequence_type,old.company_id||null,old.company_id||null]);await NumberingModel.update(old.id,req.body,conn);return NumberingModel.get(old.id,conn);}); }
async function list(req){const scope=await PermissionService.buildScopeSql(req.user.id,'NUMBERING_MANAGE','n','managing_department_id','company_id');return NumberingModel.list(scope.sql,scope.params);}
module.exports={generate,renderPattern,list,create,update,get:NumberingModel.get};
