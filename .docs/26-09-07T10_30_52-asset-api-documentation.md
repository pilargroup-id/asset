# Asset API Documentation

## Normal API authentication

Normal `/api/*` application endpoints require PilarGroup Bearer JWT, fresh `/auth/me` context, app access `asset`, and local permissions where applicable.

Internal endpoints under `/api/internal/*` use `X-Internal-Secret` instead and are documented separately in `asset-ticket-integration-api.md`.

## Auth

```http
GET /api/auth/me
```

## Dashboard

```http
GET /api/dashboard/api/dashboard
```

## Directory

```http
GET /api/directory/users
GET /api/directory/departments
GET /api/directory/companies
```

## Master data

```http
GET  /api/master/:type
GET  /api/master/:type/:id
POST /api/master/:type
PUT  /api/master/:type/:id
```

## Permissions

```http
GET    /api/permissions/effective
GET    /api/permissions
GET    /api/permissions/assignments
POST   /api/permissions/assignments
DELETE /api/permissions/assignments/:id
```

## Numbering

```http
GET  /api/numbering
POST /api/numbering
PUT  /api/numbering/:id
```

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

Asset history response includes external references in addition to business history, assignments, transfers and maintenance.

## Consumables

```http
GET  /api/consumables
POST /api/consumables
GET  /api/consumables/:id
PUT  /api/consumables/:id
GET  /api/consumables/:id/history
POST /api/consumables/:id/movements
```

Movement permission is checked by movement type in service logic.

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

MVP calculation implements straight-line depreciation.

## Import

```http
GET    /api/import/templates/:type
POST   /api/import/:type/preview
GET    /api/import/preview/:previewToken
POST   /api/import/commit
DELETE /api/import/preview/:previewToken
GET    /api/import/errors/:errorFileToken
```

## Export

```http
GET /api/export/:type
```

Exports are streamed and recorded only in Activity Log.

## Activity log

```http
GET /api/activity-logs
```

Supported filters include module, action, user, entity, source and correlation ID as implemented by the service.

## Internal integration

```http
GET  /api/internal/assets/assigned
GET  /api/internal/assets/:assetId/external-references
POST /api/internal/assets/:assetId/external-references
```

See the separate Ticket integration document for the contract and usage rules.
