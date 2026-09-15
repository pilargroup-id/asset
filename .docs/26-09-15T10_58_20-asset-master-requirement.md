# Asset Management System — Consolidated Final Requirement

## Project

- Project/app slug: `asset`.
- Root: `.docs`, `.git`, `backend`, `frontend`.
- Semua `.md` berada di `.docs` dan memakai format `yy-mm-ddThh_mm_ss-asset-<name>.md`.
- Old `assetit` akan diinactivate setelah new Asset siap.

## Authentication and identity

- Authentication central PilarGroup.
- Canonical user ID = `/auth/me.id` UUID.
- `internal_id` bukan Asset authorization identity.
- Department ID integer.
- Company ID opaque string seperti `comp-pnm-0001`.
- Child app tidak log LOGIN/LOGOUT.

## Multi-department principle

Satu core Asset system, bukan module per IT/HCGA. Managing department menentukan custodian/pengelola, bukan selalu holder department.

Tidak boleh hardcode department name/code pada business logic.

## Permission final

Table `permission_assignments`.

- subject_type USER / COMPANY / DEPARTMENT = siapa mendapat grant.
- access_scope_type GLOBAL / COMPANY / DEPARTMENT = breadth data.
- Matching grant di-UNION/additive.
- No DENY, no subject priority.

## Domains

### Serialized Asset

Per physical unit. Business operations: create/update descriptive data, assignment, return, transfer, maintenance, terminal lifecycle, depreciation, history.

### Consumable

Quantity + per-location balance + immutable movement ledger. ISSUE wajib recipient.

## Numbering

Configurable by managing department and optional company. Separate ASSET/CONSUMABLE sequence. Existing number preserved when supplied during migration/import. Config change tidak renumber historical record.

## Depreciation

Policy template -> optional category default -> Asset snapshot -> revision. Consumable tidak depreciated. MVP calculation STRAIGHT_LINE.

## Import/export final

- Original spreadsheet tidak disimpan.
- Preview/result temporary JSON di `backend/storage/import-previews`, TTL, `.gitkeep`.
- No import batch tables.
- Export/template/error XLSX generated in memory.
- No `export_history`; export audit only `activity_logs`.
- Import preview -> confirm -> commit.
- Operational assignment/return/transfer tidak boleh dibypass normal import UPDATE.
- Import Asset migration boleh create current assignment saat CREATE untuk onboarding legacy.

## Audit

Activity Log wajib, immutable through user API, meaningful old/new diff, import/export audit, permission audit, internal link audit, failure audit.

Asset History terpisah dari Activity Log.

## Ticket preparation

Asset adalah base source physical Asset untuk future multi-department Ticket.

Implemented preparation:

- `asset_external_references`.
- internal lookup current Asset by assigned user.
- optional managing department/company filter.
- link external Ticket reference.

Ticket tidak direct query DB Asset.

## Non-negotiable data-history rules

- Jangan hard delete business history.
- Assignment/return/transfer/maintenance adalah transaction/history, bukan overwrite-only.
- Central directory data boleh berubah; historical transaction pakai snapshot name bila tersedia.
- Permission/scope validation selalu backend authoritative.

## Future features not automatically required

QR/barcode, stock opname, physical verification, preventive maintenance schedule, approval, attachments/photo, notifications, request/reservation workflow, procurement integration, disposal approval, mobile scan.

## Documentation requirement

Developer/FE yang hanya menerima source + `.docs` harus bisa memahami:

- tujuan setiap tabel dan kolom;
- setiap enum/value dan conditional fields;
- endpoint + permission + request/response + side effect;
- feature/page FE yang perlu dibuat;
- mana behavior implemented vs belum implemented.
