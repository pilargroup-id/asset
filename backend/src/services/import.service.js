const crypto = require('crypto');
const XLSX = require('xlsx');

const PreviewStorage = require('./preview-storage.service');
const MasterModel = require('../models/master.model');
const AssetModel = require('../models/asset.model');
const ConsumableModel = require('../models/consumable.model');
const DepModel = require('../models/depreciation.model');
const PermissionService = require('./permission.service');
const NumberingService = require('./numbering.service');
const ActivityLog = require('./activity-log.service');
const { withTransaction, requireDb } = require('../utils/db.util');
const { appError } = require('../utils/app-error.util');
const { diffValues } = require('../utils/diff.util');
const { TRACKING_TYPES } = require('../constants/domain.constants');
const { ACTIVITY_ACTIONS } = require('../constants/activity.constants');

const SUPPORTED = [
  'ASSET',
  'CONSUMABLE',
  'CONSUMABLE_OPENING_STOCK',
  'CATEGORY',
  'LOCATION',
  'VENDOR',
  'BRAND',
  'MODEL',
  'DEPRECIATION_POLICY',
];

const ASSET_DIFF_FIELDS = [
  'asset_name', 'category_id', 'category_name', 'brand_id', 'brand_name', 'model_id', 'model_name',
  'serial_number', 'asset_condition', 'purchase_date', 'purchase_cost', 'vendor_id', 'vendor_name',
  'warranty_until', 'notes',
];

function normalizeKey(key) {
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function normalizeRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) out[normalizeKey(key)] = value;
  return out;
}

function importReference() {
  return crypto.randomUUID();
}

function truthy(value) {
  return ['1', 'true', 'yes', 'y', 'active'].includes(String(value).trim().toLowerCase()) ? 1 : 0;
}

function supplied(row, field) {
  return row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== '';
}

function required(row, fields, errors) {
  for (const field of fields) {
    if (!supplied(row, field)) errors.push(`${field} is required`);
  }
}

async function findBy(table, column, value, conn = requireDb()) {
  if (value === undefined || value === null || value === '') return null;
  const allowed = {
    master_categories: ['code'],
    master_brands: ['code', 'name'],
    master_models: ['name', 'code'],
    master_locations: ['code'],
    master_vendors: ['code', 'name'],
    master_uoms: ['code'],
    consumables: ['consumable_code'],
  };
  if (!allowed[table]?.includes(column)) throw new Error('Invalid lookup');
  const [rows] = await conn.query(`SELECT * FROM ${table} WHERE ${column}=? LIMIT 1`, [value]);
  return rows[0] || null;
}

async function findAssetByNumber(assetNumber, conn = requireDb(), forUpdate = false) {
  if (!assetNumber) return null;
  let sql = `SELECT a.*,c.name category_name,c.tracking_type,c.is_depreciable,
    b.name brand_name,m.name model_name,l.code current_location_code,l.name current_location_name,
    v.name vendor_name
    FROM assets a
    JOIN master_categories c ON c.id=a.category_id
    LEFT JOIN master_brands b ON b.id=a.brand_id
    LEFT JOIN master_models m ON m.id=a.model_id
    LEFT JOIN master_locations l ON l.id=a.current_location_id
    LEFT JOIN master_vendors v ON v.id=a.vendor_id
    WHERE a.asset_number=? LIMIT 1`;
  if (forUpdate) sql += ' FOR UPDATE';
  const [rows] = await conn.query(sql, [assetNumber]);
  return rows[0] || null;
}

