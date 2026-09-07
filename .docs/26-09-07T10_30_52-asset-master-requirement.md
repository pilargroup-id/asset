# Asset Management System — Master Requirement + Final Implementation Decisions

## Final decisions added after the original master prompt

The original requirement below remains authoritative unless explicitly overridden by these newer confirmed decisions.

1. Project/app slug is `asset`; PilarGroup app `asset` will be added and old `assetit` will later be made inactive.
2. Canonical user identifier is `/auth/me.id` UUID. `internal_id` is not the primary Asset authorization identity.
3. Department IDs are integers; company IDs are opaque strings.
4. Local authorization uses one `permission_assignments` table.
5. `subject_type` = USER / COMPANY / DEPARTMENT determines who inherits a permission.
6. `access_scope_type` = GLOBAL / COMPANY / DEPARTMENT determines data breadth.
7. Matching permission assignments are additive/UNION. No DENY and no subject priority is implemented.
8. `export_history` is not required and does not exist. Export audit is stored only in `activity_logs`.
9. Import spreadsheets are not persisted. Preview/result state uses temporary JSON under `backend/storage/import-previews`, with TTL and `.gitkeep` for the directory.
10. There are no permanent import batch/row tables.
11. Asset is integration-ready for the future multi-department Ticket system using `asset_external_references` and protected internal APIs.
12. Ticket/other systems must not query the Asset DB directly or create cross-database FKs.
13. A separate Ticket integration API document is included in `.docs`.

---

# Master Prompt — Pilar Group Asset Management System

## Tujuan Dokumen

Dokumen ini adalah **master context / master prompt** untuk digunakan pada chat session lain saat merancang, membangun, mereview, atau mengembangkan sistem Asset Management baru milik Pilar Group.

Tujuan utama dokumen ini adalah memastikan AI / developer memahami konsep sistem secara utuh dan **tidak salah mengartikan requirement**, terutama terkait:

- sistem asset lintas department,
- asset serialized/non-consumable,
- consumable inventory,
- ownership dan permission berbasis department,
- flexible asset numbering,
- depreciation,
- assignment / return / transfer,
- maintenance,
- import / export,
- activity log / audit trail,
- integrasi dengan `pilargroup.id`,
- dan kebutuhan future-proof jika department lain ikut menggunakan sistem.

Dokumen ini **bukan final database schema atau final API contract**. Struktur tabel, endpoint, naming, dan implementasi teknis harus tetap disesuaikan dengan codebase aktual setelah file/database terkait diberikan.

---

# 1. Background

Saat ini Pilar Group memiliki aplikasi `assetit` yang menggunakan Snipe-IT dan fokus utamanya adalah asset IT.

Rencana baru adalah membuat sistem Asset Management baru yang:

- tidak hanya menangani asset IT,
- saat ini digunakan oleh:
  - IT,
  - HCGA,
- tetapi harus didesain agar department lain dapat menggunakan sistem yang sama di kemudian hari tanpa perlu membuat modul atau aplikasi terpisah,
- menggunakan satu core Asset Management System yang bersifat multi-department.

Konsep sistem **bukan**:

- IT Asset module,
- HCGA Asset module,
- Marketing Asset module,
- Warehouse Asset module,

yang masing-masing memiliki logic berbeda.

Konsep yang benar adalah:

> Satu Asset Management Core + Managing Department + Permission Scope + Category / Tracking Type.

---

# 2. Prinsip Utama Sistem

Sistem harus:

1. Multi-department.
2. Multi-company jika diperlukan.
3. Multi-location.
4. Menggunakan central authentication / directory dari `pilargroup.id`.
5. Tidak membuat master employee/user sendiri jika data tersebut sudah tersedia di central Pilar Group.
6. Memiliki audit trail yang kuat.
7. Tidak menghapus histori bisnis.
8. Tidak hardcode IT / HCGA pada business logic.
9. Memungkinkan future department ditambahkan hanya melalui master data / permission / configuration.
10. Memisahkan konsep:
   - serialized asset,
   - consumable inventory.
11. Memisahkan:
   - asset business history,
   - system activity log.
12. Mendukung import/export dengan validation sebelum commit.
13. Flexible numbering per department.
14. Flexible depreciation policy per department/category/asset.

---

# 3. Terminologi Utama

## 3.1 Managing Department

`Managing Department` adalah department yang bertanggung jawab mengelola asset atau consumable.

Contoh:

- Laptop → IT
- Router → IT
- Printer → IT
- Furniture → HCGA
- AC → HCGA
- Vehicle → HCGA

Managing Department **tidak selalu sama** dengan department yang memakai asset.

Contoh:

- Asset Laptop dikelola oleh IT.
- Laptop diberikan ke user Finance.
- Managing Department tetap IT.
- Current User Department bisa Finance.

---

# 4. Ownership / Custodian / Holder

Jangan menganggap satu asset hanya memiliki satu konsep "owner".

Minimal secara domain harus bisa membedakan:

- company owner,
- managing department / custodian,
- current holder / assignee,
- current location,
- department pemakai.

Contoh:

