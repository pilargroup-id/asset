# Asset Database Reference

## Purpose

Dokumen ini adalah **data dictionary**. Setiap tabel dan setiap kolom schema final dijelaskan berdasarkan migration aktual.

## Identity rules

| Concept | DB representation | Source |
|---|---|---|
| User | `CHAR(36)` | PilarGroup `/auth/me.id` UUID |
| Department | `BIGINT UNSIGNED` atau numeric string di generic permission subject/scope | PilarGroup department ID |
| Company | `VARCHAR(64)` | PilarGroup company ID string |

Central user/company/department tidak mempunyai FK lokal karena source of truth berada di PilarGroup.

## Database groups

- Master/configuration
- Authorization
- Serialized Asset
- Consumable
- Depreciation
- Audit

Tidak ada `import_batches`, `import_batch_rows`, atau `export_history`.

---

# `master_brands`

**Purpose:** Master brand reusable untuk Asset dan Consumable.

**Row grain:** Satu row = satu brand.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key lokal. |
| `name` | `VARCHAR(150) NOT NULL` | Nama brand. UNIQUE dan wajib. |
| `code` | `VARCHAR(80) NULL` | Kode brand opsional. Jika diisi harus unik; dipakai oleh import sebagai reference. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | 1 = tersedia untuk penggunaan baru; 0 = inactive tetapi historical FK tetap valid. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create DB. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update terakhir DB. |

---

# `master_models`

**Purpose:** Master model produk/equipment. Model dapat dikaitkan ke brand.

**Row grain:** Satu row = satu model.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key lokal. |
| `brand_id` | `BIGINT UNSIGNED NULL` | FK opsional ke master_brands. NULL berarti model tidak dikunci ke satu brand. |
| `name` | `VARCHAR(150) NOT NULL` | Nama model. Kombinasi brand_id + name unik. |
| `code` | `VARCHAR(80) NULL` | Kode model opsional. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | Status active master. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update. |

---

# `master_uoms`

**Purpose:** Master unit of measure untuk Consumable.

**Row grain:** Satu row = satu UOM seperti PCS, BOX, LITER.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key lokal. |
| `code` | `VARCHAR(50) NOT NULL` | Kode UOM unik, contoh PCS/BOX/LITER. |
| `name` | `VARCHAR(100) NOT NULL` | Nama UOM unik. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | Status active master. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update. |

---

# `master_vendors`

**Purpose:** Master vendor/supplier/repair provider yang dapat dipakai purchase dan maintenance.

**Row grain:** Satu row = satu vendor.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key lokal. |
| `code` | `VARCHAR(80) NULL` | Kode vendor opsional dan unik. |
| `name` | `VARCHAR(180) NOT NULL` | Nama vendor wajib. |
| `contact_name` | `VARCHAR(150) NULL` | Nama PIC vendor opsional. |
| `phone` | `VARCHAR(80) NULL` | Nomor telepon vendor opsional. |
| `email` | `VARCHAR(180) NULL` | Email vendor opsional. |
| `address` | `TEXT NULL` | Alamat vendor opsional. |
| `notes` | `TEXT NULL` | Catatan internal vendor. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | Status active master. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update. |

---

# `master_locations`

**Purpose:** Master lokasi fisik untuk Asset dan stok Consumable. Mendukung hierarchy opsional.

**Row grain:** Satu row = satu node lokasi.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key lokal. |
| `parent_id` | `BIGINT UNSIGNED NULL` | Self-FK opsional untuk hierarchy. Contoh Room -> Floor -> Building -> Site. |
| `code` | `VARCHAR(80) NOT NULL` | Kode lokasi unik. Dipakai import/reference. |
| `name` | `VARCHAR(180) NOT NULL` | Nama lokasi. |
| `location_type` | `VARCHAR(80) NULL` | Metadata jenis node lokasi. SAAT INI bukan ENUM dan tidak punya business logic/validation. Contoh yang boleh disepakati UI: SITE, BUILDING, FLOOR, ROOM, WAREHOUSE; backend menerima string lain. |
| `company_id` | `VARCHAR(64) NULL COMMENT 'Central PilarGroup company id string; intentionally no FK'` | Optional central company ID string. Tidak FK karena source ada di PilarGroup. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | Status active master. Backend saat ini belum otomatis menolak lokasi inactive pada semua transaksi. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update. |

**Business / implementation rules:**
- `location_type` saat ini sengaja fleksibel; backend tidak memiliki enum/validation. Jika FE ingin dropdown, daftar value harus disepakati product dan jangan dianggap contract backend.
- `parent_id` membentuk hierarchy tetapi backend belum melakukan cycle-detection. FE/admin harus mencegah parent ke diri sendiri/descendant sampai backend ditingkatkan.
- Historical FK memakai ON DELETE RESTRICT/SET NULL; rekomendasi operasional adalah deactivate via is_active, bukan hard delete.