async function validateAssetRow(row, userId) {
  const errors = [];
  const warnings = [];
  const existing = supplied(row, 'asset_number') ? await findAssetByNumber(String(row.asset_number).trim()) : null;
  const action = existing ? 'UPDATE' : 'CREATE';

  if (action === 'CREATE') {
    required(row, ['asset_name', 'category_code', 'managing_department_id', 'company_id'], errors);
  }

  if (supplied(row, 'status') && !['REGISTERED', 'AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED', 'VOID'].includes(String(row.status).toUpperCase())) {
    errors.push('invalid status');
  }
  if (supplied(row, 'asset_condition') && !['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'].includes(String(row.asset_condition).toUpperCase())) {
    errors.push('invalid asset_condition');
  }

  let category = null;
  if (supplied(row, 'category_code')) {
    category = await findBy('master_categories', 'code', row.category_code);
    if (!category) errors.push('category_code not found');
    else if (category.tracking_type !== 'SERIALIZED_ASSET') errors.push('category_code is not SERIALIZED_ASSET');
  }

  let location = null;
  if (supplied(row, 'location_code')) {
    location = await findBy('master_locations', 'code', row.location_code);
    if (!location) errors.push('location_code not found');
  }
  if (supplied(row, 'vendor_code') && !(await findBy('master_vendors', 'code', row.vendor_code))) errors.push('vendor_code not found');
  let suppliedBrand = null;
  if (supplied(row, 'brand_code')) {
    suppliedBrand = await findBy('master_brands', 'code', row.brand_code);
    if (!suppliedBrand) errors.push('brand_code not found');
  }
  if (supplied(row, 'model_name')) {
    const expectedBrandId = suppliedBrand?.id || existing?.brand_id || null;
    const db = requireDb();
    const [models] = await db.query(
      'SELECT id,brand_id FROM master_models WHERE name=? AND (? IS NULL OR brand_id=?) LIMIT 1',
      [row.model_name, expectedBrandId, expectedBrandId],
    );
    if (!models.length) errors.push('model_name not found for the selected/current brand');
  }
  if (action === 'UPDATE' && suppliedBrand && existing?.model_id && !supplied(row, 'model_name')) {
    const db = requireDb();
    const [models] = await db.query('SELECT brand_id FROM master_models WHERE id=? LIMIT 1', [existing.model_id]);
    if (models[0]?.brand_id && Number(models[0].brand_id) !== Number(suppliedBrand.id)) {
      errors.push('model_name is required when changing brand because the current model belongs to another brand');
    }
  }

  if (action === 'CREATE' && supplied(row, 'managing_department_id') && supplied(row, 'company_id')) {
    await PermissionService.assertScope(userId, 'IMPORT_DATA', row.company_id, row.managing_department_id)
      .catch(() => errors.push('permission scope does not allow asset scope'));
  }

  if (action === 'UPDATE') {
    await PermissionService.assertScope(userId, 'IMPORT_DATA', existing.company_id, existing.managing_department_id)
      .catch(() => errors.push('permission scope does not allow asset scope'));

    if (supplied(row, 'company_id') && String(row.company_id) !== String(existing.company_id)) {
      errors.push('company_id cannot be changed by standard asset import; use Asset Transfer');
    }
    if (supplied(row, 'managing_department_id') && Number(row.managing_department_id) !== Number(existing.managing_department_id)) {
      errors.push('managing_department_id cannot be changed by standard asset import; use Asset Transfer');
    }
    if (supplied(row, 'location_code') && location && Number(location.id) !== Number(existing.current_location_id || 0)) {
      errors.push('location_code cannot be changed by standard asset import; use Asset Transfer');
    }
    if (supplied(row, 'status') && String(row.status).toUpperCase() !== String(existing.status)) {
      errors.push('status cannot be changed by standard asset import; use the asset lifecycle operation');
    }
    const assignmentFields = [
      'current_assignment_type', 'assigned_user_id', 'assigned_user_name_snapshot',
      'assigned_department_id', 'assigned_department_name_snapshot', 'assigned_location_code',
      'assigned_at', 'assignment_purpose',
    ];
    if (assignmentFields.some((field) => supplied(row, field))) {
      errors.push('current assignment cannot be changed by standard asset import; use Assignment/Return');
    }

    const patchFields = [
      'asset_name', 'category_code', 'brand_code', 'model_name', 'serial_number', 'asset_condition',
      'purchase_date', 'purchase_cost', 'vendor_code', 'warranty_until', 'notes',
    ];
    if (!patchFields.some((field) => supplied(row, field))) warnings.push('No asset master fields supplied; commit may result in no changes');
  }

  if (action === 'CREATE' && !supplied(row, 'asset_number')) {
    warnings.push('asset_number blank: active numbering configuration will be used on commit');
  }

  if (action === 'CREATE' && supplied(row, 'current_assignment_type')) {
    row.current_assignment_type = String(row.current_assignment_type).toUpperCase();
    if (!['USER', 'DEPARTMENT', 'LOCATION', 'SHARED_POOL'].includes(row.current_assignment_type)) errors.push('current_assignment_type is invalid');
    if (row.current_assignment_type === 'USER' && !supplied(row, 'assigned_user_id')) errors.push('assigned_user_id is required for USER current assignment');
    if (row.current_assignment_type === 'DEPARTMENT' && !supplied(row, 'assigned_department_id')) errors.push('assigned_department_id is required for DEPARTMENT current assignment');
    if (row.current_assignment_type === 'LOCATION' && !supplied(row, 'assigned_location_code')) errors.push('assigned_location_code is required for LOCATION current assignment');
    if (supplied(row, 'assigned_location_code') && !(await findBy('master_locations', 'code', row.assigned_location_code))) errors.push('assigned_location_code not found');
    if (supplied(row, 'status') && String(row.status).toUpperCase() !== 'ASSIGNED') warnings.push('status will be set to ASSIGNED because current assignment is supplied');
  }

  return { action, errors, warnings };
}

