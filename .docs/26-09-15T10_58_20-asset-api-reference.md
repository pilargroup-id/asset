# Asset API Reference

## Common conventions

Base prefix: `/api`.

Normal endpoints require Bearer JWT + app `asset`. Internal endpoints use `X-Internal-Secret`.

Success and error envelope lihat backend architecture document.

Pagination default dari pagination util dipakai Asset/Consumable/Activity Log. FE harus baca `meta` dan jangan hardcode totalPages.

---

# Authentication

## `GET /api/auth/me`

Mengembalikan resolved PilarGroup user context. Endpoint menggunakan authenticate tetapi tidak melewati requireApp karena dipasang di auth router sebelum app gate.

FE gunakan `id` UUID sebagai user identity, bukan `internal_id`.

---

# Dashboard

## `GET /api/dashboard`

Permission route: `DASHBOARD_VIEW`.

Widget Asset hanya diisi jika user juga mempunyai ASSET_VIEW. Widget Consumable hanya jika punya CONSUMABLE_VIEW.

Asset response concept:

```json
{ "assets": { "total": 100, "by_status": { "AVAILABLE": 20, "ASSIGNED": 70 } } }
```

Consumable:

```json
{ "consumables": { "total_masters": 20, "low_stock": [] } }
```

Low stock max 50 row dan berdasarkan total stock seluruh location <= minimum_stock.

---

# Directory

Permission: `DIRECTORY_VIEW`.

```http
GET /api/directory/users
GET /api/directory/departments
GET /api/directory/companies
```

Query diteruskan ke central directory. Response exact mengikuti central endpoint yang dikembalikan backend setelah unwrap `.data` bila ada.

FE use cases: user picker, department picker, company picker, permission subject/scope picker.

---

# Master Data

```http
GET  /api/master/:type
GET  /api/master/:type/:id
POST /api/master/:type
PUT  /api/master/:type/:id
```

Read: MASTER_VIEW. Create/update: MASTER_MANAGE GLOBAL.

Supported type dan allowed fields:

| type | Create required | Allowed fields |
|---|---|---|
| categories | code,name,tracking_type | code,name,tracking_type,is_depreciable,is_active |
| category_attributes | category_id,attribute_code,attribute_name | category_id,attribute_code,attribute_name,data_type,is_required,sort_order,is_active |
| locations | code,name | parent_id,code,name,location_type,company_id,is_active |
| vendors | name | code,name,contact_name,phone,email,address,notes,is_active |
| brands | name | name,code,is_active |
| models | name | brand_id,name,code,is_active |
| uoms | code,name | code,name,is_active |

Category validates tracking_type. Category attributes validates data_type. Other constraints largely come from DB unique/FK.

---

# Permissions

## `GET /api/permissions/effective`

Tidak membutuhkan PERMISSION_MANAGE; setiap authenticated app user dapat melihat effective permissions sendiri.

Response array per permission code:

```json
{
  "permission_code":"ASSET_VIEW",
  "global":false,
  "companies":["comp-pnm-0001"],
  "departments":[8],
  "sources":[{"assignment_id":1,"subject_type":"DEPARTMENT","subject_id":"8","access_scope_type":"DEPARTMENT","access_scope_id":"8"}]
}
```

## `GET /api/permissions`

PERMISSION_MANAGE. List active master permission.

## `GET /api/permissions/assignments`

Filters: `subject_type`, `subject_id`, `permission_code`, `access_scope_type`, `access_scope_id`.

Actor non-global hanya melihat assignment dalam scope PERMISSION_MANAGE miliknya.

## `POST /api/permissions/assignments`

Lihat permission document untuk conditional field matrix.

## `DELETE /api/permissions/assignments/:id`

Soft revoke is_active=0.

---

# Numbering

## `GET /api/numbering`

Permission: NUMBERING_MANAGE. Result scope-filtered.

## `POST /api/numbering`

Required managing_department_id, sequence_type, name, pattern. Scope checked terhadap target.

## `PUT /api/numbering/:id`

Scope checked against existing config. Lihat numbering doc untuk mutable fields.

---

# Assets

## `GET /api/assets`

Permission ASSET_VIEW + effective scope SQL.

Filters implemented:

- page
- limit
- status
- category_id
- location_id
- search: asset_number/asset_name/serial_number LIKE

## `GET /api/assets/:id`

ASSET_VIEW in Asset scope. Response menambahkan `attributes` dan full `assignments` history.

## `POST /api/assets`

ASSET_CREATE scope. Required asset_name/category_id/managing_department_id/company_id.

Conditional/default rules lihat Serialized Asset lifecycle doc.

## `PUT /api/assets/:id`

ASSET_UPDATE scope. Forbidden business-state fields menghasilkan `USE_BUSINESS_TRANSACTION`.

