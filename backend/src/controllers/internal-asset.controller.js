const R = require('../utils/response.util');
const Service = require('../services/internal-asset.service');

async function assignedToUser(req, res, next) {
  try { return R.ok(res, await Service.assignedToUser(req), 'Assigned assets loaded'); } catch (error) { return next(error); }
}
async function listExternalReferences(req, res, next) {
  try { return R.ok(res, await Service.listExternalReferences(req), 'External references loaded'); } catch (error) { return next(error); }
}
async function linkExternalReference(req, res, next) {
  try { return R.created(res, await Service.linkExternalReference(req), 'External reference linked'); } catch (error) { return next(error); }
}

module.exports = { assignedToUser, listExternalReferences, linkExternalReference };