---

# `master_categories`

**Purpose:** Master kategori yang menentukan domain tracking: Serialized Asset atau Consumable, dan apakah kategori dapat didepresiasi.

**Row grain:** Satu row = satu kategori.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key lokal. |
| `code` | `VARCHAR(80) NOT NULL` | Kode kategori unik. |
| `name` | `VARCHAR(180) NOT NULL` | Nama kategori. |
| `tracking_type` | `ENUM('SERIALIZED_ASSET','CONSUMABLE') NOT NULL` | SERIALIZED_ASSET atau CONSUMABLE. Menentukan category boleh dipakai pada assets atau consumables. |
| `is_depreciable` | `TINYINT(1) NOT NULL DEFAULT 0` | 1 = Asset di kategori ini boleh dikonfigurasi depresiasi; 0 = endpoint config depreciation akan menolak. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | Status active master. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update. |

---

# `master_category_attributes`

**Purpose:** Definisi custom attribute per kategori Serialized Asset.

**Row grain:** Satu row = satu definisi field dinamis untuk satu kategori.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key definisi attribute. |
| `category_id` | `BIGINT UNSIGNED NOT NULL` | FK kategori pemilik attribute. |
| `attribute_code` | `VARCHAR(80) NOT NULL` | Kode attribute unik dalam kategori. |
| `attribute_name` | `VARCHAR(150) NOT NULL` | Label field untuk UI. |
| `data_type` | `ENUM('TEXT','NUMBER','DATE','BOOLEAN','JSON') NOT NULL DEFAULT 'TEXT'` | TEXT/NUMBER/DATE/BOOLEAN/JSON. Menentukan kolom value_* mana yang dipakai pada asset_attribute_values. |
| `is_required` | `TINYINT(1) NOT NULL DEFAULT 0` | Flag metadata untuk FE. PENTING: service Asset saat ini belum memaksa required attribute lengkap saat create/update. |
| `sort_order` | `INT NOT NULL DEFAULT 0` | Urutan display attribute pada FE. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | 1 = attribute dapat dipakai oleh saveAttributes; inactive ditolak oleh backend. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update. |

**Business / implementation rules:**
- `data_type` menentukan satu kolom value_* pada asset_attribute_values.
- `is_required` belum dipaksa di AssetService; FE boleh menandai required tetapi backend saat ini hanya memvalidasi attribute_id milik category dan active.

---

# `numbering_configs`

**Purpose:** Konfigurasi generator nomor Asset/Consumable per managing department dan opsional company.

**Row grain:** Satu row = satu konfigurasi sequence.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key. |
| `managing_department_id` | `BIGINT UNSIGNED NOT NULL COMMENT 'Central PilarGroup department id; intentionally no FK'` | Central department ID yang memiliki sequence. |
| `company_id` | `VARCHAR(64) NULL COMMENT 'Central PilarGroup company id string; intentionally no FK'` | Optional company-specific override. NULL = department-level fallback. |
| `sequence_type` | `ENUM('ASSET','CONSUMABLE') NOT NULL` | ASSET atau CONSUMABLE. |
| `name` | `VARCHAR(150) NOT NULL` | Nama konfigurasi untuk admin UI. |
| `prefix` | `VARCHAR(50) NULL` | Nilai pengganti token {PREFIX}. |
| `company_token` | `VARCHAR(50) NULL` | Nilai pengganti token {COMPANY}; bukan otomatis company_id. |
| `department_token` | `VARCHAR(50) NULL` | Nilai pengganti token {DEPARTMENT}; bukan otomatis nama department. |
| `pattern` | `VARCHAR(255) NOT NULL` | Pattern final, token didukung: {PREFIX},{COMPANY},{DEPARTMENT},{YYYY},{YY},{MM},{SEQ} atau {SEQ:n}. |
| `sequence_length` | `SMALLINT UNSIGNED NOT NULL DEFAULT 6` | Default padding untuk {SEQ} tanpa :n. Validasi service 1..20. |
| `starting_sequence` | `BIGINT UNSIGNED NOT NULL DEFAULT 1` | Nomor awal setelah config dibuat/reset. |
| `current_sequence` | `BIGINT UNSIGNED NOT NULL DEFAULT 0` | Counter terakhir. Diupdate otomatis ketika nomor dibuat; jangan diedit manual lewat API update. |
| `reset_period` | `ENUM('NEVER','YEARLY','MONTHLY') NOT NULL DEFAULT 'NEVER'` | NEVER/YEARLY/MONTHLY. |
| `last_reset_key` | `VARCHAR(20) NULL` | Internal key reset terakhir (YYYY atau YYYY-MM). Diupdate generator. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | Hanya satu config active per department/company/sequence_type yang diaktifkan oleh service create/update. |
| `created_by` | `CHAR(36) NULL` | UUID PilarGroup pembuat config. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update. |

