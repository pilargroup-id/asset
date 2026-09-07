const R=require('../utils/response.util');const Service=require('../services/depreciation.service');
async function listPolicies(req,res,next){try{return R.ok(res,await Service.listPolicies(req),'Depreciation policies loaded');}catch(e){next(e);}}
async function createPolicy(req,res,next){try{return R.created(res,await Service.createPolicy(req),'Depreciation policy created');}catch(e){next(e);}}
async function updatePolicy(req,res,next){try{return R.ok(res,await Service.updatePolicy(req),'Depreciation policy updated');}catch(e){next(e);}}
async function setCategoryDefault(req,res,next){try{return R.ok(res,await Service.setCategoryDefault(req),'Category depreciation default updated');}catch(e){next(e);}}
async function suggest(req,res,next){try{return R.ok(res,await Service.suggestForAsset(req),'Depreciation suggestion loaded');}catch(e){next(e);}}
async function configure(req,res,next){try{return R.ok(res,await Service.configureAsset(req),'Asset depreciation configured');}catch(e){next(e);}}
async function revise(req,res,next){try{return R.ok(res,await Service.reviseAsset(req),'Asset depreciation revised');}catch(e){next(e);}}
async function generate(req,res,next){try{return R.ok(res,await Service.generateLedger(req),'Depreciation ledger generated');}catch(e){next(e);}}
async function getAsset(req,res,next){try{return R.ok(res,await Service.getAssetDepreciation(req),'Asset depreciation loaded');}catch(e){next(e);}}
async function finalize(req,res,next){try{return R.ok(res,await Service.finalize(req),'Depreciation period finalized');}catch(e){next(e);}}
module.exports={listPolicies,createPolicy,updatePolicy,setCategoryDefault,suggest,configure,revise,generate,getAsset,finalize};
