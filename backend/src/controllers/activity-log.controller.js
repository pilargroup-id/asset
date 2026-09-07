const R=require('../utils/response.util');const A=require('../services/activity-log.service');
async function list(req,res,next){try{const x=await A.list(req);return R.paginated(res,x.rows,x.meta,'Activity logs loaded');}catch(e){next(e);}}
module.exports={list};
