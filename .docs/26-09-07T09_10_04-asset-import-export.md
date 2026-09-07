# Asset Import / Export — Final Concept

## Final rule

The system must not retain uploaded or generated spreadsheet binaries.

Allowed temporary storage:

```text
backend/storage/import-previews/*.json
```

This directory stores only parsed preview/error state with TTL. It does **not** store XLSX/XLS/CSV binaries.

Git keeps the empty directory through:

```text
backend/storage/import-previews/.gitkeep
```

Runtime `.json` files are ignored by Git.

## Import types

```text
ASSET
CONSUMABLE
CONSUMABLE_OPENING_STOCK
CATEGORY
LOCATION
VENDOR
BRAND
MODEL
DEPRECIATION_POLICY
```

All import routes require `IMPORT_DATA` and service-level scope validation.

## Template

```http
GET /api/import/templates/:type
```

The workbook is built in memory and returned directly.

## Preview

```http
POST /api/import/:type/preview
Content-Type: multipart/form-data
```

Field:

```text
file
```

Flow:

```text
request Buffer
→ parse workbook
→ normalize rows
→ validate references/scope/business rules
→ save parsed state as temporary JSON
→ return preview_token
```

Source XLSX/XLS/CSV is never written to disk.

Response concept:

```json
{
  "success": true,
  "data": {
    "preview_token": "uuid",
    "import_reference": "uuid",
    "import_type": "ASSET",
    "original_filename": "assets.xlsx",
    "expires_at": "...",
    "summary": {
      "total": 100,
      "valid": 87,
      "warnings": 8,
      "invalid": 5
    },
    "rows": [
      {
        "source_row": 2,
        "action": "UPDATE",
        "status": "VALID",
        "errors": [],
        "warnings": [],
        "original": {}
      }
    ]
  }
}
```

Preview TTL defaults to 60 minutes through:

```env
IMPORT_PREVIEW_TTL_MINUTES=60
```

## Reload preview

```http
GET /api/import/preview/:previewToken
```

Token is user-owned. Another user cannot use it.

## Commit

```http
POST /api/import/commit
Content-Type: application/json
```

```json
{
  "preview_token": "uuid"
}
```

The original workbook is not uploaded again.

Commit revalidates rows before writing. Each row is committed independently; one failed row does not roll back other successful rows.

After commit, the preview JSON is deleted.

Response concept:

```json
{
  "success": true,
  "data": {
    "import_reference": "uuid",
    "import_type": "ASSET",
    "summary": {
      "total": 100,
      "success": 95,
      "failed": 5
    },
    "successes": [],
    "error_file_token": "uuid"
  }
}
```

## Asset CREATE / UPDATE behavior

Pivot:

```text
asset_number
```

Rules:

```text
existing asset_number → UPDATE
new asset_number      → CREATE and preserve imported number
blank asset_number    → CREATE with numbering engine
```

For CREATE, required core fields are:

```text
asset_name
category_code
managing_department_id
company_id
```

For UPDATE, blank cells mean no change. Standard import UPDATE is limited to asset master/detail fields such as:

```text
asset_name
category
brand
model
serial_number
condition
purchase data
vendor
warranty
notes
```

Standard import UPDATE cannot change:

```text
company/managing department
location
status/lifecycle
current assignment
```

Those changes must use Transfer, Assignment/Return, or lifecycle operations.

## Imported asset audit

Each effective imported UPDATE produces an Asset activity log:

```text
module         = ASSET
action         = UPDATE
source         = IMPORT
correlation_id = import_reference
old_values     = only fields that actually changed
new_values     = only fields that actually changed
```

The asset business timeline also receives an `UPDATED` event with the same correlation context.

Example:

```json
{
  "old_values": {
    "asset_condition": "GOOD",
    "vendor_id": 3
  },
  "new_values": {
    "asset_condition": "FAIR",
    "vendor_id": 8
  }
}
```

No update audit is created for a row that produces no effective data change.

## Import summary audit

Every commit writes one permanent Activity Log summary:

```text
module         = IMPORT
action         = IMPORT
source         = IMPORT
correlation_id = import_reference
entity_reference = import_reference
```

Summary contains type, original filename metadata, total, success, and failed row counts.

This Activity Log is the permanent import history. Temporary JSON is not permanent history.

To inspect a logical import and all related entity actions, query Activity Log by:

```text
correlation_id = <import_reference>
```

## Errors

If commit has failed rows, the system saves only those failure records as another temporary JSON and returns `error_file_token`.

```http
GET /api/import/errors/:errorFileToken
```

The backend then:

```text
read failed rows from temporary JSON
→ generate XLSX in memory
→ send download response
```

No error XLSX is written to disk.

The error sheet adds:

```text
_source_row
_import_action
_import_status
_error_code
_error_message
```

Error token also expires using the same temporary storage TTL.

## Cancel

```http
DELETE /api/import/preview/:previewToken
```

Cancel deletes temporary preview JSON and does not change business data.

## Expiry cleanup

`preview-storage.service.js` removes expired JSON records during import operations. Temporary records are not database records and are safe to discard.

## Export

```http
GET /api/export/:type
```

Initial export types:

```text
ASSET_LIST
ASSIGNMENTS
TRANSFERS
MAINTENANCE
DEPRECIATION
CONSUMABLE_STOCK
CONSUMABLE_MOVEMENTS
CONSUMABLE_USAGE
ACTIVITY_LOG
```

Flow:

```text
scope-aware query
→ generate workbook in memory
→ stream response
```

`export_history` stores only audit metadata such as row count and delivered filename. The binary is never retained.

## Important non-goals

The following are not normal operational imports:

```text
Asset Transfer
Asset Return
Operational Maintenance
Depreciation Ledger
Activity Log
```

Legacy migration requiring such data should be implemented explicitly as migration behavior rather than bypassing normal business history.
