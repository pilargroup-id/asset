# Asset API Documentation

Base URL:

```text
/api
```

## Auth

```http
GET /api/auth/me
```

Uses PilarGroup JWT and fresh central `/auth/me` context.

## Dashboard

```http
GET /api/dashboard
```

Permission: `DASHBOARD_VIEW`.

## Directory

```http
GET /api/directory/users
GET /api/directory/departments
GET /api/directory/companies
```

Permission: `DIRECTORY_VIEW`.

## Master data

```http
GET  /api/master/:type
GET  /api/master/:type/:id
POST /api/master/:type
PUT  /api/master/:type/:id
```

Read uses `MASTER_VIEW`; writes use `MASTER_MANAGE`.

## Numbering

```http
GET  /api/numbering
POST /api/numbering
PUT  /api/numbering/:id
```

Permission: `NUMBERING_MANAGE`.

## Assets

```http
GET   /api/assets
POST  /api/assets
GET   /api/assets/:id
PUT   /api/assets/:id
GET   /api/assets/:id/history
POST  /api/assets/:id/assign
POST  /api/assets/:id/return
POST  /api/assets/:id/transfer
POST  /api/assets/:id/maintenance
PATCH /api/assets/:id/maintenance/:maintenanceId/complete
PATCH /api/assets/:id/lifecycle
```

Permissions are route-specific (`ASSET_VIEW`, `ASSET_CREATE`, `ASSET_UPDATE`, `ASSET_ASSIGN`, `ASSET_TRANSFER`, `ASSET_MAINTENANCE`, `ASSET_RETIRE`) and service scope is also enforced.

## Consumables

```http
GET  /api/consumables
POST /api/consumables
GET  /api/consumables/:id
PUT  /api/consumables/:id
GET  /api/consumables/:id/history
POST /api/consumables/:id/movements
```

## Depreciation

```http
GET   /api/depreciation/policies
POST  /api/depreciation/policies
PUT   /api/depreciation/policies/:id
PUT   /api/depreciation/category-default
GET   /api/depreciation/assets/:assetId/suggestion
GET   /api/depreciation/assets/:assetId
PUT   /api/depreciation/assets/:assetId/config
POST  /api/depreciation/assets/:assetId/revisions
POST  /api/depreciation/assets/:assetId/generate
PATCH /api/depreciation/assets/:assetId/finalize
```

## Permissions

```http
GET    /api/permissions
GET    /api/permissions/users/:userId
POST   /api/permissions/grants
DELETE /api/permissions/grants/:id
```

Permission: `PERMISSION_MANAGE`.

## Import

All routes require `IMPORT_DATA`.

```http
GET    /api/import/templates/:type
GET    /api/import/preview/:previewToken
POST   /api/import/:type/preview
POST   /api/import/commit
DELETE /api/import/preview/:previewToken
GET    /api/import/errors/:errorFileToken
```

There is no `GET /api/import` history endpoint. Permanent import history is queried through Activity Log.

Preview request:

```http
POST /api/import/ASSET/preview
Content-Type: multipart/form-data
```

Multipart field:

```text
file=<xlsx/xls/csv>
```

Commit:

```json
{
  "preview_token": "uuid"
}
```

Commit response concept:

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
    "error_file_token": "uuid-or-null"
  }
}
```

Preview/error state is temporary JSON. No import tables are used.

## Export

```http
GET /api/export/:type
```

Types:

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

The XLSX is generated in memory and returned directly.

## Activity Log

```http
GET /api/activity-logs
```

Permission: `ACTIVITY_LOG_VIEW`.

Supported query filters:

```text
module
action
user_id
entity_type
entity_id
source
correlation_id
page
limit
```

Import history examples:

```http
GET /api/activity-logs?module=IMPORT&action=IMPORT&source=IMPORT
GET /api/activity-logs?correlation_id=<import_reference>
```

## Identifier contract

Unless an endpoint explicitly expects a local entity ID:

```text
user_id / assigned_user_id / recipient_user_id = PilarGroup UUID string
company_id                                     = PilarGroup string ID
managing_department_id / department_id         = PilarGroup numeric department ID
```