```text
Asset:
Lenovo ThinkPad E14

Company Owner:
PT Pilar Niaga Makmur

Managing Department:
IT

Current Holder:
Budi

Holder Department:
Finance

Current Location:
Duta Garden
```

Tidak semua asset harus diberikan ke user.

Assignment target harus fleksibel dan minimal mampu mendukung:

- USER
- DEPARTMENT
- LOCATION
- SHARED_POOL / shared usage
- UNASSIGNED

Jika implementasi membutuhkan model berbeda, tetap pertahankan konsep bisnis tersebut.

---

# 5. Asset Tracking Type

Sistem minimal memiliki dua tracking type utama:

```text
SERIALIZED_ASSET
CONSUMABLE
```

Jangan menentukan tracking type hanya berdasarkan nama category secara hardcode.

Contoh:

| Category | Tracking Type |
|---|---|
| Laptop | SERIALIZED_ASSET |
| Printer | SERIALIZED_ASSET |
| Router | SERIALIZED_ASSET |
| AC | SERIALIZED_ASSET |
| Furniture | SERIALIZED_ASSET |
| Printer Ink | CONSUMABLE |
| Toner | CONSUMABLE |
| AA Battery | CONSUMABLE |

Kategori `Battery` tidak otomatis selalu consumable.

Contoh:

- disposable AA Battery → CONSUMABLE
- UPS Battery → bisa SERIALIZED_ASSET atau CONSUMABLE tergantung policy
- replacement battery mahal → bisa SERIALIZED_ASSET

Keputusan tracking ditentukan dari configuration/category, bukan hardcode source code.

---

# 6. Serialized Asset

Serialized asset adalah barang yang perlu dilacak **per physical unit**.

Contoh:

- Laptop
- Desktop
- Monitor
- Printer
- Router
- Access Point
- Server
- Furniture
- Air Conditioner
- Vehicle
- equipment tertentu

Setiap serialized asset mempunyai identitas unik.

Core information secara konsep dapat meliputi:

```text
asset_number
asset_name
category
brand
model
serial_number

managing_department
company
location

status
condition

purchase_date
purchase_cost
vendor
warranty_until

current_assignment

depreciation information
```

Detail final field harus menyesuaikan schema aktual.

---

# 7. Asset Category dan Custom Attributes

Jangan memasukkan seluruh detail setiap jenis asset ke satu tabel `assets`.

Contoh field khusus Laptop:

- Processor
- RAM
- Storage
- Operating System

Contoh Vehicle:

- License Plate
- Chassis Number
- Engine Number
- Tax Expiry

Contoh AC:

- PK
- Refrigerant

Gunakan konsep **category-specific/custom attributes**.

Contoh:

```text
Category: Laptop

Attributes:
- Processor
- RAM
- Storage
- Operating System
```

```text
Category: Vehicle

Attributes:
- License Plate
- Chassis Number
- Engine Number
- Tax Expiry
```

Tujuannya agar penambahan jenis asset baru tidak membutuhkan penambahan banyak column baru pada core table.

---

# 8. Asset Numbering

## 8.1 Requirement

Penomoran asset **berbeda untuk setiap department**.

Tidak boleh hardcode seperti:

```text
IT = IT-AST-XXXXX
HCGA = GA-AST-XXXXX
```

di source code.

Harus ada configurable numbering engine.

---

## 8.2 Numbering Configuration

Konfigurasi minimal secara konsep harus bisa menangani:

- managing department,
- optional company,
- sequence type,
- prefix,
- pattern,
- sequence length,
- current sequence,
- starting sequence,
- reset period,
- active status.

Contoh reset:

```text
NEVER
YEARLY
MONTHLY
```

---

## 8.3 Pattern / Token

Contoh supported token secara konsep:

```text
{PREFIX}
{COMPANY}
{DEPARTMENT}
{YYYY}
{YY}
{MM}
{SEQ:4}
{SEQ:5}
{SEQ:6}
```

Contoh configuration IT:

```text
{PREFIX}-{YY}-{SEQ:5}
```

Output:

```text
IT-26-00001
```

Contoh HCGA:

```text
GA/{YYYY}/{SEQ:6}
```

Output:

```text
GA/2026/000001
```

Exact syntax token boleh disesuaikan ketika implementation dibuat.

---

## 8.4 Sequence Type

Sequence asset dan consumable harus bisa dipisahkan.

Minimal:

```text
ASSET
CONSUMABLE
```

Contoh:

```text
IT-AST-000001
IT-CNS-000001
```

Tidak harus menggunakan pattern tersebut. Itu hanya contoh.

---

## 8.5 Existing Number saat Migration

Saat import existing assets, sistem harus dapat mempertahankan nomor asset lama.

Import asset harus bisa mendukung dua kondisi:

### Existing number

Jika file memiliki `asset_number`:

```text
IT/INV/2024/00182
```

maka nomor existing dapat dipertahankan jika valid dan tidak duplicate.

### Auto generated

Jika `asset_number` kosong:

```text
asset_number = blank
```

backend generate nomor menggunakan active numbering configuration sesuai department / context.

---

## 8.6 Important

Perubahan numbering configuration **tidak boleh mengubah nomor asset yang sudah pernah diterbitkan**.

Configuration baru hanya berlaku terhadap number generation berikutnya.

