# Asset Backend Architecture

## Purpose

Project `asset` is the Pilar Group multi-department Asset Management backend. It is not an IT-only application. IT, HCGA, and future departments use the same core domain with configurable managing department, permission scope, numbering, category, and depreciation policy.

## Root structure

```text
asset/
├── .docs/
├── .git/
├── backend/
└── frontend/
```

Backend structure:

```text
backend/
├── database/
│   ├── migrations/
│   ├── schema/
│   └── seeds/
├── scripts/
├── src/
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── validators/
├── storage/
│   └── import-previews/
│       └── .gitkeep
├── .env.example
└── package.json
```

`storage/import-previews/` is only temporary state for import preview/error JSON. It never stores uploaded XLSX/XLS/CSV, exports, templates, or generated error XLSX files.

## Request architecture

```text
HTTP Request
  ↓
Routes
  ↓
authenticate
  ↓
requireApp(APP_SLUG=asset)
  ↓
requirePermission(...)
  ↓
Controller
  ↓
Service
  ↓
Model
  ↓
MariaDB
```

Business scope is also checked inside services. Route-level permission is not treated as sufficient authorization for department/company scoped records.

## Authentication

Authentication remains centralized in `pilargroup.id`.

```text
JWT
→ verify shared JWT_SECRET
→ fetch current /api/auth/me
→ req.user
```

Canonical external identifiers:

```text
User       = /auth/me.id              UUID string
Department = department.id            integer
Company    = company.id               string, e.g. comp-pnm-0001
```

`internal_id` is not the primary authorization identifier.

The Asset app does not implement or audit local LOGIN/LOGOUT events.

## Authorization

Authorization is generic:

```text
Permission + Scope
```

Scopes:

```text
GLOBAL
COMPANY
DEPARTMENT
```

There is no rule such as `IT = automatic full access`. Initial administrators are explicitly bootstrapped using PilarGroup user UUIDs through `BOOTSTRAP_ADMIN_USER_IDS`, after which permissions are managed normally.

## Serialized asset domain

Core pieces:

```text
assets
asset_attribute_values
asset_assignments
asset_transfers
asset_maintenances
asset_history
```

Ordinary asset update cannot directly change:

```text
asset_number
managing_department_id
company_id
current_location_id
status
current_assignment_id
```

Those changes must go through the appropriate business transaction so history is preserved.

## Consumable domain

Core pieces:

```text
consumables
consumable_stock_balances
consumable_stock_transactions
```

Current balance is a query/performance state. Stock movements remain the audit source. ISSUE supports recipient context.

## Depreciation domain

```text
depreciation_policies
category_depreciation_defaults
asset_depreciation_configs
asset_depreciation_revisions
asset_depreciation_ledger
```

Policy is a template. Asset depreciation config is a historical snapshot. Finalized ledger periods are not rewritten by later policy edits.

## Import architecture

The import interaction follows the Itembase-style temporary preview model without import database tables.

```text
multipart upload
  ↓
Multer memoryStorage
  ↓
parse XLSX/XLS/CSV from request Buffer
  ↓
validate rows
  ↓
write parsed preview state to temporary JSON
backend/storage/import-previews/<preview_token>.json
  ↓
return preview_token
```

The uploaded binary is never persisted.

Commit:

```text
preview_token
  ↓
read temporary JSON
  ↓
revalidate each eligible row
  ↓
commit each row independently
  ↓
write Activity Log summary + per-entity audit
  ↓
remove preview JSON
```

If rows fail, only failed row data is saved to a new temporary JSON identified by `error_file_token`. The XLSX error workbook is generated in memory when downloaded.

Temporary JSON default TTL is 60 minutes. Expired state is deleted by `preview-storage.service.js` cleanup.

There are intentionally no `import_batches` or `import_batch_rows` tables.

## Asset import CREATE / UPDATE

`asset_number` is the pivot when present:

```text
asset_number exists in DB → UPDATE
asset_number not found    → CREATE using imported number
asset_number blank        → CREATE using numbering engine
```

Standard import UPDATE only patches asset master/detail fields. It cannot perform transfer, assignment, return, or lifecycle transitions.

Every effective imported asset UPDATE records meaningful `old_values` / `new_values` and uses the import correlation ID.

## Export/template/error files

The following are generated in memory and streamed directly:

```text
Import templates
Exports
Import error XLSX
```

No generated binary file is retained on disk.

## Audit architecture

`asset_history` and `activity_logs` are separate.

- `asset_history`: business timeline of an asset.
- `activity_logs`: who did what in the application.

Import commit produces:

1. one `IMPORT` summary activity log;
2. per-entity activity logs for actual creates/updates/movements;
3. `source = IMPORT` and one shared `correlation_id` (`import_reference`) on related logs.

Imported asset updates store only meaningful changed fields in `old_values` and `new_values`.

Failed authenticated mutating requests are audited best-effort by the global error middleware with sensitive payload fields sanitized.

## Central directory

`pilargroup-directory.service.js` is the single integration boundary for central users/departments/companies. Asset does not maintain a duplicate employee master.

## Implementation defaults

```text
APP_SLUG                         = asset
IMPORT_MAX_FILE_MB               = 20
IMPORT_PREVIEW_TTL_MINUTES       = 60
ALLOW_NEGATIVE_CONSUMABLE_STOCK = false
Depreciation MVP method          = STRAIGHT_LINE
```