**Business / implementation rules:**
- Generator mencari config active dengan exact company terlebih dahulu, lalu fallback company_id NULL.
- Create config active akan menonaktifkan config active lain pada department + sequence_type + company context yang sama.
- Update API tidak memindahkan department/company/sequence_type karena model update hanya mengizinkan konfigurasi display/pattern/reset/is_active.

---

# `master_permissions`

**Purpose:** Daftar permission code yang dikenali backend.

**Row grain:** Satu row = satu capability.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key permission. |
| `code` | `VARCHAR(100) NOT NULL` | Permission code unik yang dipakai middleware/service. |
| `name` | `VARCHAR(150) NOT NULL` | Nama human readable. |
| `description` | `VARCHAR(255) NULL` | Deskripsi capability. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | Hanya active permission yang dihitung. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update. |

---

# `permission_assignments`

**Purpose:** Assignment permission ke USER/COMPANY/DEPARTMENT beserta breadth akses datanya.

**Row grain:** Satu row = satu grant permission.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key grant. |
| `permission_id` | `BIGINT UNSIGNED NOT NULL` | FK ke master_permissions. |
| `subject_type` | `ENUM('USER','COMPANY','DEPARTMENT') NOT NULL COMMENT 'Who receives the permission'` | Siapa yang menerima grant: USER/COMPANY/DEPARTMENT. |
| `subject_id` | `VARCHAR(64) NOT NULL COMMENT 'USER=auth/me.id UUID, COMPANY=company id, DEPARTMENT=department id as string'` | Identifier subject. USER=UUID auth/me.id; COMPANY=string company id; DEPARTMENT=id integer disimpan sebagai string. |
| `access_scope_type` | `ENUM('GLOBAL','COMPANY','DEPARTMENT') NOT NULL COMMENT 'How broad the granted data access is'` | Breadth data yang diizinkan: GLOBAL/COMPANY/DEPARTMENT. |
| `access_scope_id` | `VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'Empty for GLOBAL; company id for COMPANY; department id for DEPARTMENT'` | GLOBAL wajib empty string; COMPANY=company id; DEPARTMENT=department id sebagai string. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | 1 aktif. Revoke mengubah menjadi 0, bukan delete. |
| `created_by` | `CHAR(36) NULL` | UUID actor pemberi grant. |
| `updated_by` | `CHAR(36) NULL` | UUID actor terakhir grant/revoke. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update/revoke/reactivate. |

**Business / implementation rules:**
- Grant yang match USER, semua departments user, dan semua companies user di-UNION.
- Tidak ada DENY dan tidak ada priority USER > DEPARTMENT > COMPANY.
- Exact duplicate di-reactivate dengan ON DUPLICATE KEY UPDATE; revoke hanya is_active=0.

---

# `assets`

**Purpose:** Current state / master record setiap physical serialized asset.

**Row grain:** Satu row = satu physical asset.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key internal Asset. |
| `asset_number` | `VARCHAR(150) NOT NULL` | Nomor Asset unik dan immutable melalui normal update. Bisa supplied atau generated. |
| `asset_name` | `VARCHAR(200) NOT NULL` | Nama/deskripsi Asset. |
| `category_id` | `BIGINT UNSIGNED NOT NULL` | FK category SERIALIZED_ASSET. |
| `brand_id` | `BIGINT UNSIGNED NULL` | Optional FK brand. |
| `model_id` | `BIGINT UNSIGNED NULL` | Optional FK model. |
| `serial_number` | `VARCHAR(180) NULL` | Nomor serial manufacturer opsional. |
| `managing_department_id` | `BIGINT UNSIGNED NOT NULL COMMENT 'Central PilarGroup department id'` | Department yang bertanggung jawab mengelola Asset; bukan department holder. |
| `company_id` | `VARCHAR(64) NOT NULL COMMENT 'Central PilarGroup company id string'` | Company owner/context Asset. |
| `current_location_id` | `BIGINT UNSIGNED NULL` | Current location cache. Perubahan operational dilakukan lewat Transfer/Return/LOCATION assignment, bukan normal update. |
| `status` | `ENUM('REGISTERED','AVAILABLE','ASSIGNED','MAINTENANCE','LOST','RETIRED','DISPOSED','VOID') NOT NULL DEFAULT 'REGISTERED'` | Lifecycle/current operational status. |
| `asset_condition` | `ENUM('NEW','GOOD','FAIR','POOR','DAMAGED') NOT NULL DEFAULT 'GOOD'` | Kondisi fisik current. |
| `purchase_date` | `DATE NULL` | Tanggal acquisition/purchase opsional. |
| `purchase_cost` | `DECIMAL(18,2) NULL` | Nilai purchase yang juga menjadi basis snapshot depreciation saat config dibuat. |
| `vendor_id` | `BIGINT UNSIGNED NULL` | Optional vendor purchase/supplier. |
| `warranty_until` | `DATE NULL` | Tanggal akhir warranty opsional. |
| `current_assignment_id` | `BIGINT UNSIGNED NULL` | Pointer ke active asset_assignments. NULL jika unassigned. |
| `notes` | `TEXT NULL` | Catatan master Asset. |
| `created_by` | `CHAR(36) NULL` | UUID pembuat record. |
| `updated_by` | `CHAR(36) NULL` | UUID actor update state/master terakhir. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update. |