async function validateRow(type, row, userId) {
  if (type === 'ASSET') return validateAssetRow(row, userId);

  const errors = [];
  const warnings = [];
  let action = 'CREATE';

  if (type === 'CATEGORY') {
    await PermissionService.assertGlobal(userId, 'IMPORT_DATA').catch(() => errors.push('GLOBAL IMPORT_DATA is required for category import'));
    required(row, ['code', 'name', 'tracking_type'], errors);
    if (supplied(row, 'tracking_type') && !Object.values(TRACKING_TYPES).includes(String(row.tracking_type).toUpperCase())) errors.push('tracking_type must be SERIALIZED_ASSET or CONSUMABLE');
    if (supplied(row, 'code') && await findBy('master_categories', 'code', row.code)) errors.push('category code already exists');
  }

  if (type === 'LOCATION') {
    required(row, ['code', 'name'], errors);
    if (supplied(row, 'code') && await findBy('master_locations', 'code', row.code)) errors.push('location code already exists');
    if (supplied(row, 'company_id')) await PermissionService.assertScope(userId, 'IMPORT_DATA', row.company_id, null).catch(() => errors.push('permission scope does not allow company_id'));
  }

  if (type === 'VENDOR') {
    await PermissionService.assertGlobal(userId, 'IMPORT_DATA').catch(() => errors.push('GLOBAL IMPORT_DATA is required for vendor import'));
    required(row, ['name'], errors);
    if (supplied(row, 'code') && await findBy('master_vendors', 'code', row.code)) errors.push('vendor code already exists');
  }

  if (type === 'BRAND') {
    await PermissionService.assertGlobal(userId, 'IMPORT_DATA').catch(() => errors.push('GLOBAL IMPORT_DATA is required for brand import'));
    required(row, ['name'], errors);
    if (supplied(row, 'code') && await findBy('master_brands', 'code', row.code)) errors.push('brand code already exists');
  }

  if (type === 'MODEL') {
    await PermissionService.assertGlobal(userId, 'IMPORT_DATA').catch(() => errors.push('GLOBAL IMPORT_DATA is required for model import'));
    required(row, ['name'], errors);
  }

  if (type === 'DEPRECIATION_POLICY') {
    required(row, ['name', 'managing_department_id', 'useful_life_months'], errors);
    if (supplied(row, 'managing_department_id')) {
      await PermissionService.assertScope(userId, 'IMPORT_DATA', row.company_id || null, row.managing_department_id).catch(() => errors.push('permission scope does not allow policy scope'));
    }
  }

  if (type === 'CONSUMABLE') {
    required(row, ['name', 'category_code', 'uom_code', 'managing_department_id', 'company_id'], errors);
    if (supplied(row, 'consumable_code') && await findBy('consumables', 'consumable_code', row.consumable_code)) errors.push('consumable_code already exists');
    const category = supplied(row, 'category_code') ? await findBy('master_categories', 'code', row.category_code) : null;
    if (!category) errors.push('category_code not found');
    else if (category.tracking_type !== 'CONSUMABLE') errors.push('category_code is not CONSUMABLE');
    if (supplied(row, 'uom_code') && !(await findBy('master_uoms', 'code', row.uom_code))) errors.push('uom_code not found');
    if (supplied(row, 'brand_code') && !(await findBy('master_brands', 'code', row.brand_code))) errors.push('brand_code not found');
    if (supplied(row, 'managing_department_id') && supplied(row, 'company_id')) {
      await PermissionService.assertScope(userId, 'IMPORT_DATA', row.company_id, row.managing_department_id).catch(() => errors.push('permission scope does not allow consumable scope'));
    }
    if (!supplied(row, 'consumable_code')) warnings.push('consumable_code blank: active numbering configuration will be used on commit');
  }

  if (type === 'CONSUMABLE_OPENING_STOCK') {
    action = 'OPENING_BALANCE';
    required(row, ['consumable_code', 'location_code', 'opening_quantity'], errors);
    const item = supplied(row, 'consumable_code') ? await findBy('consumables', 'consumable_code', row.consumable_code) : null;
    if (!item) errors.push('consumable_code not found');
    else await PermissionService.assertScope(userId, 'IMPORT_DATA', item.company_id, item.managing_department_id).catch(() => errors.push('permission scope does not allow consumable'));
    if (supplied(row, 'location_code') && !(await findBy('master_locations', 'code', row.location_code))) errors.push('location_code not found');
    if (supplied(row, 'opening_quantity') && Number(row.opening_quantity) < 0) errors.push('opening_quantity cannot be negative');
  }

  return { action, errors, warnings };
}

