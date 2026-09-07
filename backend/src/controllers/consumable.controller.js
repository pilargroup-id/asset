const R=require('../utils/response.util');const Service=require('../services/consumable.service');
async function list(req,res,next){try{const x=await Service.list(req);return R.paginated(res,x.rows,x.meta,'Consumables loaded');}catch(e){next(e);}}
async function get(req,res,next){try{return R.ok(res,await Service.get(req),'Consumable loaded');}catch(e){next(e);}}
async function create(req,res,next){try{return R.created(res,await Service.create(req),'Consumable created');}catch(e){next(e);}}
async function update(req,res,next){try{return R.ok(res,await Service.update(req),'Consumable updated');}catch(e){next(e);}}
async function move(req,res,next){try{return R.created(res,await Service.move(req),'Consumable movement posted');}catch(e){next(e);}}
async function history(req,res,next){try{return R.ok(res,await Service.history(req),'Consumable history loaded');}catch(e){next(e);}}
module.exports={list,get,create,update,move,history};