---

# 9. Consumable

Consumable bukan serialized asset.

Consumable dikelola berdasarkan quantity/stock.

Contoh IT:

- printer ink,
- toner,
- AA / AAA battery,
- RJ45 connector,
- cable ties,
- cleaning supplies tertentu.

Contoh HCGA dapat berupa:

- lampu,
- cleaning chemical,
- tissue,
- trash bag,
- stationery tertentu,
- atau item lain yang mereka putuskan untuk dikelola.

Core consumable information secara konsep:

```text
consumable_code
name
category
brand
variant
uom

managing_department

minimum_stock

stock by location

cost information
```

---

# 10. Consumable Stock Ledger

Jangan hanya menyimpan current stock tanpa histori.

Setiap perubahan stock harus menghasilkan transaction / ledger.

Minimal movement type:

```text
OPENING_BALANCE
RECEIVE
ISSUE
TRANSFER
ADJUSTMENT
WRITE_OFF
RETURN
```

Contoh:

```text
Canon GI-71 Black

01 Sep
OPENING_BALANCE +20

03 Sep
ISSUE -2

05 Sep
RECEIVE +10

Current stock = 28
```

Current stock boleh dicache pada table tertentu untuk performance, tetapi source of audit harus tetap berasal dari transaction history yang konsisten.

---

# 11. Consumable by Location

Consumable harus dapat memiliki stock per location.

Contoh:

```text
Canon GI-71 Black

Duta Garden: 10
Jatake: 8
KS Tubun: 4
```

Transfer:

```text
Duta Garden -> Jatake
Qty: 3
```

tidak mengubah total stock perusahaan, tetapi mengubah stock masing-masing lokasi.

---

# 12. Consumable Recipient

Ini requirement penting.

Setiap `ISSUE` consumable harus dapat mencatat **siapa / apa yang menerima consumable tersebut**.

Jangan hanya membuat transaction:

```text
ISSUE -2
```

tanpa penerima.

Recipient harus fleksibel.

Minimal konsep recipient type:

```text
USER
DEPARTMENT
ASSET
LOCATION
GENERAL_USAGE
```

Contoh user recipient:

```text
Consumable:
Toner HP 85A

Quantity:
2

Issued By:
Azi - IT

Received By:
Budi - Finance

Purpose:
Printer Finance
```

Contoh asset recipient:

```text
Consumable:
Canon GI-71 Black

Qty:
1

Recipient Type:
ASSET

Recipient:
Printer Finance - IT-000342
```

Jika `recipient_type = USER`, maka receiving user harus jelas.

Data penerima harus dapat digunakan untuk report pemakaian consumable.

---

# 13. Asset Lifecycle

Core lifecycle secara konsep:

```text
REGISTERED
    ↓
AVAILABLE
    ↓
ASSIGNED
    ↓
RETURNED
    ↓
AVAILABLE
```

Flow lain:

```text
ASSIGNED
    ↓
MAINTENANCE
    ↓
AVAILABLE
```

atau:

```text
AVAILABLE / ASSIGNED
    ↓
LOST
```

atau:

```text
AVAILABLE
    ↓
RETIRED
    ↓
DISPOSED
```

Exact enum belum final dan harus ditentukan saat schema/workflow design.

Prinsip penting:

**jangan hard delete asset yang sudah memiliki histori bisnis.**

Jika asset invalid karena salah input, pertimbangkan:

```text
VOID
CANCELED
```

atau status lain sesuai kebutuhan final.

---

# 14. Assignment

Serialized asset harus dapat diberikan / assigned ke target yang sesuai.

Minimal konsep assignment:

```text
USER
DEPARTMENT
LOCATION
SHARED_POOL
```

Setiap assignment harus menghasilkan history.

Contoh:

```text
10 Jan 2026
Asset created

12 Jan 2026
Assigned -> Budi

04 May 2026
Returned <- Budi

07 May 2026
Assigned -> Andi
```

Current assignment dapat disimpan pada asset untuk kemudahan query, tetapi transaction/history tidak boleh hilang.

---

# 15. Return

Return adalah transaction, bukan hanya update field current holder menjadi null.

Return minimal harus dapat menyimpan:

- asset,
- returned from,
- return date,
- condition saat return,
- location destination,
- note,
- user yang melakukan transaction.

Return harus masuk Asset History dan Activity Log.

---

# 16. Transfer

Asset harus mendukung perpindahan.

Contoh:

- antar location,
- antar company jika policy mengizinkan,
- antar managing department jika business process mengizinkan.

Transfer harus dicatat sebagai transaction/history.

Jangan hanya overwrite:

```text
location_id
company_id
department_id
```

tanpa histori.

---

# 17. Maintenance

Sistem harus mempunyai module maintenance asset.

Minimal concept:

```text
asset
maintenance type
vendor
start date
completion date
cost
description/problem
result
status
note
```

Maintenance harus menjadi bagian Asset History.

Future enhancement dapat mencakup:

- preventive maintenance,
- maintenance schedule,
- reminder,
- recurring maintenance.

Tetapi itu tidak wajib MVP kecuali diminta kemudian.

---

# 18. Depreciation