function publicRecord(record) {
  return {
    preview_token: record.token,
    import_reference: record.import_reference,
    import_type: record.import_type,
    original_filename: record.original_filename,
    expires_at: record.expires_at,
    summary: record.summary,
    rows: record.rows,
  };
}

async function ownedRecord(token, userId, expectResult = false) {
  const record = await PreviewStorage.get(token);
  if (!record) throw appError('Preview token not found or expired', 404, 'PREVIEW_EXPIRED');
  if (String(record.user_id) !== String(userId)) throw appError('Preview token does not belong to current user', 403, 'PREVIEW_FORBIDDEN');
  if (Boolean(record.is_result) !== Boolean(expectResult)) throw appError('Preview token is not valid for this operation', 404, 'PREVIEW_NOT_FOUND');
  return record;
}

async function preview(req) {
  await PermissionService.assertAny(req.user.id, 'IMPORT_DATA');
  await PreviewStorage.cleanupExpired();

  const type = String(req.params.type || '').toUpperCase();
  if (!SUPPORTED.includes(type)) throw appError('Unsupported import type', 400, 'IMPORT_TYPE_NOT_SUPPORTED');
  if (!req.file?.buffer) throw appError('Import file is required', 400, 'FILE_REQUIRED');

  let workbook;
  try {
    workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
  } catch {
    throw appError('Import file could not be parsed', 400, 'IMPORT_FILE_INVALID');
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw appError('Import workbook does not contain a sheet', 400, 'IMPORT_SHEET_REQUIRED');

  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: null });
  const normalized = rawRows
    .map((raw, index) => ({ source_row: index + 2, row: normalizeRow(raw) }))
    .filter(({ row }) => Object.values(row).some((value) => value !== null && value !== ''));

  const rows = [];
  const seen = new Set();
  const uniqueField = {
    ASSET: 'asset_number', CONSUMABLE: 'consumable_code', CATEGORY: 'code', LOCATION: 'code',
    VENDOR: 'code', BRAND: 'code', MODEL: 'code',
  }[type];

  for (const item of normalized) {
    const result = await validateRow(type, item.row, req.user.id);
    if (uniqueField && supplied(item.row, uniqueField)) {
      const key = String(item.row[uniqueField]).trim().toUpperCase();
      if (seen.has(key)) result.errors.push(`duplicate ${uniqueField} inside import file`);
      else seen.add(key);
    }
    rows.push({
      source_row: item.source_row,
      action: result.action,
      status: result.errors.length ? 'INVALID' : result.warnings.length ? 'WARNING' : 'VALID',
      errors: result.errors,
      warnings: result.warnings,
      original: item.row,
    });
  }

  const summary = {
    total: rows.length,
    valid: rows.filter((row) => row.status === 'VALID').length,
    warnings: rows.filter((row) => row.status === 'WARNING').length,
    invalid: rows.filter((row) => row.status === 'INVALID').length,
  };

  const record = await PreviewStorage.save({
    is_result: false,
    user_id: req.user.id,
    import_reference: importReference(),
    import_type: type,
    original_filename: req.file.originalname,
    summary,
    rows,
  });

  return publicRecord(record);
}

async function getPreview(req) {
  await PermissionService.assertAny(req.user.id, 'IMPORT_DATA');
  return publicRecord(await ownedRecord(req.params.previewToken, req.user.id, false));
}

async function commitMaster(type, row, userId, req, correlationId) {
  const map = { CATEGORY: 'categories', LOCATION: 'locations', VENDOR: 'vendors', BRAND: 'brands', MODEL: 'models' };
  const master = map[type];
  if (!master) return null;

  return withTransaction(async (conn) => {
    const data = { ...row };
    if (type === 'CATEGORY') {
      data.tracking_type = String(row.tracking_type).toUpperCase();
      data.is_depreciable = truthy(row.is_depreciable);
      data.is_active = row.is_active === null || row.is_active === undefined ? 1 : truthy(row.is_active);
    }
    if (type === 'LOCATION' && supplied(row, 'parent_code')) {
      const parent = await findBy('master_locations', 'code', row.parent_code, conn);
      data.parent_id = parent?.id || null;
    }
    if (type === 'MODEL' && supplied(row, 'brand_code')) {
      const brand = await findBy('master_brands', 'code', row.brand_code, conn);
      data.brand_id = brand?.id || null;
    }
    const id = await MasterModel.create(master, data, conn);
    const created = await MasterModel.get(master, id, conn);
    await ActivityLog.log(req, {
      module: 'MASTER', action: ACTIVITY_ACTIONS.CREATE, source: 'IMPORT', correlation_id: correlationId,
      entity_type: type, entity_id: id, entity_reference: row.code || row.name || String(id),
      entity_name_snapshot: row.name || null, new_values: created,
      description: `Created ${type} via import`,
    }, conn);
    return { id, action: 'CREATE', reference: row.code || row.name || String(id) };
  });
}