**Business / implementation rules:**
- `assets` adalah current state; assignment/transfer/maintenance/history adalah transaction/history layer.
- Normal PUT Asset tidak boleh mengubah asset_number, managing_department_id, company_id, current_location_id, status, current_assignment_id.
- Category wajib SERIALIZED_ASSET.

---

# `asset_attribute_values`

**Purpose:** Nilai custom attribute sebuah Asset sesuai definisi category attribute.

**Row grain:** Satu row = satu nilai attribute pada satu asset.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key. |
| `asset_id` | `BIGINT UNSIGNED NOT NULL` | FK Asset. |
| `attribute_id` | `BIGINT UNSIGNED NOT NULL` | FK master_category_attributes. |
| `value_text` | `TEXT NULL` | Dipakai jika data_type TEXT. |
| `value_number` | `DECIMAL(24,6) NULL` | Dipakai jika data_type NUMBER. |
| `value_date` | `DATE NULL` | Dipakai jika data_type DATE. |
| `value_boolean` | `TINYINT(1) NULL` | Dipakai jika data_type BOOLEAN. |
| `value_json` | `JSON NULL` | Dipakai jika data_type JSON. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update/upsert. |

---

# `asset_assignments`

**Purpose:** Business history assignment dan return Asset.

**Row grain:** Satu row = satu periode assignment; return menutup row yang sama.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key assignment. |
| `asset_id` | `BIGINT UNSIGNED NOT NULL` | FK Asset. |
| `assignment_type` | `ENUM('USER','DEPARTMENT','LOCATION','SHARED_POOL') NOT NULL` | USER/DEPARTMENT/LOCATION/SHARED_POOL. |
| `assigned_user_id` | `CHAR(36) NULL` | Wajib secara service jika type USER; PilarGroup UUID. |
| `assigned_user_name_snapshot` | `VARCHAR(180) NULL` | Snapshot display name user; optional di API tetapi direkomendasikan/resolved oleh caller. |
| `assigned_department_id` | `BIGINT UNSIGNED NULL` | Wajib jika type DEPARTMENT. |
| `assigned_department_name_snapshot` | `VARCHAR(180) NULL` | Snapshot nama department. |
| `assigned_location_id` | `BIGINT UNSIGNED NULL` | Wajib jika type LOCATION. |
| `assigned_location_name_snapshot` | `VARCHAR(180) NULL` | Snapshot nama lokasi. |
| `purpose` | `VARCHAR(255) NULL` | Tujuan/penggunaan assignment. |
| `assigned_at` | `DATETIME NOT NULL` | Tanggal/waktu mulai assignment. |
| `assigned_by` | `CHAR(36) NOT NULL` | UUID actor yang melakukan assignment. |
| `returned_at` | `DATETIME NULL` | NULL selama aktif; terisi saat return. |
| `returned_by` | `CHAR(36) NULL` | UUID actor return. |
| `return_condition` | `ENUM('NEW','GOOD','FAIR','POOR','DAMAGED') NULL` | Condition Asset pada return. |
| `return_location_id` | `BIGINT UNSIGNED NULL` | Lokasi tujuan setelah return. |
| `return_note` | `TEXT NULL` | Catatan return. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp row dibuat. |

**Business / implementation rules:**
- Hanya satu active assignment diarahkan oleh assets.current_assignment_id.
- Return menutup row dengan returned_at/returned_by, tidak membuat tabel return terpisah.

---

# `asset_transfers`

**Purpose:** Business history perpindahan lokasi/company/managing department Asset.

