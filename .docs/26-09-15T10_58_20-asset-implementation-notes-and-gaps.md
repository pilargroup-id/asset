# Asset Implementation Notes and Known Gaps

Dokumen ini sengaja mencatat area di mana schema future-ready tetapi workflow/validation backend belum lengkap. Ini **bukan error dokumentasi**; ini kondisi code saat ini yang harus diketahui BE/FE.

## Location type

`master_locations.location_type` adalah VARCHAR free text. Tidak ada enum atau behavior conditional. Jangan membuat assumption SITE/BUILDING/FLOOR/ROOM sebagai backend contract.

## Location hierarchy validation

`parent_id` self-FK ada, tetapi belum ada cycle detection atau rule parent type. Admin secara teknis bisa membuat hierarchy yang tidak logis jika DB FK tetap valid.

## Required custom attributes

`master_category_attributes.is_required` disimpan tetapi Asset service tidak mengecek seluruh required attribute sudah dikirim. FE dapat enforce untuk UX, tetapi backend integrity belum penuh.

## Active master validation

Tidak semua transaction/service memeriksa `is_active` dari referenced master. Misalnya category lookup Asset memeriksa existence/tracking_type tetapi bukan `is_active`. FE sebaiknya hanya menampilkan active reference; backend enhancement disarankan untuk hard integrity.

## Maintenance statuses

DB enum mempunyai OPEN/IN_PROGRESS/COMPLETED/CANCELED. Public workflow hanya create dan complete. No dedicated IN_PROGRESS/CANCEL endpoint.

## Maintenance type

Free text, bukan enum/master. Standardisasi nilai jika diperlukan belum diputuskan.

## LOST maintenance

Start maintenance hanya memblokir RETIRED/DISPOSED/VOID; LOST tidak diblokir code saat ini. Jika business ingin LOST tidak maintainable, backend rule perlu ditambah.

## Consumable ownership move

Normal Consumable update melarang managing_department_id/company_id. Belum ada dedicated transfer ownership endpoint untuk Consumable master. Stock location transfer tetap ada.

## Master authorization breadth

Create/update master membutuhkan GLOBAL MASTER_MANAGE. Ini lebih strict daripada master read dan beberapa import flow. Jika nanti department admin harus manage location/category scoped sendiri, permission design/service perlu direvisi.

## Master list pagination/search

Master list tidak paginated dan tidak punya generic search. Current filters limited to exact keys.

## Asset list explicit company/department filter

Effective scope restricts access, tetapi model list belum menerima query filter company_id/managing_department_id. Kalau UI global admin perlu filter, backend enhancement diperlukan.

## Global operational list endpoints

Tidak ada JSON list endpoint global assignments/transfers/maintenance. Hanya per-Asset history dan export report.

## Depreciation future methods

DECLINING_BALANCE/MANUAL ada di DB enum/policy but calculation service rejects non-STRAIGHT_LINE for Asset config/revision/generation flow. FE MVP only offer STRAIGHT_LINE.

## Depreciation finalized historical revision

Revision service records effective_date and changes config, tetapi belum melakukan explicit guard terhadap revision effective date yang menyentuh closed/final ledger period. Ledger generator protects finalized rows from overwrite, tetapi higher-level accounting policy cutoff perlu diputuskan.

## Depreciation period input

Finalize service belum explicit validate month 1..12/year domain before SQL update.

## Export filters

Export audit menyimpan `req.query`, tetapi current export SQL tidak menggunakan custom query filters/date/field selection. Report selalu seluruh row dalam allowed permission scope.

## Import truthy parsing

Import boolean helper hanya mengenali `1,true,yes,y,active` sebagai true; value lain menjadi false. Template belum memiliki reference sheet/validation dropdown. FE/data owner harus menggunakan controlled values.

## Import Asset custom attributes

Current Asset import template tidak mempunyai custom attribute columns. Custom attributes dapat dikelola API normal; migration custom attribute bulk import perlu enhancement jika diperlukan.

## Import master update

CATEGORY/LOCATION/VENDOR/BRAND/MODEL/DEPRECIATION_POLICY imports current implementation create-oriented; duplicate pivot umumnya rejected. Bukan bulk patch system seperti Itembase parent/item import.

## External reference unlink

Internal API dapat link dan list, belum ada unlink endpoint. Ini cocok immutable/history-first MVP tetapi Ticket cancellation/relink requirement perlu keputusan nanti.

## Activity Log entity_id

`entity_id` numeric BIGINT. Cocok local entities; external opaque reference ID disimpan pada new_values/reference fields, bukan entity_id.

## `asset_history.event_type` and Activity `action/source`

Beberapa columns sengaja VARCHAR, bukan ENUM, agar extensible. FE wajib fallback unknown value.
