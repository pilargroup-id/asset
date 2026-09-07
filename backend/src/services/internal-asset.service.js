const AssetModel = require('../models/asset.model');
const ActivityLog = require('./activity-log.service');
const { withTransaction } = require('../utils/db.util');
const { appError } = require('../utils/app-error.util');
const { ACTIVITY_ACTIONS } = require('../constants/activity.constants');

function positiveInteger(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw appError(`${field} must be a positive integer`, 400, 'VALIDATION_ERROR');
  return number;
}

async function assignedToUser(req) {
  const userId = String(req.query.user_id || req.query.assigned_user_id || '').trim();
  if (!userId) throw appError('user_id is required', 400, 'VALIDATION_ERROR');
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(userId)) throw appError('user_id must be a PilarGroup user UUID', 400, 'VALIDATION_ERROR');
  const managingDepartmentId = positiveInteger(req.query.managing_department_id, 'managing_department_id');
  const companyId = req.query.company_id ? String(req.query.company_id).trim() : null;
  return AssetModel.findCurrentAssetsByAssignedUser({ userId, managingDepartmentId, companyId });
}

async function listExternalReferences(req) {
  const asset = await AssetModel.get(req.params.assetId);
  if (!asset) throw appError('Asset not found', 404, 'ASSET_NOT_FOUND');
  return AssetModel.externalReferences(asset.id, req.query.source_system || null);
}

async function linkExternalReference(req) {
  const body = req.body || {};
  for (const field of ['source_system', 'reference_type', 'reference_id']) {
    if (!String(body[field] || '').trim()) throw appError(`${field} is required`, 400, 'VALIDATION_ERROR');
  }

  return withTransaction(async (conn) => {
    const asset = await AssetModel.get(req.params.assetId, conn, true);
    if (!asset) throw appError('Asset not found', 404, 'ASSET_NOT_FOUND');

    if (body.linked_by_user_id) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(String(body.linked_by_user_id).trim())) throw appError('linked_by_user_id must be a PilarGroup user UUID', 400, 'VALIDATION_ERROR');
    }

    const payload = {
      asset_id: asset.id,
      source_system: String(body.source_system).trim().toLowerCase(),
      reference_type: String(body.reference_type).trim().toUpperCase(),
      reference_id: String(body.reference_id).trim(),
      reference_number: body.reference_number ? String(body.reference_number).trim() : null,
      linked_by_user_id: body.linked_by_user_id ? String(body.linked_by_user_id).trim() : null,
    };

    let reference = await AssetModel.findExternalReference(payload, conn);
    if (reference) return reference;

    const id = await AssetModel.createExternalReference(payload, conn);
    reference = await AssetModel.getExternalReference(id, conn);

    await AssetModel.addHistory({
      asset_id: asset.id,
      event_type: 'EXTERNAL_REFERENCE_LINKED',
      event_date: new Date(),
      reference_type: 'ASSET_EXTERNAL_REFERENCE',
      reference_id: id,
      description: `${payload.reference_type} ${payload.reference_number || payload.reference_id} linked from ${payload.source_system}`,
      details: payload,
      performed_by: payload.linked_by_user_id,
    }, conn);

    await ActivityLog.log(req, {
      user_id: payload.linked_by_user_id,
      module: 'ASSET_INTEGRATION',
      action: ACTIVITY_ACTIONS.EXTERNAL_REFERENCE_LINK,
      source: 'INTERNAL_API',
      entity_type: 'ASSET',
      entity_id: asset.id,
      entity_reference: asset.asset_number,
      entity_name_snapshot: asset.asset_name,
      new_values: reference,
      description: `Linked ${payload.reference_type} ${payload.reference_number || payload.reference_id} to asset ${asset.asset_number}`,
    }, conn);

    return reference;
  });
}

module.exports = { assignedToUser, listExternalReferences, linkExternalReference };