**Row grain:** Satu row = satu transfer.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key transfer. |
| `asset_id` | `BIGINT UNSIGNED NOT NULL` | FK Asset. |
| `transfer_date` | `DATETIME NOT NULL` | Waktu efektif transfer. |
| `from_location_id` | `BIGINT UNSIGNED NULL` | Snapshot lokasi asal. |
| `to_location_id` | `BIGINT UNSIGNED NULL` | Lokasi tujuan. |
| `from_company_id` | `VARCHAR(64) NULL` | Company asal. |
| `to_company_id` | `VARCHAR(64) NULL` | Company tujuan. |
| `from_managing_department_id` | `BIGINT UNSIGNED NULL` | Managing department asal. |
| `to_managing_department_id` | `BIGINT UNSIGNED NULL` | Managing department tujuan. |
| `reason` | `VARCHAR(255) NULL` | Alasan transfer. |
| `notes` | `TEXT NULL` | Catatan tambahan. |
| `transferred_by` | `CHAR(36) NOT NULL` | UUID actor. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp record dibuat. |

---

# `asset_maintenances`

**Purpose:** Record maintenance/repair Asset.

**Row grain:** Satu row = satu pekerjaan maintenance.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key maintenance. |
| `asset_id` | `BIGINT UNSIGNED NOT NULL` | FK Asset. |
| `maintenance_type` | `VARCHAR(100) NOT NULL` | Free-text type saat ini, bukan master/enum. Contoh REPAIR/PREVENTIVE/CHECKUP harus distandardisasi di FE bila diperlukan. |
| `vendor_id` | `BIGINT UNSIGNED NULL` | Optional FK vendor service/repair. |
| `start_date` | `DATETIME NOT NULL` | Waktu mulai. |
| `completion_date` | `DATETIME NULL` | Terisi saat complete. |
| `cost` | `DECIMAL(18,2) NULL` | Biaya maintenance. |
| `problem_description` | `TEXT NULL` | Masalah/deskripsi pekerjaan. |
| `result` | `TEXT NULL` | Hasil maintenance setelah selesai. |
| `status` | `ENUM('OPEN','IN_PROGRESS','COMPLETED','CANCELED') NOT NULL DEFAULT 'OPEN'` | OPEN/IN_PROGRESS/COMPLETED/CANCELED. Workflow API saat ini secara resmi create -> complete; endpoint khusus IN_PROGRESS/CANCELED belum ada. |
| `notes` | `TEXT NULL` | Catatan maintenance. |
| `created_by` | `CHAR(36) NOT NULL` | UUID pembuat. |
| `completed_by` | `CHAR(36) NULL` | UUID actor complete. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update. |

**Business / implementation rules:**
- Create maintenance mengubah Asset status menjadi MAINTENANCE.
- Complete mengubah status maintenance ke COMPLETED dan Asset kembali ASSIGNED jika current_assignment_id ada, selain itu AVAILABLE.
- Enum IN_PROGRESS/CANCELED tersedia di schema tetapi belum punya endpoint transisi khusus.

---

# `asset_history`

**Purpose:** Timeline business event sebuah Asset.

**Row grain:** Satu row = satu event bisnis Asset.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key history. |
| `asset_id` | `BIGINT UNSIGNED NOT NULL` | FK Asset. |
| `event_type` | `VARCHAR(80) NOT NULL` | Structured event string. Kolom bukan ENUM; nilai dihasilkan service seperti CREATED, UPDATED, ASSIGNED, RETURNED, TRANSFERRED, MAINTENANCE_STARTED, MAINTENANCE_COMPLETED, LOST/RETIRED/DISPOSED/VOID, IMPORTED, EXTERNAL_REFERENCE_LINKED. |
| `event_date` | `DATETIME NOT NULL` | Tanggal/waktu business event. |
| `reference_type` | `VARCHAR(80) NULL` | Tipe record referensi bila ada. |
| `reference_id` | `BIGINT UNSIGNED NULL` | ID numeric local reference bila ada. |
| `description` | `VARCHAR(500) NULL` | Human-readable description. |
| `details` | `JSON NULL` | JSON context/diff. |
| `performed_by` | `CHAR(36) NULL` | UUID actor bila ada. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp insertion. |

---

# `asset_external_references`

**Purpose:** Logical link Asset ke record sistem lain seperti Ticket tanpa cross-database FK.

