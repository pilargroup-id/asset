const R=require('../utils/response.util');const D=require('../services/pilargroup-directory.service');
async function users(req,res,next){try{return R.ok(res,await D.users(req.query),'Directory users loaded');}catch(e){next(e);}}
async function departments(req,res,next){try{return R.ok(res,await D.departments(req.query),'Directory departments loaded');}catch(e){next(e);}}
async function companies(req,res,next){try{return R.ok(res,await D.companies(req.query),'Directory companies loaded');}catch(e){next(e);}}
module.exports={users,departments,companies};