function buildAssetPatch(row, resolved) {
  const patch = {};
  if (supplied(row, 'asset_name')) patch.asset_name = row.asset_name;
  if (supplied(row, 'category_code')) patch.category_id = resolved.category?.id;
  if (supplied(row, 'brand_code')) patch.brand_id = resolved.brand?.id;
  if (supplied(row, 'model_name')) patch.model_id = resolved.model?.id;
  if (supplied(row, 'serial_number')) patch.serial_number = row.serial_number;
  if (supplied(row, 'asset_condition')) patch.asset_condition = String(row.asset_condition).toUpperCase();
  if (supplied(row, 'purchase_date')) patch.purchase_date = row.purchase_date;
  if (supplied(row, 'purchase_cost')) patch.purchase_cost = row.purchase_cost;
  if (supplied(row, 'vendor_code')) patch.vendor_id = resolved.vendor?.id;
  if (supplied(row, 'warranty_until')) patch.warranty_until = row.warranty_until;
  if (supplied(row, 'notes')) patch.notes = row.notes;
  return patch;
}

async function resolveAssetReferences(row, conn, existing = null) {
  const category = supplied(row, 'category_code') ? await findBy('master_categories', 'code', row.category_code, conn) : null;
  const brand = supplied(row, 'brand_code') ? await findBy('master_brands', 'code', row.brand_code, conn) : null;
  let model = null;
  if (supplied(row, 'model_name')) {
    const expectedBrandId = brand?.id || existing?.brand_id || null;
    const [models] = await conn.query(
      'SELECT * FROM master_models WHERE name=? AND (? IS NULL OR brand_id=?) LIMIT 1',
      [row.model_name, expectedBrandId, expectedBrandId],
    );
    model = models[0] || null;
  }
  const location = supplied(row, 'location_code') ? await findBy('master_locations', 'code', row.location_code, conn) : null;
  const vendor = supplied(row, 'vendor_code') ? await findBy('master_vendors', 'code', row.vendor_code, conn) : null;
  return { category, brand, model, location, vendor };
}