**Row grain:** Satu row = satu external reference.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key link. |
| `asset_id` | `BIGINT UNSIGNED NOT NULL` | FK Asset. |
| `source_system` | `VARCHAR(80) NOT NULL COMMENT 'External system slug, e.g. ticket'` | Slug sistem eksternal, dinormalisasi lowercase oleh internal API, contoh ticket. |
| `reference_type` | `VARCHAR(80) NOT NULL COMMENT 'External reference type, e.g. TICKET'` | Tipe external reference, dinormalisasi uppercase, contoh TICKET. |
| `reference_id` | `VARCHAR(128) NOT NULL COMMENT 'Opaque id owned by the external system'` | Opaque ID milik sistem eksternal. |
| `reference_number` | `VARCHAR(150) NULL COMMENT 'Human-readable external number snapshot'` | Nomor human-readable snapshot seperti TKT-IT-26-00001. |
| `linked_by_user_id` | `CHAR(36) NULL COMMENT 'Optional PilarGroup user UUID responsible for the link'` | Optional UUID user yang responsible terhadap link. |
| `linked_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp link business. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp DB. |

---

# `consumables`

**Purpose:** Master Consumable yang dikelola berdasarkan quantity.

**Row grain:** Satu row = satu SKU/master consumable.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key. |
| `consumable_code` | `VARCHAR(150) NOT NULL` | Kode unik; supplied atau generated. |
| `name` | `VARCHAR(200) NOT NULL` | Nama consumable. |
| `category_id` | `BIGINT UNSIGNED NOT NULL` | FK category dengan tracking_type CONSUMABLE. |
| `brand_id` | `BIGINT UNSIGNED NULL` | Optional FK brand. |
| `variant` | `VARCHAR(180) NULL` | Variant free text. |
| `uom_id` | `BIGINT UNSIGNED NOT NULL` | FK UOM wajib. |
| `managing_department_id` | `BIGINT UNSIGNED NOT NULL` | Department pengelola stock. |
| `company_id` | `VARCHAR(64) NOT NULL` | Company context/owner. |
| `minimum_stock` | `DECIMAL(18,4) NOT NULL DEFAULT 0` | Threshold total low-stock dashboard. |
| `notes` | `TEXT NULL` | Catatan. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | Active master. |
| `created_by` | `CHAR(36) NULL` | UUID creator. |
| `updated_by` | `CHAR(36) NULL` | UUID updater. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update. |

---

# `consumable_stock_balances`

**Purpose:** Cache current quantity per Consumable per Location.

**Row grain:** Primary key gabungan consumable + location.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `consumable_id` | `BIGINT UNSIGNED NOT NULL` | FK Consumable dan bagian PK gabungan. |
| `location_id` | `BIGINT UNSIGNED NOT NULL` | FK Location dan bagian PK gabungan. |
| `quantity` | `DECIMAL(18,4) NOT NULL DEFAULT 0` | Current cached quantity di location. Hanya diubah oleh movement/import opening stock. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp balance terakhir berubah. |

**Business / implementation rules:**
- Balance adalah cache current state; ledger consumable_stock_transactions adalah audit source perubahan stock.
- Jangan update balance langsung dari FE/API lain.

---

# `consumable_stock_transactions`

**Purpose:** Ledger semua perubahan stock Consumable.

**Row grain:** Satu row = satu movement stock.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key ledger. |
| `transaction_number` | `VARCHAR(150) NOT NULL` | Nomor transaksi generated otomatis. |
| `consumable_id` | `BIGINT UNSIGNED NOT NULL` | FK Consumable. |
| `movement_type` | `ENUM('OPENING_BALANCE','RECEIVE','ISSUE','TRANSFER','ADJUSTMENT','WRITE_OFF','RETURN') NOT NULL` | OPENING_BALANCE/RECEIVE/ISSUE/TRANSFER/ADJUSTMENT/WRITE_OFF/RETURN. |
| `from_location_id` | `BIGINT UNSIGNED NULL` | Dipakai untuk ISSUE, WRITE_OFF, TRANSFER. |
| `to_location_id` | `BIGINT UNSIGNED NULL` | Dipakai untuk OPENING_BALANCE, RECEIVE, RETURN, TRANSFER, ADJUSTMENT. |
| `quantity` | `DECIMAL(18,4) NOT NULL` | Qty movement. Positif untuk semua type kecuali ADJUSTMENT boleh positif/negatif; tidak boleh 0. |
| `unit_cost` | `DECIMAL(18,4) NULL` | Optional cost informational. |
| `recipient_type` | `ENUM('USER','DEPARTMENT','ASSET','LOCATION','GENERAL_USAGE') NULL` | Wajib hanya untuk ISSUE: USER/DEPARTMENT/ASSET/LOCATION/GENERAL_USAGE. |
| `recipient_user_id` | `CHAR(36) NULL` | Wajib jika recipient_type USER. |
| `recipient_user_name_snapshot` | `VARCHAR(180) NULL` | Snapshot nama recipient user. |
| `recipient_department_id` | `BIGINT UNSIGNED NULL` | Wajib jika recipient_type DEPARTMENT. |
| `recipient_department_name_snapshot` | `VARCHAR(180) NULL` | Snapshot department. |
| `recipient_asset_id` | `BIGINT UNSIGNED NULL` | Wajib jika recipient_type ASSET. |
| `recipient_location_id` | `BIGINT UNSIGNED NULL` | Wajib jika recipient_type LOCATION. |
| `purpose` | `VARCHAR(255) NULL` | Tujuan issue/movement. |
| `reference_number` | `VARCHAR(150) NULL` | External/business reference optional. |
| `notes` | `TEXT NULL` | Catatan. |
| `transaction_date` | `DATETIME NOT NULL` | Tanggal efektif movement. |
| `created_by` | `CHAR(36) NOT NULL` | UUID actor. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |

**Business / implementation rules:**
- Setiap movement melakukan row lock balance supaya update stok konsisten.
- Negative stock default ditolak; dapat diubah via ALLOW_NEGATIVE_CONSUMABLE_STOCK=true.
- ISSUE selalu membutuhkan recipient_type dan target sesuai type, kecuali GENERAL_USAGE yang tidak membutuhkan target ID.

---

# `depreciation_policies`

**Purpose:** Template kebijakan depresiasi per managing department dan opsional company.

**Row grain:** Satu row = satu policy template.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key policy. |
| `managing_department_id` | `BIGINT UNSIGNED NOT NULL` | Department pemilik policy. |
| `company_id` | `VARCHAR(64) NULL` | Optional company-specific policy. NULL = department-level. |
| `name` | `VARCHAR(180) NOT NULL` | Nama policy. |
| `method` | `ENUM('STRAIGHT_LINE','DECLINING_BALANCE','MANUAL') NOT NULL DEFAULT 'STRAIGHT_LINE'` | STRAIGHT_LINE/DECLINING_BALANCE/MANUAL. Hanya STRAIGHT_LINE dihitung oleh MVP. |
| `useful_life_months` | `INT UNSIGNED NOT NULL` | Masa manfaat bulan > 0. |
| `salvage_value_type` | `ENUM('FIXED','PERCENT') NOT NULL DEFAULT 'FIXED'` | FIXED/PERCENT. |
| `salvage_value` | `DECIMAL(18,4) NOT NULL DEFAULT 0` | Jika FIXED = nominal; jika PERCENT = persentase purchase cost. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | Hanya active policy dapat dipilih configure Asset. |
| `created_by` | `CHAR(36) NULL` | UUID creator. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update. |

---

# `category_depreciation_defaults`

**Purpose:** Mapping default policy untuk kombinasi category + department + optional company.

**Row grain:** Satu row = satu category default.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `category_id` | `BIGINT UNSIGNED NOT NULL` | FK category. |
| `managing_department_id` | `BIGINT UNSIGNED NOT NULL` | Department context. |
| `company_id` | `VARCHAR(64) NULL` | Optional company override. |
| `depreciation_policy_id` | `BIGINT UNSIGNED NOT NULL` | FK policy yang menjadi suggestion/default. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp mapping dibuat. |

---

# `asset_depreciation_configs`

**Purpose:** Snapshot konfigurasi depresiasi yang aktif/riwayat pada Asset.

**Row grain:** Satu row = satu snapshot konfigurasi; hanya satu active secara aplikasi.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key snapshot. |
| `asset_id` | `BIGINT UNSIGNED NOT NULL` | FK Asset. |
| `depreciation_policy_id` | `BIGINT UNSIGNED NULL` | Optional FK policy template asal. Boleh NULL untuk manual config. |
| `purchase_cost_snapshot` | `DECIMAL(18,2) NOT NULL` | Purchase cost saat config dibuat; tidak ikut berubah bila assets.purchase_cost kemudian diubah. |
| `depreciation_method` | `ENUM('STRAIGHT_LINE','DECLINING_BALANCE','MANUAL') NOT NULL` | Snapshot method. |
| `useful_life_months` | `INT UNSIGNED NOT NULL` | Snapshot useful life. |
| `salvage_value_type` | `ENUM('FIXED','PERCENT') NOT NULL DEFAULT 'FIXED'` | Snapshot FIXED/PERCENT. |
| `salvage_value` | `DECIMAL(18,4) NOT NULL DEFAULT 0` | Snapshot salvage value. |
| `depreciation_start_date` | `DATE NOT NULL` | Tanggal mulai. |
| `is_active` | `TINYINT(1) NOT NULL DEFAULT 1` | Aplikasi menonaktifkan config lama saat create config baru. |
| `created_by` | `CHAR(36) NULL` | UUID creator. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp create. |
| `updated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Timestamp update revision. |

