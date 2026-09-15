# Asset Enum and Conditional Field Reference

Dokumen ini harus dipakai FE ketika membuat dropdown/form dinamis. Tidak semua string field adalah ENUM DB; bagian ini membedakan **DB enum**, **service-validated value**, dan **free text**.

## 1. Category `tracking_type`

| Value | Meaning | Dipakai oleh | Rule |
|---|---|---|---|
| `SERIALIZED_ASSET` | Physical unit tracking | `assets.category_id` | Asset create/import menolak category selain value ini. |
| `CONSUMABLE` | Quantity tracking | `consumables.category_id` | Consumable create/import menolak category selain value ini. |

FE Category form harus meminta `tracking_type`. Setelah category dibuat, pilihan ini menentukan menu/domain mana yang dapat memakai category.

## 2. Category Attribute `data_type`

| Value | FE input recommendation | Storage column |
|---|---|---|
| `TEXT` | text/textarea | `value_text` |
| `NUMBER` | numeric input | `value_number` |
| `DATE` | date input | `value_date` |
| `BOOLEAN` | switch/checkbox | `value_boolean` |
| `JSON` | structured JSON/custom editor | `value_json` |

Payload Asset tetap uniform:

```json
{ "attributes": [{ "attribute_id": 12, "value": "Intel Core i7" }] }
```

Backend memilih storage column berdasarkan definition `data_type`.

`is_required=1` saat ini **belum enforced backend** sebagai completeness check. FE boleh wajibkan, tetapi lihat implementation notes.

## 3. Permission `subject_type`

`subject_type` = **siapa menerima permission**.

| Value | `subject_id` wajib berisi | Contoh |
|---|---|---|
| `USER` | PilarGroup UUID | `bd625aff-...` |
| `COMPANY` | company ID string | `comp-pnm-0001` |
| `DEPARTMENT` | positive department ID, disimpan string | `8` |

Conditional UI:

```text
USER       -> tampilkan user picker -> kirim UUID
COMPANY    -> tampilkan company picker -> kirim company.id
DEPARTMENT -> tampilkan department picker -> kirim department.id
```

## 4. Permission `access_scope_type`

`access_scope_type` = **seberapa luas data yang diberikan**.

| Value | `access_scope_id` | UI |
|---|---|---|
| `GLOBAL` | kosong / `""` | jangan tampilkan scope target picker |
| `COMPANY` | company ID string | tampilkan company picker |
| `DEPARTMENT` | positive department ID | tampilkan department picker |

Backend menormalisasi GLOBAL menjadi empty string. Grant yang match di-UNION; grant lebih sempit tidak mengurangi grant lain.

## 5. Numbering `sequence_type`

| Value | Digunakan ketika |
|---|---|
| `ASSET` | create Asset / import Asset dengan asset_number kosong |
| `CONSUMABLE` | create Consumable / import Consumable dengan consumable_code kosong |

## 6. Numbering `reset_period`

| Value | Counter reset |
|---|---|
| `NEVER` | tidak reset otomatis |
| `YEARLY` | reset ketika tahun berbeda dari `last_reset_key` |
| `MONTHLY` | reset ketika YYYY-MM berbeda |

Reset mengembalikan next number ke `starting_sequence`.

## 7. Asset `status`

| Value | Cara status muncul | Field/operation yang harus dipakai | Catatan |
|---|---|---|---|
| `REGISTERED` | Create Asset saja | `POST /api/assets` body `status` | Initial status yang valid. |
| `AVAILABLE` | Create atau Return/maintenance complete | Create `status`, Return, maintenance complete | Menandakan tidak ada active assignment. |
| `ASSIGNED` | Assign | `POST /assets/:id/assign` | Jangan set via normal PUT. Import CREATE boleh membuat assignment migration. |
| `MAINTENANCE` | Start maintenance | `POST /assets/:id/maintenance` | Asset status otomatis. |
| `LOST` | Terminal lifecycle | `PATCH /assets/:id/lifecycle` | Asset harus tidak punya active assignment. |
| `RETIRED` | Terminal lifecycle | lifecycle endpoint | Tidak assignable. |
| `DISPOSED` | Terminal lifecycle | lifecycle endpoint | Tidak assignable. |
| `VOID` | Invalid/canceled historical asset | lifecycle endpoint | Tidak assignable. |

Normal create API hanya menerima `REGISTERED` atau `AVAILABLE`. Normal update melarang field `status`.

## 8. Asset `asset_condition` / `return_condition`

Values:

- `NEW`
- `GOOD`
- `FAIR`
- `POOR`
- `DAMAGED`

Saat return, jika `return_condition` tidak dikirim backend mempertahankan condition Asset sekarang. Jika dikirim, condition Asset current ikut diubah.

Backend belum otomatis membuat maintenance hanya karena `DAMAGED`; keputusan maintenance tetap action terpisah.

## 9. Assignment `assignment_type`

| Value | Field wajib | Field snapshot / optional | Efek |
|---|---|---|---|
| `USER` | `assigned_user_id` | `assigned_user_name_snapshot`, purpose | Asset terikat ke user. Dipakai Ticket lookup current holder. |
| `DEPARTMENT` | `assigned_department_id` | `assigned_department_name_snapshot`, purpose | Asset dipakai department. |
| `LOCATION` | `assigned_location_id` | `assigned_location_name_snapshot`, purpose | Current location Asset juga diubah ke assigned location. |
| `SHARED_POOL` | tidak ada target ID wajib | purpose | Shared usage; current holder individual tidak ada. |

