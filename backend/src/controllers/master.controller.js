const R=require('../utils/response.util');const Service=require('../services/master.service');
async function list(req,res,next){try{return R.ok(res,await Service.list(req),'Master data loaded');}catch(e){next(e);}}
async function get(req,res,next){try{return R.ok(res,await Service.get(req),'Master data loaded');}catch(e){next(e);}}
async function create(req,res,next){try{return R.created(res,await Service.create(req),'Master data created');}catch(e){next(e);}}
async function update(req,res,next){try{return R.ok(res,await Service.update(req),'Master data updated');}catch(e){next(e);}}
module.exports={list,get,create,update};