Depreciation hanya relevan terhadap asset yang memang depreciable.

Consumables **tidak menggunakan asset depreciation lifecycle**.

Category/asset harus mampu menentukan apakah asset depreciable.

Contoh:

```text
is_depreciable = true
```

---

# 19. Depreciation Policy

Jangan hardcode aturan depreciation ke department atau category.

Harus ada master/configuration seperti:

```text
depreciation_policies
```

Concept field:

```text
department_id
name
method
useful_life_months

salvage_value_type
salvage_value

is_active
```

Contoh:

```text
IT - Laptop Standard

Method:
STRAIGHT_LINE

Useful Life:
48 months

Salvage:
0
```

HCGA:

```text
HCGA - Furniture Standard

Method:
STRAIGHT_LINE

Useful Life:
96 months

Salvage:
10%
```

---

# 20. Depreciation Hierarchy

Recommended concept:

```text
Department Policy
       ↓
Category Default Policy
       ↓
Asset Snapshot
       ↓
Optional Asset Override
```

Category dapat memiliki default policy.

Contoh:

| Department | Category | Policy |
|---|---|---|
| IT | Laptop | IT Laptop 48M |
| IT | Network Device | IT Network 60M |
| HCGA | Furniture | HCGA Furniture 96M |

Saat asset dibuat, policy dapat otomatis disarankan / dipilih berdasarkan category.

---

# 21. Depreciation Snapshot

Ketika policy diterapkan ke asset, parameter penting harus disimpan sebagai snapshot.

Contoh:

```text
purchase_cost
depreciation_policy_id

depreciation_method
useful_life_months
salvage_value
depreciation_start_date
```

Alasannya:

Jika policy default IT Laptop hari ini 48 bulan dan tahun depan policy diubah menjadi 36 bulan, asset lama tidak boleh otomatis ikut berubah.

Policy adalah template.

Asset depreciation configuration adalah historical snapshot.

---

# 22. Asset Depreciation Override

Department admin harus dapat override depreciation untuk asset tertentu jika diperlukan.

Contoh:

Default laptop:

```text
48 months
```

Asset khusus:

```text
Mac Studio
60 months
```

Override harus tercatat di Activity Log dan revision history.

---

# 23. Depreciation Method

Schema/configuration sebaiknya future-ready terhadap method seperti:

```text
STRAIGHT_LINE
DECLINING_BALANCE
MANUAL
```

MVP cukup implement:

```text
STRAIGHT_LINE
```

jika belum ada requirement lain.

Jangan implement method yang belum dibutuhkan hanya karena schema future-ready.

---

# 24. Depreciation Ledger

Sistem harus dapat menyimpan / menghasilkan depreciation history per period.

Concept data:

```text
asset_id
period_year
period_month

opening_book_value
depreciation_amount
accumulated_depreciation
closing_book_value

calculation_method
```

Contoh asset Rp12.000.000, 48 bulan:

```text
Monthly Depreciation = Rp250.000
```

History:

| Period | Depreciation | Accumulated | Book Value |
|---|---:|---:|---:|
| Sep 2026 | 250,000 | 250,000 | 11,750,000 |
| Oct 2026 | 250,000 | 500,000 | 11,500,000 |

---

# 25. Depreciation Revision

Jika depreciation configuration asset berubah di tengah jalan:

**Jangan rewrite historical depreciation period yang sudah closed/final.**

Buat revision effective dari tanggal/periode tertentu.

Concept:

```text
asset_depreciation_revisions

asset_id
effective_date

old_useful_life_months
new_useful_life_months

old_salvage_value
new_salvage_value

reason
changed_by
created_at
```

Exact schema akan ditentukan saat implementation.

---

# 26. Location Master

Location jangan hanya free text.

Sistem sebaiknya memiliki master location.

Hierarchy dapat mendukung:

```text
Site
└── Building
    └── Floor
        └── Room
```

Tetapi tidak semua level wajib digunakan.

Contoh sederhana:

```text
Jatake Warehouse
```

Contoh detail:

```text
Duta Garden
└── Main Office
    └── Floor 2
        └── IT Room
```

Exact hierarchy harus tetap sederhana dan tidak overengineered.

---

# 27. Vendor Master

Vendor digunakan untuk kebutuhan seperti:

- purchase information,
- maintenance provider,
- repair,
- supplier consumable.

Vendor sebaiknya menjadi master data jika dipakai berulang.

---

# 28. Brand dan Model

Brand dan model dapat menjadi master data.

Namun jangan membuat hubungan yang terlalu rigid jika real operational data membutuhkan fleksibilitas.

Final behavior ditentukan saat melihat existing data.

---

# 29. Permission Model

Permission **jangan hardcode berdasarkan department name**, misalnya:

```text
if department == IT
```

atau:

```text
if department == HCGA
```

Tidak boleh.

Gunakan generic permission + scope.

---

# 30. Permission Scope

Minimal:

```text
GLOBAL
COMPANY
DEPARTMENT
```

Contoh:

```text
ASSET_MANAGE
Scope: DEPARTMENT
Department: IT
```

artinya user hanya dapat mengelola asset yang berada dalam scope IT sesuai rule final.