Common optional: `assigned_at`. Backend default current time.

## 10. Maintenance `status`

DB values:

- `OPEN`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELED`

**Workflow implemented sekarang:**

```text
create maintenance -> rekomendasi jangan kirim status -> DB OPEN -> Asset MAINTENANCE
complete endpoint  -> DB COMPLETED -> Asset ASSIGNED atau AVAILABLE
```

Belum ada endpoint dedicated untuk `OPEN -> IN_PROGRESS` atau `CANCELED`. FE **jangan membuat tombol transition tersebut** sebelum backend ditambah.

## 11. Consumable `movement_type`

| Movement | Quantity | from_location | to_location | Recipient | Permission | Balance effect |
|---|---:|---|---|---|---|---|
| `OPENING_BALANCE` | > 0 | tidak dipakai | **wajib** | tidak | `CONSUMABLE_RECEIVE` | +qty ke destination |
| `RECEIVE` | > 0 | tidak dipakai | **wajib** | tidak | `CONSUMABLE_RECEIVE` | +qty |
| `RETURN` | > 0 | tidak dipakai | **wajib** | tidak | `CONSUMABLE_RECEIVE` | +qty |
| `ISSUE` | > 0 | **wajib** | tidak dipakai | **wajib** | `CONSUMABLE_ISSUE` | -qty |
| `TRANSFER` | > 0 | **wajib** | **wajib** dan harus berbeda | tidak | `CONSUMABLE_TRANSFER` | -from, +to |
| `ADJUSTMENT` | non-zero; boleh +/- | tidak dipakai | **wajib** | tidak | `CONSUMABLE_ADJUST` | +delta |
| `WRITE_OFF` | > 0 | **wajib** | tidak dipakai | tidak | `CONSUMABLE_WRITE_OFF` | -qty |

## 12. ISSUE `recipient_type`

| Value | Field wajib | Field snapshot recommended |
|---|---|---|
| `USER` | `recipient_user_id` | `recipient_user_name_snapshot` |
| `DEPARTMENT` | `recipient_department_id` | `recipient_department_name_snapshot` |
| `ASSET` | `recipient_asset_id` | backend FK ke Asset; FE pilih Asset |
| `LOCATION` | `recipient_location_id` | FE pilih Location |
| `GENERAL_USAGE` | tidak ada recipient ID | `purpose` sangat direkomendasikan |

`recipient_type` hanya diwajibkan service untuk `ISSUE`.

## 13. Depreciation `method`

DB values:

- `STRAIGHT_LINE`
- `DECLINING_BALANCE`
- `MANUAL`

Schema future-ready, tetapi **calculation MVP hanya STRAIGHT_LINE**. Configure/revision/generate akan menolak method lain ketika calculation diperlukan.

FE MVP sebaiknya hanya menawarkan `STRAIGHT_LINE` walaupun policy schema menerima enum lainnya.

## 14. `salvage_value_type`

| Value | Meaning | Validation ketika generate |
|---|---|---|
| `FIXED` | `salvage_value` nominal currency | harus menghasilkan salvage antara 0 dan purchase cost |
| `PERCENT` | `salvage_value` persen purchase cost | dihitung `purchase * percent / 100`; hasil harus <= purchase |

## 15. Activity Log `status`

- `SUCCESS`: event berhasil.
- `FAILED`: failed mutating request/audit failure event.

## 16. Activity Log `source`

Kolom source bukan DB ENUM. Value yang saat ini diproduksi code:

- `APPLICATION` default normal UI/API.
- `IMPORT` untuk import summary/per-row entity events.
- `INTERNAL_API` untuk external reference link.

FE Activity Log filter boleh memakai value di atas, tetapi backend secara DB tidak membatasi string lain.

## 17. Activity action codes

Constant actions:

`CREATE`, `UPDATE`, `ACTIVATE`, `DEACTIVATE`, `IMPORT`, `EXPORT`, `DOWNLOAD_TEMPLATE`, `ASSIGN`, `RETURN`, `TRANSFER`, `RECEIVE`, `ISSUE`, `ADJUST`, `WRITE_OFF`, `OPENING_BALANCE`, `MAINTENANCE_CREATE`, `MAINTENANCE_COMPLETE`, `DEPRECIATION_UPDATE`, `DEPRECIATION_RECALCULATE`, `PERMISSION_GRANT`, `PERMISSION_REVOKE`, `EXTERNAL_REFERENCE_LINK`, `REQUEST_FAILED`.

Service juga saat ini menghasilkan string tambahan `LIFECYCLE_UPDATE` dan `FINALIZE`. Karena `activity_logs.action` bukan ENUM, keduanya valid dan harus ditampilkan FE Activity Log.

## 18. Asset History `event_type`

Kolom bukan ENUM. Values yang saat ini dihasilkan backend mencakup:

- `CREATED`
- `UPDATED`
- `ASSIGNED`
- `RETURNED`
- `TRANSFERRED`
- `MAINTENANCE_STARTED`
- `MAINTENANCE_COMPLETED`
- `RETIRED`
- `DISPOSED`
- `VOID`
- `LOST`
- `IMPORTED`
- `EXTERNAL_REFERENCE_LINKED`

FE timeline harus punya fallback label untuk unknown future event karena column intentionally extensible.
