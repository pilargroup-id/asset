const R=require('../utils/response.util');const Service=require('../services/dashboard.service');
async function get(req,res,next){try{return R.ok(res,await Service.dashboard(req),'Dashboard loaded');}catch(e){next(e);}}
module.exports={get};