HCGA menggunakan engine yang sama.

Jika future Warehouse perlu menggunakan sistem:

```text
ASSET_MANAGE
Scope: DEPARTMENT
Department: Warehouse
```

tidak membutuhkan business logic baru khusus Warehouse.

---

# 31. Permission Actions

Nama permission final belum ditentukan.

Contoh concept:

```text
ASSET_VIEW
ASSET_CREATE
ASSET_UPDATE
ASSET_ASSIGN
ASSET_TRANSFER
ASSET_MAINTENANCE
ASSET_RETIRE
ASSET_REPORT

CONSUMABLE_VIEW
CONSUMABLE_MANAGE
CONSUMABLE_ISSUE
CONSUMABLE_ADJUST

MASTER_MANAGE

ACTIVITY_LOG_VIEW
ACTIVITY_LOG_EXPORT
```

Exact granularity harus dijaga agar tidak terlalu sedikit tetapi juga tidak terlalu granular.

---

# 32. Central Authentication

Authentication dilakukan melalui `pilargroup.id`.

Child Asset Management System tidak perlu memiliki login/logout authentication flow sendiri jika menggunakan standard central auth Pilar Group.

Karena itu:

**Activity Log Asset System tidak perlu mencatat:**

```text
LOGIN
LOGOUT
LOGIN_FAILED
```

Audit authentication merupakan responsibility central `pilargroup.id`.

---

# 33. User / Department / Company Directory

Data user, department, company, dan organizational context harus mengambil sumber dari central Pilar Group jika tersedia.

Jangan membuat duplicated user master tanpa kebutuhan kuat.

Untuk historical business record, gunakan snapshot.

Contoh:

```text
assigned_user_id
assigned_user_name_snapshot

assigned_department_id
assigned_department_name_snapshot
```

Tujuan snapshot:

Jika user resign, berubah nama, pindah department, atau master central berubah, transaction history lama tetap dapat dibaca sesuai kondisi saat transaction terjadi.

---

# 34. Import / Export Philosophy

Tidak semua module perlu memiliki Import.

Import digunakan terutama untuk:

- initial setup,
- bulk data onboarding,
- migration,
- legitimate bulk master updates.

Operational transaction sebaiknya tetap dilakukan lewat workflow aplikasi supaya audit trail terjaga.

Export lebih bebas karena sifatnya read-only, tetapi export tetap harus dicatat di Activity Log.

---

# 35. Recommended Import Scope

MVP Import yang dianggap penting:

1. Assets
2. Consumables
3. Consumable Opening Stock
4. Categories
5. Locations
6. Vendors

Optional jika existing data banyak:

7. Brands
8. Models
9. Depreciation Policies

---

# 36. Import yang Tidak Menjadi Operational Import Biasa

Jangan menjadikan berikut sebagai import harian biasa:

- Asset Assignment transaction
- Asset Return
- Asset Transfer
- Operational Maintenance movement
- Depreciation Ledger
- Activity Log
- Audit Trail

Jika migration dari legacy/Snipe-IT membutuhkan data tersebut, buat **Migration Import** khusus dengan access terbatas.

---

# 37. Asset Import

Asset import minimal secara concept dapat memuat:

```text
Asset Number
Asset Name
Category
Brand
Model
Serial Number

Managing Department
Company
Location

Purchase Date
Purchase Cost
Vendor
Warranty Until

Condition
Status

Depreciation Policy
Depreciation Start Date

Current Assignment
```

Template final mengikuti field/schema final.

---

# 38. Asset Import Numbering Behavior

Asset import harus support:

```text
USE IMPORTED NUMBER
AUTO GENERATE NUMBER
```

Behavior:

- nomor tersedia → validate dan gunakan existing number jika allowed,
- nomor kosong → generate berdasarkan active numbering config.

Duplicate number harus ditolak.

---

# 39. Consumable Import

Pisahkan konsep:

## Consumable Master

Contoh:

```text
Consumable Code
Name
Category
Brand
Variant
UOM
Managing Department
Minimum Stock
```

## Opening Stock

Contoh:

```text
Consumable Code
Location
Opening Quantity
Unit Cost
As Of Date
```

Opening stock harus menghasilkan ledger transaction:

```text
OPENING_BALANCE
```

Jangan sekadar update current stock tanpa history.

---

# 40. Import Validation Flow

Import tidak boleh langsung commit setelah file upload.

Recommended flow:

```text
Upload
  ↓
Parse
  ↓
Validate
  ↓
Preview
  ↓
Show Errors / Warnings
  ↓
Confirm
  ↓
Commit
```

Contoh preview:

| Row | Data | Result |
|---:|---|---|
| 2 | Lenovo E14 | Valid |
| 3 | Dell 5420 | Category not found |
| 4 | Printer Epson | Warning: serial number blank |
| 5 | ThinkPad | Duplicate asset number |

Harus memungkinkan user mendapatkan error report jika diperlukan.

---

# 41. Missing Master during Import

Master reference seperti:

- department,
- company,
- category,
- location,
- depreciation policy,

tidak boleh diam-diam dibuat hanya karena terdapat value baru di Excel.

Default behavior:

