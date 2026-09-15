# Asset Documentation Index

## Status

Dokumentasi ini adalah set handoff **final berdasarkan source code, migration, seed, route, service, model, dan configuration project Asset saat dokumen dibuat**.

Semua dokumentasi lama dengan timestamp sebelum `26-09-15T10_58_20` dianggap **obsolete** dan sebaiknya dihapus agar tidak ada kontrak ganda.

## Source of truth priority

Jika terjadi perbedaan informasi, gunakan urutan berikut:

1. migration/schema + code backend aktual;
2. dokumen `asset-implementation-notes-and-gaps.md` untuk behavior yang belum lengkap/ambigu;
3. dokumen feature/API/database pada set ini;
4. master requirement untuk business intent dan future direction.

Dokumentasi ini sengaja membedakan:

- **Implemented**: benar-benar ada dan enforced oleh backend sekarang;
- **Metadata only**: field/enum ada tetapi belum punya workflow/validation penuh;
- **Recommended FE behavior**: cara UI seharusnya memanfaatkan contract backend;
- **Future / not implemented**: jangan diasumsikan tersedia.

## Daftar dokumen

| Dokumen | Tujuan |
|---|---|
| `asset-master-requirement.md` | Business requirement final dan keputusan yang sudah dikunci. |
| `asset-system-overview.md` | Terminologi, boundary sistem, source of truth, dan high-level flow. |
| `asset-backend-architecture.md` | Struktur backend, auth, layer, directory, storage, error/audit. |
| `asset-database-reference.md` | **Setiap tabel dan setiap kolom** beserta tujuan dan rule. |
| `asset-database-relationship-map.md` | Relasi FK/logical relation antar tabel dan delete semantics. |
| `asset-enum-conditional-field-reference.md` | **Semua enum/value penting**, arti, conditional field, dan efek backend. |
| `asset-api-reference.md` | Endpoint, permission, request, validation, side effect, response. |
| `asset-api-payload-cookbook.md` | Contoh payload siap pakai untuk semua action utama FE. |
| `asset-frontend-feature-map.md` | Halaman/komponen yang perlu FE buat dan endpoint yang dipakai. |
| `asset-master-data-and-custom-attributes.md` | Category, location, brand, model, UOM, vendor, custom attribute. |
| `asset-permission-system.md` | permission_assignments, subject/scope, union resolution, admin UI. |
| `asset-numbering-system.md` | numbering config, token, reset, generation behavior. |
| `asset-serialized-asset-lifecycle.md` | CRUD Asset, assignment, return, transfer, lifecycle, history. |
| `asset-consumable-system.md` | Consumable master, stock balance, movement, recipient matrix. |
| `asset-maintenance.md` | Maintenance data model dan workflow. |
| `asset-depreciation.md` | Policy, category default, snapshot, revision, ledger, finalize. |
| `asset-import-export.md` | Template per type, kolom, preview/commit, fileless behavior, audit. |
| `asset-activity-log-and-history.md` | Activity Log vs Asset History, action/source, diff dan correlation. |
| `asset-ticket-integration-api.md` | Contract backend-to-backend untuk Ticket future. |
| `asset-setup-runbook.md` | Environment, DB, bootstrap, run dan sanity check. |
| `asset-implementation-notes-and-gaps.md` | Behavior yang belum enforced/endpoint belum tersedia supaya FE tidak menebak. |

## Identitas canonical

| Data | Canonical ID |
|---|---|
| User | `/auth/me.id` UUID string |
| Department | integer PilarGroup department ID |
| Company | string seperti `comp-pnm-0001` |

`/auth/me.internal_id` bukan primary identifier Asset.
