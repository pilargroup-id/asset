# Asset Backend Architecture

## Stack

- Node.js >= 20
- Express 5
- MariaDB/MySQL driver `mysql2`
- JWT shared with PilarGroup
- `xlsx` for import/export
- `multer.memoryStorage()` for upload

## Root

```text
asset/
├── .docs/
├── .git/
├── backend/
└── frontend/
```

## Backend layers

```text
routes
  -> middleware
  -> controllers
  -> services
  -> models
  -> MariaDB
```

Important cross-cutting services:

- `auth.service.js`: JWT + fresh `/auth/me`.
- `permission.service.js`: effective authorization and scope SQL.
- `pilargroup-directory.service.js`: users/departments/companies internal directory.
- `numbering.service.js`: number generator.
- `activity-log.service.js`: permanent audit.
- `preview-storage.service.js`: temporary JSON import state.
- `internal-asset.service.js`: backend-to-backend Asset integration.

## Authentication flow

Normal `/api/*` routes selain `/api/internal/*`:

```text
Bearer JWT
-> authenticate
-> resolve token + fresh PilarGroup /auth/me
-> req.user
-> requireApp('asset')
-> route permission middleware
-> service-level scope check
```

App slug final adalah `asset`. Old `assetit` bukan app slug project baru.

## Canonical identity

```text
req.user.id          UUID string, canonical user ID
req.user.departments department integer IDs
req.user.companies   company opaque string IDs
```

`internal_id` tidak digunakan sebagai key permission/audit utama.

## Authorization dua tahap

1. Route `requirePermission(code)` memastikan user punya minimal satu matching grant.
2. Service `assertScope()` / `buildScopeSql()` memastikan data yang dibaca/diubah berada di breadth yang diizinkan.

Karena itu FE tidak boleh menganggap button permission = backend pasti menerima semua target scope.

## Central directory

Frontend tidak perlu langsung call secret directory endpoint PilarGroup. Asset proxy:

```http
GET /api/directory/users
GET /api/directory/departments
GET /api/directory/companies
```

Backend menggunakan `INTERNAL_SYNC_SECRET` ke `${PILARGROUP_URL}${PILARGROUP_DIRECTORY_BASE_PATH}`.

## Internal API

`/api/internal/*` tidak menggunakan Bearer app permission. Endpoint dilindungi `X-Internal-Secret` yang dibandingkan dengan `INTERNAL_API_SECRET`.

Secret ini backend-to-backend dan **tidak boleh dikirim ke browser**.

## Import storage

Original XLSX/XLS/CSV tidak ditulis ke disk. Multer membaca file ke memory.

Parsed preview/result disimpan sementara:

```text
backend/storage/import-previews/<uuid>.json
```

- TTL default 60 menit.
- `.gitkeep` menjaga folder.
- runtime JSON di-ignore Git.
- commit/cancel/expired menghapus preview terkait.

## Response format

Success:

```json
{ "success": true, "message": "...", "data": {} }
```

Paginated:

```json
{
  "success": true,
  "message": "...",
  "data": [],
  "meta": { "page": 1, "limit": 25, "total": 100, "totalPages": 4 }
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "code": "VALIDATION_ERROR" }
}
```

## Failed request audit

Mutating request `POST/PUT/PATCH/DELETE` dan export failure akan dicoba dicatat sebagai `REQUEST_FAILED` ke Activity Log jika user authenticated. Body disanitize sebelum dicatat untuk menghindari credential leakage.
