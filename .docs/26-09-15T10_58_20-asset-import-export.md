# Asset Import and Export Reference

## Storage architecture

Original spreadsheet **tidak disimpan**.

```text
multipart file
-> multer.memoryStorage
-> XLSX parse memory
-> normalized preview JSON
-> backend/storage/import-previews/<token>.json
-> commit/cancel/TTL remove
```

Generated template/export/error XLSX dibuat di memory dan langsung response blob.

## Upload constraints

- field multipart: `file`
- extensions: `.xlsx`, `.xls`, `.csv`
- max default: `IMPORT_MAX_FILE_MB=20`
- preview TTL default 60 menit

## Supported import types

- ASSET
- CONSUMABLE
- CONSUMABLE_OPENING_STOCK
- CATEGORY
- LOCATION
- VENDOR
- BRAND
- MODEL
- DEPRECIATION_POLICY

Endpoint `:type` case-insensitive karena service uppercase.

## Preview flow

```http
POST /api/import/:type/preview
```

Response row status:

- `VALID`
- `WARNING`
- `INVALID`

Commit tetap mencoba row WARNING. Row INVALID langsung masuk failure result.

Preview token hanya boleh dipakai user UUID yang membuatnya.

## ASSET template

Columns exact:

```text
asset_number
asset_name
category_code
brand_code
model_name
serial_number
managing_department_id
company_id
location_code
status
asset_condition
purchase_date
purchase_cost
vendor_code
warranty_until
current_assignment_type
assigned_user_id
assigned_user_name_snapshot
assigned_department_id
assigned_department_name_snapshot
assigned_location_code
assigned_at
assignment_purpose
notes
```

### CREATE vs UPDATE

- `asset_number` terisi dan ditemukan -> UPDATE.
- `asset_number` terisi tidak ditemukan -> CREATE dengan nomor itu.
- `asset_number` kosong -> CREATE dan generate numbering saat commit.

### CREATE required

- asset_name
- category_code
- managing_department_id
- company_id

### CREATE current assignment migration

Jika `current_assignment_type` diisi:

- USER -> assigned_user_id wajib
- DEPARTMENT -> assigned_department_id wajib
- LOCATION -> assigned_location_code wajib
- SHARED_POOL -> no target required

Backend create Asset lalu create assignment; status dipaksa ASSIGNED. Ini ditujukan migration/onboarding, bukan operational daily reassignment.

### UPDATE patchable fields

- asset_name
- category_code
- brand_code
- model_name
- serial_number
- asset_condition
- purchase_date
- purchase_cost
- vendor_code
- warranty_until
- notes

### UPDATE forbidden via import

- company_id change -> gunakan Transfer
- managing_department_id change -> Transfer
- location_code change -> Transfer
- status change -> lifecycle operation
- current assignment fields -> Assignment/Return

Jika tidak ada patch field, preview WARNING dan commit dapat menghasilkan `changed=false` tanpa per-Asset update log.

## CONSUMABLE template

```text
consumable_code
name
category_code
brand_code
variant
uom_code
managing_department_id
company_id
minimum_stock
notes
```

Current import **create only**. Existing consumable_code = validation error.

Required: name, category_code (CONSUMABLE), uom_code, managing_department_id, company_id.

Blank consumable_code -> generate numbering on commit.

## CONSUMABLE_OPENING_STOCK

```text
consumable_code
location_code
opening_quantity
unit_cost
as_of_date
notes
```

Required: consumable_code, location_code, opening_quantity.

Opening quantity cannot negative. Commit **menambahkan** quantity ke existing balance, bukan replace absolute balance, dan membuat ledger OPENING_BALANCE.

## CATEGORY import

Columns:

`code`, `name`, `tracking_type`, `is_depreciable`, `is_active`.

Requires GLOBAL `IMPORT_DATA`. Create only. Duplicate code rejected.

## LOCATION import

`code`, `name`, `parent_code`, `location_type`, `company_id`, `is_active`.

Create only. `parent_code` diresolve menjadi parent_id saat commit. `location_type` free text.

## VENDOR import

`code`, `name`, `contact_name`, `phone`, `email`, `address`, `notes`, `is_active`.

Requires GLOBAL IMPORT_DATA. Create only.

## BRAND import

`code`, `name`, `is_active`.

Requires GLOBAL IMPORT_DATA. Create only.

## MODEL import

`brand_code`, `code`, `name`, `is_active`.

Requires GLOBAL IMPORT_DATA. `name` required. `brand_code` optional dan diresolve jika supplied.

## DEPRECIATION_POLICY import

`name`, `managing_department_id`, `company_id`, `method`, `useful_life_months`, `salvage_value_type`, `salvage_value`, `is_active`.

Create only dan scope validated.

## Commit

```http
POST /api/import/commit
Content-Type: application/json

{ "preview_token": "..." }
```

Setiap row direvalidate tepat sebelum apply untuk mengurangi stale preview issue. Row diproses masing-masing dengan transaction business-nya sendiri; satu row gagal tidak otomatis rollback row lain.

Return:

- `import_reference`
- summary total/success/failed
- successes
- `error_file_token` jika ada failure

## Error download

```http
GET /api/import/errors/:errorFileToken
```

Backend membuat XLSX on-demand berisi original columns +:

- `_source_row`
- `_import_action`
- `_import_status`
- `_error_code`
- `_error_message`

## Cancel

Cancel menghapus preview JSON dan membuat Activity Log cancel context.

## Export

```http
GET /api/export/:type
```

Supported:

- ASSET_LIST
- ASSIGNMENTS
- TRANSFERS
- MAINTENANCE
- DEPRECIATION
- CONSUMABLE_STOCK
- CONSUMABLE_MOVEMENTS
- CONSUMABLE_USAGE
- ACTIVITY_LOG

Generic `EXPORT_DATA` wajib. Selain itu scope permission per type:

- Asset reports -> ASSET_REPORT
- Depreciation -> DEPRECIATION_VIEW
- Consumable reports -> CONSUMABLE_REPORT
- Activity -> ACTIVITY_LOG_EXPORT + ACTIVITY_LOG_VIEW

Export service saat ini tidak mengimplementasikan field-selection/date filter khusus; query `req.query` disimpan ke audit tetapi SQL report tidak memakai filter query tersebut selain permission scope.