```text
CATEGORY_NOT_FOUND
LOCATION_NOT_FOUND
etc.
```

Jika suatu hari ada feature `Allow Create Missing Master`, feature tersebut harus explicit dan default tidak aktif kecuali requirement berubah.

---

# 42. Import Permission

Import harus tunduk pada user scope.

Contoh:

IT admin dengan scope IT tidak boleh mengimport asset untuk HCGA jika tidak memiliki permission/scope.

Validation scope dilakukan di backend, bukan hanya UI.

---

# 43. Export

Recommended export:

- Asset list
- Asset report
- Assignment report
- Transfer report
- Maintenance report
- Depreciation report
- Consumable stock
- Consumable movement
- Consumable usage
- Master data tertentu
- Activity Log jika permission mengizinkan

Export harus mengikuti permission/scope user.

---

# 44. Activity Log

Activity Log adalah **core feature**, bukan fitur tambahan.

Tujuan:

> Menjawab siapa melakukan apa, kapan, terhadap data apa, dan apa yang berubah.

Activity Log berbeda dengan business history.

---

# 45. Activity Log vs Asset History

## Asset History

Menjawab:

> Apa yang terjadi pada asset ini?

Contoh:

```text
Assigned to Budi
Returned
Transferred to Jatake
Maintenance
Retired
```

## Activity Log

Menjawab:

> User melakukan apa di aplikasi?

Contoh:

```text
Azi created asset IT-000123
Azi updated asset IT-000123
Azi exported Asset Report
Azi changed depreciation configuration
Azi imported 250 assets
```

Satu action dapat menghasilkan kedua jenis history.

---

# 46. Activity Log Data

Concept fields:

```text
id

user_id
username_snapshot
user_name_snapshot

department_id_snapshot
department_name_snapshot

company_id_snapshot
company_name_snapshot

module
action

entity_type
entity_id
entity_reference
entity_name_snapshot

description

old_values
new_values

ip_address
user_agent

request_method
request_path

status
error_message

created_at
```

Exact schema belum final.

---

# 47. Activity Log Diff

Untuk update, simpan perubahan meaningful:

```text
Old:
location = Duta Garden
condition = GOOD

New:
location = Jatake
condition = FAIR
```

Tidak perlu selalu dump seluruh entity jika hanya dua field berubah.

Simpan field yang berubah agar audit lebih mudah dibaca.

---

# 48. Activity Log Action Codes

Gunakan structured action code, bukan hanya description free-text.

Contoh:

```text
CREATE
UPDATE
DELETE
ACTIVATE
DEACTIVATE

IMPORT
EXPORT
DOWNLOAD_TEMPLATE

ASSIGN
RETURN
TRANSFER

RECEIVE
ISSUE
ADJUST
WRITE_OFF

MAINTENANCE_CREATE
MAINTENANCE_COMPLETE

DEPRECIATION_UPDATE
DEPRECIATION_RECALCULATE

PERMISSION_GRANT
PERMISSION_REVOKE
```

Exact enum dapat dikembangkan sesuai modul.

---

# 49. Modul yang Wajib Diaudit

Minimal:

- Assets
- Assignments
- Returns
- Transfers
- Consumables
- Maintenance
- Depreciation
- Categories
- Locations
- Vendors
- Numbering Configuration
- Import
- Export
- Permissions
- Settings

Authentication tidak perlu dicatat di child app karena login/logout dilakukan oleh `pilargroup.id`.

---

# 50. Activity Log Import

Untuk bulk import, jangan hanya menghasilkan ribuan log yang sulit dibaca tanpa parent context.

Gunakan konsep Import Batch.

Contoh:

```text
Import ID:
IMP-20260903-00001

User:
Azi

Type:
ASSET

Rows:
500

Success:
487

Failed:
13
```

Detail row dapat berada di import history / import detail.

Activity Log cukup mampu menghubungkan action tersebut ke import batch.

---

# 51. Activity Log Export

Export juga harus dicatat.

Contoh:

```text
User:
Azi

Action:
EXPORT

Module:
ASSET

Department Scope:
IT

Format:
XLSX

Rows:
1284
```

Hal ini penting karena data seperti serial number, holder, purchase cost, dan book value keluar dari sistem.

---

# 52. Activity Log Protection

Activity Log bersifat immutable dari sisi user.

Principle:

```text
CREATE: system only
READ: authorized users
UPDATE: forbidden
DELETE: forbidden
```

Jika suatu hari ada retention/archive mechanism, itu merupakan system-level policy, bukan user delete action biasa.

---

# 53. Sensitive Data Logging

Jangan simpan secret di Activity Log.

Contoh yang tidak boleh tersimpan:

```text
password
JWT
Authorization header
cookie
refresh token
internal secret
API key
database credential
```

Field sensitif harus di-mask atau dihilangkan.

---

# 54. Activity Log Permission

Minimal concept:

```text
ACTIVITY_LOG_VIEW
ACTIVITY_LOG_EXPORT
```

dan tetap tunduk pada scope:

```text
GLOBAL
COMPANY
DEPARTMENT
```

System/security activity tertentu dapat dibatasi hanya untuk global admin.

---

# 55. Reports

Recommended reporting area:

