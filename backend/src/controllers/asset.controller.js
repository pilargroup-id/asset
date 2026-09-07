const R=require('../utils/response.util');const Service=require('../services/asset.service');
async function list(req,res,next){try{const x=await Service.list(req);return R.paginated(res,x.rows,x.meta,'Assets loaded');}catch(e){next(e);}}
async function get(req,res,next){try{return R.ok(res,await Service.get(req),'Asset loaded');}catch(e){next(e);}}
async function create(req,res,next){try{return R.created(res,await Service.create(req),'Asset created');}catch(e){next(e);}}
async function update(req,res,next){try{return R.ok(res,await Service.update(req),'Asset updated');}catch(e){next(e);}}
async function assign(req,res,next){try{return R.created(res,await Service.assign(req),'Asset assigned');}catch(e){next(e);}}
async function returnAsset(req,res,next){try{return R.ok(res,await Service.returnAsset(req),'Asset returned');}catch(e){next(e);}}
async function transfer(req,res,next){try{return R.created(res,await Service.transfer(req),'Asset transferred');}catch(e){next(e);}}
async function createMaintenance(req,res,next){try{return R.created(res,await Service.createMaintenance(req),'Maintenance created');}catch(e){next(e);}}
async function completeMaintenance(req,res,next){try{return R.ok(res,await Service.completeMaintenance(req),'Maintenance completed');}catch(e){next(e);}}
async function retire(req,res,next){try{return R.ok(res,await Service.retire(req),'Asset lifecycle updated');}catch(e){next(e);}}
async function history(req,res,next){try{return R.ok(res,await Service.history(req),'Asset history loaded');}catch(e){next(e);}}
module.exports={list,get,create,update,assign,returnAsset,transfer,createMaintenance,completeMaintenance,retire,history};
