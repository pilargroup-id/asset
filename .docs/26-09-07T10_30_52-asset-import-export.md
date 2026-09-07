# Asset Import / Export

## Storage rule

No uploaded spreadsheet or generated export is persisted.

### Import

```text
upload XLSX/XLS/CSV
-> memory buffer
-> parse + validate
-> temporary JSON preview
-> preview_token
-> commit
-> permanent business data + Activity Log
-> temporary JSON removed
```

Temporary preview location:

```text
backend/storage/import-previews/<token>.json
```

`backend/storage/import-previews/.gitkeep` keeps the directory in Git. Runtime JSON files are ignored.

Default TTL: 60 minutes, configurable through `IMPORT_PREVIEW_TTL_MINUTES`.

### Export

```text
query DB
-> generate XLSX in memory
-> stream response
-> Activity Log
```

No `export_history` table exists.

## Import endpoints

```http
GET    /api/import/templates/:type
POST   /api/import/:type/preview
GET    /api/import/preview/:previewToken
POST   /api/import/commit
DELETE /api/import/preview/:previewToken
GET    /api/import/errors/:errorFileToken
```

Commit body:

```json
{
  "preview_token": "..."
}
```

The original file is not uploaded again at commit.

## Supported import concepts

Current implementation supports:

- Asset
- Consumable
- Consumable Opening Stock
- Category
- Location
- Vendor
- Brand
- Model
- Depreciation Policy

Asset import determines CREATE/UPDATE by `asset_number` when supplied. Blank asset number on CREATE uses active numbering configuration.

Standard Asset import must not bypass business transactions. Existing Asset company, managing department, location, lifecycle status and assignment cannot be changed through normal import; use Transfer, lifecycle, Assignment/Return operations.

## Import audit

Each commit creates one `import_reference` UUID / Activity Log correlation ID.

Summary example:

```text
IMPORT correlation_id=abc
- total rows: 100
- success: 95
- failed: 5
```

Each successful Asset CREATE/UPDATE produced by the same import also logs `source=IMPORT` with the same `correlation_id`. Asset updates store meaningful old/new diffs.

## Export endpoint

```http
GET /api/export/:type
```

Supported types are defined by backend service, including Asset, assignment, transfer, maintenance, depreciation, consumable and activity-log reporting.

Every export creates an Activity Log entry containing row count, filters, generated filename and effective access scopes. The XLSX binary is never retained.