- Asset List
- Asset by Department
- Asset by Company
- Asset by Location
- Asset by Category
- Asset by Status
- Asset by Condition
- Assignment
- Transfer
- Maintenance
- Warranty
- Depreciation / Book Value
- Consumable Stock
- Consumable Usage
- Consumable Movement
- Low Stock
- Activity Log

Tidak semua harus dibuat di MVP jika scope terlalu besar.

---

# 56. Dashboard

Dashboard harus scope-aware.

Contoh IT:

```text
Total IT Assets
Assigned
Available
Maintenance
Retired
```

HCGA hanya melihat scope HCGA sesuai permission.

Global admin dapat melihat semua.

---

# 57. Recommended Main Menu

Possible structure:

```text
Dashboard

Assets
Consumables

Assignments
Transfers
Maintenance

Reports

Master Data
- Categories
- Brands
- Models
- Locations
- Vendors
- Depreciation Policies

Data Management
- Import
- Export
- Import History
- Templates

Activity Log

Settings
- Numbering
- Permissions
- Other Configuration
```

Final menu structure dapat disederhanakan berdasarkan UX.

---

# 58. MVP Recommendation

Untuk fase awal jangan membangun seluruh possible asset features.

Recommended MVP focus:

### Core

- Asset Master
- Consumable Master
- Categories
- Locations
- Vendors

### Asset Operations

- Assignment
- Return
- Transfer
- Maintenance

### Consumable Operations

- Opening Balance
- Receive
- Issue
- Transfer
- Adjustment
- Write-Off
- Recipient tracking

### Financial

- Depreciation Policy
- Asset Depreciation Configuration
- Straight Line Depreciation
- Depreciation History

### Administration

- Flexible Numbering
- Permission / Scope
- Import / Export
- Activity Log

### Integration

- Central Auth
- User / Department / Company Directory

---

# 59. Future Features — Belum Wajib

Future ideas yang dapat dipertimbangkan tetapi jangan otomatis dibuat di MVP:

- QR Code
- Barcode scanning
- Stock opname
- Physical asset verification
- Preventive maintenance schedule
- Warranty reminder
- Depreciation automation improvement
- Asset request workflow
- Asset disposal approval
- Procurement integration
- Purchase integration
- Consumable request workflow
- Asset reservation
- License / subscription management
- Attachments
- Asset photo
- Document storage
- approval workflow
- notification
- mobile scan flow

AI / developer **tidak boleh menganggap feature di atas sebagai requirement final** sebelum dikonfirmasi.

---

# 60. Important Development Rule — Do Not Assume

Saat mulai implementation:

**JANGAN berasumsi mengenai:**

- framework final,
- existing project structure,
- route placement,
- controller pattern,
- service naming,
- middleware naming,
- auth response shape,
- `/auth/me` shape,
- database schema,
- table names,
- existing helper,
- response utility,
- error handler,
- permission implementation,
- central directory API response,
- frontend structure.

Jika implementation akan dilakukan terhadap existing repository, minta / inspect file aktual terlebih dahulu.

Contoh file yang mungkin dibutuhkan:

```text
package.json
src/app.js
src/server.js
src/routes/*
src/controllers/*
src/services/*
src/models/*
src/middleware/*
src/config/*
database/migrations/*
.env.example
```

Tetapi jangan menganggap path tersebut pasti sama.

---

# 61. Database Design Rule

Sebelum membuat migration:

1. inspect current DB/schema jika sudah ada,
2. pastikan naming convention existing,
3. jangan duplicate concept yang sudah ada,
4. gunakan FK hanya jika cocok dengan architecture,
5. central user/company/department data dapat menggunakan ID + snapshot sesuai pattern project,
6. transaction history harus dirancang agar auditable.

Database design harus mengutamakan:

- integrity,
- auditability,
- future department support,
- historical accuracy,
- query performance secukupnya,
- simple maintenance.

---

# 62. Avoid Overengineering

Future-proof bukan berarti membuat semua feature sejak awal.

Lakukan future-proof pada:

- data model,
- permission scope,
- department ownership,
- numbering configuration,
- category/custom attributes,
- depreciation policy,
- history/audit architecture.

Tetapi jangan implement feature kompleks tanpa business requirement.

---

# 63. Important Business Rules Summary

Berikut non-negotiable concepts yang sudah disepakati:

1. Sistem bukan khusus IT.
2. Saat ini IT dan HCGA adalah department utama yang mengelola asset.
3. Department lain dapat ditambahkan kemudian.
4. Managing department menentukan ownership pengelolaan.
5. Permission tidak boleh hardcode nama department.
6. Asset dan consumable adalah domain berbeda.
7. Consumable menggunakan quantity + stock ledger.
8. Consumable issue harus mencatat recipient.
9. Asset serialized memiliki lifecycle per unit.
10. Asset numbering berbeda per department dan configurable.
11. Consumable numbering dapat memiliki sequence sendiri.
12. Existing asset number harus dapat dipertahankan saat migration.
13. Asset memiliki depreciation.
14. Depreciation policy dapat berbeda antar department.
15. Category dapat memiliki default depreciation.
16. Asset dapat override depreciation.
17. Historical depreciation tidak boleh berubah sembarangan jika policy berubah.
18. Assignment/return/transfer harus memiliki transaction history.
19. Activity Log wajib.
20. Activity Log berbeda dari Asset History.
21. Activity Log harus mencatat old/new values untuk perubahan penting.
22. Import dan export harus tercatat.
23. Activity Log tidak boleh diedit/delete user.
24. Child app tidak perlu log login/logout karena authentication dari `pilargroup.id`.
25. User/department/company mengambil dari central Pilar Group jika tersedia.
26. Historical transaction memakai snapshot data jika diperlukan.
27. Import harus validate → preview → confirm → commit.
28. Scope import/export harus mengikuti permission user.
29. Business transaction jangan dilakukan sebagai overwrite tanpa history.
30. Jangan hard delete historical transaction/data yang sudah dipakai.

