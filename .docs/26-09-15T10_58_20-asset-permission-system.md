# Asset Permission System

## Model

Permission terdiri dari dua dimensi independen:

```text
subject = siapa yang menerima grant
scope   = data sejauh mana yang boleh diakses
```

Table: `permission_assignments`.

## Subject

- `USER`: satu PilarGroup UUID.
- `DEPARTMENT`: semua user yang auth context-nya mengandung department tersebut.
- `COMPANY`: semua user yang auth context-nya mengandung company tersebut.

Backend mencocokkan seluruh `user.departments[]`, `department_id`, `context_department_id`, seluruh `user.companies[]`, dan `company_id`.

## Access scope

- `GLOBAL`: semua data untuk permission code tersebut.
- `COMPANY`: data dengan matching `company_id`.
- `DEPARTMENT`: data dengan matching `managing_department_id`/department scope column.

## Additive / UNION resolution

Contoh user memperoleh:

```text
USER A       -> ASSET_VIEW -> DEPARTMENT 8
DEPARTMENT 8 -> ASSET_VIEW -> COMPANY comp-pnm-0001
COMPANY PNM  -> ASSET_VIEW -> GLOBAL
```

Effective result:

```json
{
  "permission_code": "ASSET_VIEW",
  "global": true,
  "companies": ["comp-pnm-0001"],
  "departments": [8],
  "sources": ["..."]
}
```

Karena GLOBAL ada, data access tidak dibatasi grant yang lebih sempit.

Tidak ada DENY. Tidak ada USER > DEPARTMENT > COMPANY priority.

## Permission codes dan fungsi

| Permission | Function |
|---|---|
| `DASHBOARD_VIEW` | Akses dashboard; isi widget masih tergantung ASSET_VIEW/CONSUMABLE_VIEW. |
| `ASSET_VIEW` | List/detail/history Asset. |
| `ASSET_CREATE` | Create Asset pada allowed company/department. |
| `ASSET_UPDATE` | Update master field Asset. |
| `ASSET_ASSIGN` | Assign + Return. |
| `ASSET_TRANSFER` | Transfer location/company/managing department; harus allowed origin dan destination. |
| `ASSET_MAINTENANCE` | Create + complete maintenance. |
| `ASSET_RETIRE` | Set terminal lifecycle LOST/RETIRED/DISPOSED/VOID. |
| `ASSET_REPORT` | Scope report/export Asset types. |
| `CONSUMABLE_VIEW` | List/detail/history consumable. |
| `CONSUMABLE_MANAGE` | Create/update master consumable. |
| `CONSUMABLE_RECEIVE` | OPENING_BALANCE/RECEIVE/RETURN stock. |
| `CONSUMABLE_ISSUE` | ISSUE stock. |
| `CONSUMABLE_TRANSFER` | TRANSFER stock. |
| `CONSUMABLE_ADJUST` | ADJUSTMENT. |
| `CONSUMABLE_WRITE_OFF` | WRITE_OFF. |
| `CONSUMABLE_REPORT` | Report/export consumable. |
| `DEPRECIATION_VIEW` | View policy/suggestion/config/ledger. |
| `DEPRECIATION_MANAGE` | Create/update policy, category default, configure/revise/generate/finalize. |
| `MASTER_VIEW` | Read master data. |
| `MASTER_MANAGE` | Manage master; current service requires GLOBAL. |
| `NUMBERING_MANAGE` | Manage numbering configs by scope. |
| `PERMISSION_MANAGE` | Manage grants; actor hanya dapat memberi grant dalam scope yang ia sendiri miliki. |
| `IMPORT_DATA` | Template/preview/commit import; per-row scope tetap divalidasi. |
| `EXPORT_DATA` | Generic ability melakukan export; export type juga membutuhkan report/view permission yang relevan. |
| `ACTIVITY_LOG_VIEW` | View Activity Log by scope. |
| `ACTIVITY_LOG_EXPORT` | Extra permission untuk export ACTIVITY_LOG. |
| `DIRECTORY_VIEW` | Proxy central directory. |

## Create assignment API

```http
POST /api/permissions/assignments
```

```json
{
  "permission_code": "ASSET_UPDATE",
  "subject_type": "DEPARTMENT",
  "subject_id": "8",
  "access_scope_type": "DEPARTMENT",
  "access_scope_id": "8"
}
```

### Conditional field rule

```text
subject_type USER       -> subject_id UUID
subject_type COMPANY    -> subject_id company string
subject_type DEPARTMENT -> subject_id positive integer string

scope GLOBAL      -> access_scope_id kosong
scope COMPANY     -> access_scope_id company string wajib
scope DEPARTMENT  -> access_scope_id numeric department id wajib
```

## Manage permission safety

Actor dengan `PERMISSION_MANAGE -> DEPARTMENT 8` tidak dapat membuat/revoke GLOBAL assignment atau department lain.

Actor GLOBAL `PERMISSION_MANAGE` dapat manage semua.

## Revoke

```http
DELETE /api/permissions/assignments/:id
```

Revoke mengubah `is_active=0`, bukan hard delete. Grant exact yang dibuat lagi akan di-reactivate.

## Bootstrap

`.env`:

```env
BOOTSTRAP_ADMIN_USER_IDS=<uuid1>,<uuid2>
```

```bash
npm run db:bootstrap
```

Setiap bootstrap user diberi USER subject + GLOBAL scope untuk seluruh active permission. Grant persistent; menghapus env tidak revoke DB record.