async function commitAsset(row, userId, req, correlationId) {
  const existingBefore = supplied(row, 'asset_number') ? await findAssetByNumber(String(row.asset_number).trim()) : null;
  if (existingBefore) {
    return withTransaction(async (conn) => {
      const old = await findAssetByNumber(String(row.asset_number).trim(), conn, true);
      await PermissionService.assertScope(userId, 'IMPORT_DATA', old.company_id, old.managing_department_id, conn);
      const resolved = await resolveAssetReferences(row, conn, old);
      const patch = buildAssetPatch(row, resolved);
      await AssetModel.update(old.id, { ...patch, updated_by: userId }, conn);
      const after = await AssetModel.get(old.id, conn);
      const diff = diffValues(old, after, ASSET_DIFF_FIELDS);

      if (diff.changed) {
        await AssetModel.addHistory({
          asset_id: old.id,
          event_type: 'UPDATED',
          event_date: new Date(),
          description: 'Asset master updated via import',
          details: { source: 'IMPORT', correlation_id: correlationId, changes: diff },
          performed_by: userId,
        }, conn);
        await ActivityLog.log(req, {
          module: 'ASSET', action: ACTIVITY_ACTIONS.UPDATE, source: 'IMPORT', correlation_id: correlationId,
          entity_type: 'ASSET', entity_id: old.id, entity_reference: old.asset_number,
          entity_name_snapshot: after.asset_name, old_values: diff.old_values, new_values: diff.new_values,
          description: `Updated asset ${old.asset_number} via import`,
        }, conn);
      }

      return { id: old.id, action: 'UPDATE', reference: old.asset_number, changed: diff.changed };
    });
  }

  let code = supplied(row, 'asset_number') ? String(row.asset_number).trim() : null;
  if (!code) {
    code = await NumberingService.generate({
      departmentId: row.managing_department_id,
      companyId: row.company_id,
      sequenceType: 'ASSET',
    });
  }

  return withTransaction(async (conn) => {
    await PermissionService.assertScope(userId, 'IMPORT_DATA', row.company_id, row.managing_department_id, conn);
    const resolved = await resolveAssetReferences(row, conn);
    const initialStatus = supplied(row, 'current_assignment_type') ? 'ASSIGNED' : (supplied(row, 'status') ? String(row.status).toUpperCase() : 'AVAILABLE');
    const id = await AssetModel.create({
      asset_number: code,
      asset_name: row.asset_name,
      category_id: resolved.category.id,
      brand_id: resolved.brand?.id,
      model_id: resolved.model?.id,
      serial_number: row.serial_number,
      managing_department_id: row.managing_department_id,
      company_id: row.company_id,
      current_location_id: resolved.location?.id,
      status: initialStatus,
      asset_condition: supplied(row, 'asset_condition') ? String(row.asset_condition).toUpperCase() : 'GOOD',
      purchase_date: row.purchase_date,
      purchase_cost: row.purchase_cost,
      vendor_id: resolved.vendor?.id,
      warranty_until: row.warranty_until,
      notes: row.notes,
      created_by: userId,
    }, conn);

    if (supplied(row, 'current_assignment_type')) {
      const assignedLocation = supplied(row, 'assigned_location_code') ? await findBy('master_locations', 'code', row.assigned_location_code, conn) : null;
      const assignmentId = await AssetModel.createAssignment({
        asset_id: id,
        assignment_type: String(row.current_assignment_type).toUpperCase(),
        assigned_user_id: row.assigned_user_id,
        assigned_user_name_snapshot: row.assigned_user_name_snapshot,
        assigned_department_id: row.assigned_department_id,
        assigned_department_name_snapshot: row.assigned_department_name_snapshot,
        assigned_location_id: assignedLocation?.id,
        assigned_location_name_snapshot: assignedLocation?.name,
        purpose: row.assignment_purpose,
        assigned_at: row.assigned_at || new Date(),
        assigned_by: userId,
      }, conn);
      await AssetModel.setState(id, {
        status: 'ASSIGNED',
        current_assignment_id: assignmentId,
        current_location_id: String(row.current_assignment_type).toUpperCase() === 'LOCATION' ? (assignedLocation?.id || resolved.location?.id) : resolved.location?.id,
        updated_by: userId,
      }, conn);
      await AssetModel.addHistory({
        asset_id: id, event_type: 'ASSIGNED', event_date: row.assigned_at || new Date(),
        reference_type: 'ASSET_ASSIGNMENT', reference_id: assignmentId,
        description: 'Current assignment migrated by import',
        details: { source: 'IMPORT', correlation_id: correlationId, assignment_type: String(row.current_assignment_type).toUpperCase() },
        performed_by: userId,
      }, conn);
    }

    await AssetModel.addHistory({
      asset_id: id, event_type: 'IMPORTED', event_date: new Date(), description: 'Asset created by import',
      details: { source: 'IMPORT', correlation_id: correlationId, asset_number: code }, performed_by: userId,
    }, conn);
    const created = await AssetModel.get(id, conn);
    await ActivityLog.log(req, {
      module: 'ASSET', action: ACTIVITY_ACTIONS.CREATE, source: 'IMPORT', correlation_id: correlationId,
      entity_type: 'ASSET', entity_id: id, entity_reference: code, entity_name_snapshot: created.asset_name,
      new_values: created, description: `Created asset ${code} via import`,
    }, conn);
    return { id, action: 'CREATE', reference: code, changed: true };
  });
}

async function commitConsumable(row, userId, req, correlationId) {
  let code = supplied(row, 'consumable_code') ? String(row.consumable_code).trim() : null;
  if (!code) code = await NumberingService.generate({ departmentId: row.managing_department_id, companyId: row.company_id, sequenceType: 'CONSUMABLE' });

  return withTransaction(async (conn) => {
    const category = await findBy('master_categories', 'code', row.category_code, conn);
    const uom = await findBy('master_uoms', 'code', row.uom_code, conn);
    const brand = supplied(row, 'brand_code') ? await findBy('master_brands', 'code', row.brand_code, conn) : null;
    const id = await ConsumableModel.create({
      consumable_code: code, name: row.name, category_id: category.id, brand_id: brand?.id,
      variant: row.variant, uom_id: uom.id, managing_department_id: row.managing_department_id,
      company_id: row.company_id, minimum_stock: row.minimum_stock || 0, notes: row.notes, created_by: userId,
    }, conn);
    const created = await ConsumableModel.get(id, conn);
    await ActivityLog.log(req, {
      module: 'CONSUMABLE', action: ACTIVITY_ACTIONS.CREATE, source: 'IMPORT', correlation_id: correlationId,
      entity_type: 'CONSUMABLE', entity_id: id, entity_reference: code, entity_name_snapshot: created.name,
      new_values: created, description: `Created consumable ${code} via import`,
    }, conn);
    return { id, action: 'CREATE', reference: code };
  });
}