---

# `asset_depreciation_revisions`

**Purpose:** Audit revision konfigurasi depresiasi Asset.

**Row grain:** Satu row = satu revision dengan old/new JSON.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key revision. |
| `asset_id` | `BIGINT UNSIGNED NOT NULL` | FK Asset. |
| `effective_date` | `DATE NOT NULL` | Tanggal business efektif revision. |
| `old_values` | `JSON NOT NULL` | Snapshot config sebelum revision. |
| `new_values` | `JSON NOT NULL` | Snapshot config sesudah revision. |
| `reason` | `VARCHAR(500) NOT NULL` | Alasan wajib. |
| `changed_by` | `CHAR(36) NOT NULL` | UUID actor. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp revision dibuat. |

---

# `asset_depreciation_ledger`

**Purpose:** Ledger depresiasi bulanan per Asset.

**Row grain:** Satu row = satu Asset + tahun + bulan.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key ledger period. |
| `asset_id` | `BIGINT UNSIGNED NOT NULL` | FK Asset. |
| `period_year` | `SMALLINT UNSIGNED NOT NULL` | Tahun period. |
| `period_month` | `TINYINT UNSIGNED NOT NULL` | Bulan 1..12 secara konsep; DB belum punya CHECK constraint eksplisit. |
| `opening_book_value` | `DECIMAL(18,2) NOT NULL` | Book value awal period. |
| `depreciation_amount` | `DECIMAL(18,2) NOT NULL` | Expense period. |
| `accumulated_depreciation` | `DECIMAL(18,2) NOT NULL` | Accumulated sampai period. |
| `closing_book_value` | `DECIMAL(18,2) NOT NULL` | Book value akhir. |
| `calculation_method` | `ENUM('STRAIGHT_LINE','DECLINING_BALANCE','MANUAL') NOT NULL` | Method yang dipakai generate. |
| `is_final` | `TINYINT(1) NOT NULL DEFAULT 0` | 1 = final/closed; generator tidak overwrite row final. |
| `generated_by` | `CHAR(36) NULL` | UUID actor generate. |
| `generated_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp generate/update row. |

**Business / implementation rules:**
- Generator MVP hanya STRAIGHT_LINE.
- Row is_final=1 tidak di-overwrite oleh regenerate.
- Generate dimulai setelah last finalized period jika ada.

---

# `activity_logs`

**Purpose:** Immutable application audit trail: siapa melakukan apa, kapan, ke entity mana, dan perubahan apa.

**Row grain:** Satu row = satu audit event.

| Column | SQL type / constraint | Function / usage |
|---|---|---|
| `id` | `BIGINT UNSIGNED NOT NULL AUTO_INCREMENT` | Primary key audit. |
| `user_id` | `CHAR(36) NULL` | Canonical PilarGroup UUID actor. Boleh NULL untuk event internal tertentu. |
| `username_snapshot` | `VARCHAR(180) NULL` | Snapshot username actor. |
| `user_name_snapshot` | `VARCHAR(180) NULL` | Snapshot nama actor. |
| `department_id_snapshot` | `BIGINT UNSIGNED NULL` | Snapshot primary/context department actor saat event. |
| `department_name_snapshot` | `VARCHAR(180) NULL` | Snapshot nama department actor. |
| `company_id_snapshot` | `VARCHAR(64) NULL` | Snapshot company actor. |
| `company_name_snapshot` | `VARCHAR(180) NULL` | Snapshot company actor. |
| `module` | `VARCHAR(80) NOT NULL` | Logical module, contoh ASSET, CONSUMABLE_STOCK, PERMISSION, IMPORT, EXPORT. |
| `action` | `VARCHAR(100) NOT NULL` | Structured action string. Lihat enum/action reference. |
| `source` | `VARCHAR(40) NOT NULL DEFAULT 'APPLICATION'` | Source event, biasanya APPLICATION/IMPORT/INTERNAL_API. |
| `correlation_id` | `CHAR(36) NULL` | UUID untuk mengelompokkan satu operasi multi-event, terutama import. |
| `entity_type` | `VARCHAR(80) NULL` | Jenis entity. |
| `entity_id` | `BIGINT UNSIGNED NULL` | ID numeric local entity jika ada. |
| `entity_reference` | `VARCHAR(180) NULL` | Human-readable identifier seperti asset_number. |
| `entity_name_snapshot` | `VARCHAR(255) NULL` | Nama entity saat event. |
| `description` | `VARCHAR(500) NULL` | Human-readable audit description. |
| `old_values` | `JSON NULL` | Meaningful old data/diff JSON. |
| `new_values` | `JSON NULL` | Meaningful new data/diff/metadata JSON. |
| `ip_address` | `VARCHAR(80) NULL` | IP request. |
| `user_agent` | `VARCHAR(500) NULL` | User-Agent request. |
| `request_method` | `VARCHAR(20) NULL` | HTTP method. |
| `request_path` | `VARCHAR(500) NULL` | Original URL. |
| `status` | `ENUM('SUCCESS','FAILED') NOT NULL DEFAULT 'SUCCESS'` | SUCCESS/FAILED. |
| `error_message` | `VARCHAR(1000) NULL` | Pesan error jika FAILED. |
| `created_at` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp event. |

**Business / implementation rules:**
- Tidak ada endpoint update/delete activity log.
- Failed mutating request diaudit secara best-effort oleh error middleware dan body disanitize.
- Export audit hanya di activity_logs; tidak ada export_history.