## `GET /api/assets/:id/history`

ASSET_VIEW. Aggregate history/assignments/transfers/maintenance/external references.

## `POST /api/assets/:id/assign`

ASSET_ASSIGN. Conditional target fields berdasarkan assignment_type.

## `POST /api/assets/:id/return`

ASSET_ASSIGN. Asset harus active assigned.

## `POST /api/assets/:id/transfer`

ASSET_TRANSFER pada origin dan destination scope.

## `POST /api/assets/:id/maintenance`

ASSET_MAINTENANCE. maintenance_type required.

## `PATCH /api/assets/:id/maintenance/:maintenanceId/complete`

ASSET_MAINTENANCE. Completes exact maintenance belonging to Asset.

## `PATCH /api/assets/:id/lifecycle`

ASSET_RETIRE. status optional default RETIRED; jika dikirim hanya LOST/RETIRED/DISPOSED/VOID.

---

# Consumables

## `GET /api/consumables`

CONSUMABLE_VIEW + scope.

Filters implemented:

- page/limit
- category_id
- is_active
- search code/name/variant

List response includes `total_stock` aggregated.

## `POST /api/consumables`

CONSUMABLE_MANAGE scope. Required name/category_id/uom_id/managing_department_id/company_id.

## `GET /api/consumables/:id`

Adds balances per location.

## `PUT /api/consumables/:id`

CONSUMABLE_MANAGE. consumable_code/managing_department_id/company_id forbidden.

## `GET /api/consumables/:id/history`

Returns master + balances + transactions.

## `POST /api/consumables/:id/movements`

Route only checks CONSUMABLE_VIEW; **service then checks movement-specific permission**. FE button visibility harus berdasarkan movement-specific permission, bukan hanya route permission.

Lihat Consumable doc untuk payload matrix.

---

# Depreciation

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

GET uses DEPRECIATION_VIEW; write uses DEPRECIATION_MANAGE + target scope. Detailed bodies/defaults ada di depreciation document.

---

# Import

```http
GET    /api/import/templates/:type
POST   /api/import/:type/preview
GET    /api/import/preview/:previewToken
POST   /api/import/commit
DELETE /api/import/preview/:previewToken
GET    /api/import/errors/:errorFileToken
```

Semua membutuhkan IMPORT_DATA. Preview upload `multipart/form-data` field `file`.

Detailed type/column rules ada di import-export document.

---

# Export

```http
GET /api/export/:type
```

Response binary XLSX. FE gunakan `responseType: blob`.

Header:

- Content-Type xlsx
- Content-Disposition filename
- X-Export-Row-Count
- Cache-Control no-store

Supported types dan extra permission ada di import-export doc.

---

# Activity Log

## `GET /api/activity-logs`

Permission ACTIVITY_LOG_VIEW, scope filtered.

Filters: module, action, user_id, entity_type, entity_id, source, correlation_id, page, limit.

---

# Internal API

Tidak memakai Bearer user app flow.

```http
GET  /api/internal/assets/assigned
GET  /api/internal/assets/:assetId/external-references
POST /api/internal/assets/:assetId/external-references
```

Header `X-Internal-Secret`. Contract lengkap di Ticket integration document.

---

# Common error codes FE should handle

| Code | Meaning / UI reaction |
|---|---|
| `TOKEN_INVALID` / auth errors | session/login handling |
| `APP_FORBIDDEN` | user belum memiliki app `asset` |
| `PERMISSION_FORBIDDEN` | hide/disable capability or show forbidden |
| `PERMISSION_SCOPE_FORBIDDEN` | selected target di luar allowed scope |
| `GLOBAL_SCOPE_REQUIRED` | operation requires global admin scope |
| `VALIDATION_ERROR` | show field/business message |
| `DUPLICATE_ENTRY` | unique constraint conflict |
| `ASSET_NOT_FOUND` / `CONSUMABLE_NOT_FOUND` | 404 |
| `ASSET_ALREADY_ASSIGNED` | return/current assignment must be handled first |
| `ASSET_NOT_ASSIGNED` | return invalid |
| `USE_BUSINESS_TRANSACTION` | FE used wrong endpoint for state field |
| `INSUFFICIENT_STOCK` | show current stock/requested delta |
| `NUMBERING_CONFIG_NOT_FOUND` | admin must configure numbering |
| `DEPRECIATION_METHOD_NOT_IMPLEMENTED` | only STRAIGHT_LINE MVP |
| `PREVIEW_EXPIRED` | user must re-upload import |
| `IMPORT_FILE_TOO_LARGE` / `IMPORT_FILE_TYPE_NOT_ALLOWED` | upload validation |
| `EXPORT_TYPE_NOT_SUPPORTED` / `IMPORT_TYPE_NOT_SUPPORTED` | FE type mismatch |