async function commitOpening(row, userId, req, correlationId) {
  return withTransaction(async (conn) => {
    const item = await findBy('consumables', 'consumable_code', row.consumable_code, conn);
    await PermissionService.assertScope(userId, 'IMPORT_DATA', item.company_id, item.managing_department_id, conn);
    const location = await findBy('master_locations', 'code', row.location_code, conn);
    const balance = await ConsumableModel.lockBalance(item.id, location.id, conn);
    const quantity = Number(row.opening_quantity);
    const oldQuantity = Number(balance.quantity);
    const newQuantity = oldQuantity + quantity;
    await ConsumableModel.setBalance(item.id, location.id, newQuantity, conn);
    const transactionId = await ConsumableModel.createTransaction({
      transaction_number: `CST-OPEN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      consumable_id: item.id, movement_type: 'OPENING_BALANCE', to_location_id: location.id,
      quantity, unit_cost: row.unit_cost, transaction_date: row.as_of_date || new Date(),
      reference_number: 'IMPORT_OPENING_BALANCE', notes: row.notes, created_by: userId,
    }, conn);
    await ActivityLog.log(req, {
      module: 'CONSUMABLE', action: ACTIVITY_ACTIONS.OPENING_BALANCE, source: 'IMPORT', correlation_id: correlationId,
      entity_type: 'CONSUMABLE', entity_id: item.id, entity_reference: item.consumable_code,
      entity_name_snapshot: item.name, old_values: { location_id: location.id, quantity: oldQuantity },
      new_values: { location_id: location.id, quantity: newQuantity, movement_quantity: quantity, transaction_id: transactionId },
      description: `Imported opening balance for ${item.consumable_code}`,
    }, conn);
    return { id: transactionId, action: 'OPENING_BALANCE', reference: item.consumable_code };
  });
}

async function commitDepPolicy(row, userId, req, correlationId) {
  return withTransaction(async (conn) => {
    const id = await DepModel.createPolicy({
      managing_department_id: row.managing_department_id, company_id: row.company_id || null,
      name: row.name, method: row.method || 'STRAIGHT_LINE', useful_life_months: row.useful_life_months,
      salvage_value_type: row.salvage_value_type || 'FIXED', salvage_value: row.salvage_value || 0,
      is_active: row.is_active === null || row.is_active === undefined ? 1 : truthy(row.is_active), created_by: userId,
    }, conn);
    const created = await DepModel.getPolicy(id, conn);
    await ActivityLog.log(req, {
      module: 'DEPRECIATION', action: ACTIVITY_ACTIONS.CREATE, source: 'IMPORT', correlation_id: correlationId,
      entity_type: 'DEPRECIATION_POLICY', entity_id: id, entity_reference: created.name,
      entity_name_snapshot: created.name, new_values: created, description: `Created depreciation policy ${created.name} via import`,
    }, conn);
    return { id, action: 'CREATE', reference: created.name };
  });
}

async function applyRow(type, row, req, correlationId) {
  if (['CATEGORY', 'LOCATION', 'VENDOR', 'BRAND', 'MODEL'].includes(type)) return commitMaster(type, row, req.user.id, req, correlationId);
  if (type === 'ASSET') return commitAsset(row, req.user.id, req, correlationId);
  if (type === 'CONSUMABLE') return commitConsumable(row, req.user.id, req, correlationId);
  if (type === 'CONSUMABLE_OPENING_STOCK') return commitOpening(row, req.user.id, req, correlationId);
  if (type === 'DEPRECIATION_POLICY') return commitDepPolicy(row, req.user.id, req, correlationId);
  throw appError('Unsupported import type', 400, 'IMPORT_TYPE_NOT_SUPPORTED');
}

async function commit(req) {
  await PermissionService.assertAny(req.user.id, 'IMPORT_DATA');
  const token = String(req.body?.preview_token || '').trim();
  if (!token) throw appError('preview_token is required', 400, 'PREVIEW_TOKEN_REQUIRED');
  const record = await ownedRecord(token, req.user.id, false);

  const successes = [];
  const failures = [];
  for (const previewRow of record.rows) {
    if (previewRow.status === 'INVALID') {
      failures.push(previewRow);
      continue;
    }

    const refreshed = await validateRow(record.import_type, { ...previewRow.original }, req.user.id);
    if (refreshed.errors.length) {
      failures.push({
        ...previewRow,
        action: refreshed.action,
        status: 'INVALID',
        errors: refreshed.errors,
        warnings: refreshed.warnings,
      });
      continue;
    }

    try {
      const result = await applyRow(record.import_type, previewRow.original, req, record.import_reference);
      successes.push({ source_row: previewRow.source_row, action: result.action, entity_id: result.id, reference: result.reference, changed: result.changed });
    } catch (error) {
      failures.push({
        ...previewRow,
        status: 'FAILED',
        errors: [error.message],
      });
    }
  }

  let errorRecord = null;
  if (failures.length) {
    errorRecord = await PreviewStorage.save({
      is_result: true,
      user_id: req.user.id,
      import_reference: record.import_reference,
      import_type: record.import_type,
      original_filename: record.original_filename,
      rows: failures,
    });
  }
  await PreviewStorage.remove(token);

  await ActivityLog.log(req, {
    module: 'IMPORT', action: ACTIVITY_ACTIONS.IMPORT, source: 'IMPORT', correlation_id: record.import_reference,
    entity_type: 'IMPORT', entity_reference: record.import_reference,
    new_values: {
      import_type: record.import_type,
      original_filename: record.original_filename,
      total_rows: record.rows.length,
      success_rows: successes.length,
      failed_rows: failures.length,
    },
    description: `Imported ${record.import_type}: ${successes.length} success, ${failures.length} failed`,
  });

  return {
    import_reference: record.import_reference,
    import_type: record.import_type,
    summary: { total: record.rows.length, success: successes.length, failed: failures.length },
    successes,
    error_file_token: errorRecord?.token || null,
  };
}

async function cancel(req) {
  await PermissionService.assertAny(req.user.id, 'IMPORT_DATA');
  const record = await ownedRecord(req.params.previewToken, req.user.id, false);
  await PreviewStorage.remove(record.token);
  await ActivityLog.log(req, {
    module: 'IMPORT', action: ACTIVITY_ACTIONS.IMPORT, source: 'IMPORT', correlation_id: record.import_reference,
    entity_type: 'IMPORT', entity_reference: record.import_reference,
    new_values: { phase: 'CANCEL', import_type: record.import_type },
    description: `Canceled ${record.import_type} import preview`,
  });
  return { preview_token: record.token, import_reference: record.import_reference, status: 'CANCELED' };
}

async function downloadErrors(req) {
  await PermissionService.assertAny(req.user.id, 'IMPORT_DATA');
  const record = await ownedRecord(req.params.errorFileToken, req.user.id, true);
  if (!record.rows?.length) throw appError('Import has no failed rows', 404, 'IMPORT_ERRORS_NOT_FOUND');

  const output = record.rows.map((row) => ({
    ...row.original,
    _source_row: row.source_row,
    _import_action: row.action,
    _import_status: row.status,
    _error_code: row.status === 'INVALID' ? 'VALIDATION_ERROR' : 'COMMIT_ERROR',
    _error_message: (row.errors || []).join(' | '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(output);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Errors');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return {
    buffer,
    filename: `asset-${record.import_type.toLowerCase()}-${record.import_reference}-errors.xlsx`,
  };
}

const templates = {
  ASSET: ['asset_number', 'asset_name', 'category_code', 'brand_code', 'model_name', 'serial_number', 'managing_department_id', 'company_id', 'location_code', 'status', 'asset_condition', 'purchase_date', 'purchase_cost', 'vendor_code', 'warranty_until', 'current_assignment_type', 'assigned_user_id', 'assigned_user_name_snapshot', 'assigned_department_id', 'assigned_department_name_snapshot', 'assigned_location_code', 'assigned_at', 'assignment_purpose', 'notes'],
  CONSUMABLE: ['consumable_code', 'name', 'category_code', 'brand_code', 'variant', 'uom_code', 'managing_department_id', 'company_id', 'minimum_stock', 'notes'],
  CONSUMABLE_OPENING_STOCK: ['consumable_code', 'location_code', 'opening_quantity', 'unit_cost', 'as_of_date', 'notes'],
  CATEGORY: ['code', 'name', 'tracking_type', 'is_depreciable', 'is_active'],
  LOCATION: ['code', 'name', 'parent_code', 'location_type', 'company_id', 'is_active'],
  VENDOR: ['code', 'name', 'contact_name', 'phone', 'email', 'address', 'notes', 'is_active'],
  BRAND: ['code', 'name', 'is_active'],
  MODEL: ['brand_code', 'code', 'name', 'is_active'],
  DEPRECIATION_POLICY: ['name', 'managing_department_id', 'company_id', 'method', 'useful_life_months', 'salvage_value_type', 'salvage_value', 'is_active'],
};

async function template(req) {
  await PermissionService.assertAny(req.user.id, 'IMPORT_DATA');
  const type = String(req.params.type || '').toUpperCase();
  if (!templates[type]) throw appError('Unsupported import type', 400, 'IMPORT_TYPE_NOT_SUPPORTED');

  const worksheet = XLSX.utils.aoa_to_sheet([templates[type], templates[type].map(() => null)]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Import');

  await ActivityLog.log(req, {
    module: 'IMPORT', action: ACTIVITY_ACTIONS.DOWNLOAD_TEMPLATE,
    entity_type: 'IMPORT_TEMPLATE', entity_reference: type,
    description: `Downloaded ${type} import template`,
  });

  return {
    buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    filename: `asset-${type.toLowerCase()}-import-template.xlsx`,
  };
}

module.exports = { SUPPORTED, preview, getPreview, commit, cancel, downloadErrors, template };