---

# 64. Open Decisions — Jangan Diasumsikan

Hal berikut BELUM dianggap final dan perlu dikonfirmasi ketika mulai implementation:

- nama project baru,
- subdomain baru atau tetap menggunakan `assetit`,
- tech stack backend/frontend,
- database engine,
- exact database schema,
- exact permission names,
- exact asset status enum,
- exact condition enum,
- exact maintenance status,
- numbering pattern syntax final,
- depreciation calculation cut-off rules,
- depreciation posting date behavior,
- handling asset transfer antar managing department,
- approval workflow jika diperlukan,
- attachment/photo requirement,
- document storage,
- consumable cost method,
- stock valuation method,
- whether stock can go negative,
- transaction approval requirement,
- exact location hierarchy,
- whether company-specific numbering is needed,
- whether all assets require serial number,
- whether all assignments require recipient acknowledgment,
- whether QR/barcode is MVP or future,
- data migration strategy dari Snipe-IT,
- legacy Snipe-IT fields yang harus dipertahankan.

Jika salah satu poin tersebut diperlukan untuk coding, tanyakan atau inspect source data terlebih dahulu.

---

# 65. Expected AI Behavior in Future Sessions

Saat dokumen ini diberikan kepada AI di session lain:

1. Gunakan dokumen ini sebagai authoritative business context.
2. Jangan mengubah konsep utama tanpa konfirmasi.
3. Jangan mengarang schema/code yang belum diberikan.
4. Jika user mengirim file, review file aktual tersebut.
5. Saat memberikan perubahan code:
   - jelaskan file mana yang berubah,
   - ikuti structure existing,
   - jangan invent helper/function/table.
6. Jika ada conflict antara dokumen ini dan code/schema terbaru yang diberikan user:
   - tunjukkan conflict,
   - jangan diam-diam memilih salah satunya.
7. Jika user memperbarui business rule:
   - gunakan rule terbaru,
   - dokumentasikan perubahan.
8. Bedakan requirement yang sudah final dengan ide future.
9. Jangan membuat feature hanya karena "umumnya sistem asset punya fitur tersebut".
10. Prioritaskan business requirement Pilar Group.

---

# 66. High-Level System Model

```text
                     PILARGROUP.ID
                Auth / Directory / SSO
                         │
                         ▼
              ASSET MANAGEMENT SYSTEM
                         │
        ┌────────────────┴────────────────┐
        │                                 │
 SERIALIZED ASSET                    CONSUMABLE
        │                                 │
 Asset Number                       Consumable Code
 Per-unit tracking                  Quantity tracking
        │                                 │
 Assignment                         Opening Balance
 Return                             Receive
 Transfer                           Issue
 Maintenance                        Transfer
 Depreciation                       Adjustment
 Lifecycle                          Write-Off
 Asset History                      Recipient
        │                                 │
        └────────────────┬────────────────┘
                         │
                 Managing Department
                         │
              Permission / Scope Engine
                         │
                GLOBAL / COMPANY /
                    DEPARTMENT
                         │
        ┌────────────────┴────────────────┐
        │                                 │
   Business History                 Activity Log
   Asset / Stock                    User actions
   transactions                     old/new values
```

---

# 67. Core Design Objective

Sistem harus mampu berkembang dari:

```text
IT + HCGA
```

menjadi:

```text
IT + HCGA + Department Lain
```

tanpa perubahan fundamental terhadap:

- asset core,
- consumable core,
- permission engine,
- numbering engine,
- depreciation engine,
- activity log.

Future department idealnya cukup membutuhkan:

```text
Department configuration
+ Permission
+ Categories
+ Numbering Configuration
+ Depreciation Policy
```

bukan pembuatan module baru.

---

# 68. Final Instruction for Next Session

Gunakan requirement dalam dokumen ini terlebih dahulu untuk memahami sistem.

Sebelum menulis implementation code atau database migration:

> Jangan menebak structure existing project.

Minta atau inspect file/schema yang relevan.

Jika task saat itu hanya design/concept, boleh mengusulkan struktur ideal tetapi tandai dengan jelas mana yang merupakan:

- agreed requirement,
- recommendation,
- optional future enhancement.

Tujuan utama project ini adalah membangun **central, multi-department Asset Management System Pilar Group yang auditable, configurable, dan dapat berkembang tanpa hardcode terhadap department tertentu.**
