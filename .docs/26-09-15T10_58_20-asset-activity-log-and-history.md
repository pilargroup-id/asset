# Asset Activity Log and Business History

## Dua jenis history

### Asset History

Menjawab: **apa yang terjadi pada Asset ini?**

Contoh CREATED, ASSIGNED, RETURNED, TRANSFERRED, MAINTENANCE_STARTED, RETIRED.

### Activity Log

Menjawab: **siapa/system melakukan apa di aplikasi?**

Contoh user update Asset, export report, import batch, grant permission, failed mutation.

Satu operation dapat menghasilkan keduanya.

## Activity log immutable

Public API hanya:

```http
GET /api/activity-logs
```

Tidak ada create/update/delete untuk user. Insert dilakukan backend service.

## Filters

- `page`
- `limit`
- `module`
- `action`
- `user_id`
- `entity_type`
- `entity_id`
- `source`
- `correlation_id`

Semua result tetap difilter effective `ACTIVITY_LOG_VIEW` scope menggunakan actor department/company snapshots.

## Meaningful diff

Update Asset menggunakan selected meaningful fields saja untuk `old_values/new_values`, sehingga audit tidak selalu dump seluruh row.

Import Asset update juga menggunakan diff dan correlation ID yang sama dengan import summary.

## Correlation ID

Import preview membuat `import_reference` UUID. Pada commit:

```text
IMPORT summary correlation_id = X
ASSET UPDATE row 1 correlation_id = X
ASSET CREATE row 2 correlation_id = X
...
```

FE Activity Log bisa menawarkan drill-down/filter by `correlation_id`.

## Failed mutation

Error middleware mencatat best-effort:

```text
action = REQUEST_FAILED
status = FAILED
source = APPLICATION default
new_values = sanitized request body
error_message = error
```

Sensitive field sanitizer harus tetap dipertahankan jika logging dikembangkan.

## Export audit

Tidak ada `export_history`.

Setiap export menyimpan metadata di `activity_logs.new_values`:

- export_type
- format XLSX
- row_count
- filename
- query filters
- effective permission assignment sources

## Asset History event display

Karena `event_type` bukan ENUM DB, FE harus:

1. map known values ke label/icon;
2. fallback menampilkan raw event_type + description untuk future value;
3. render `details` JSON sesuai event type jika dibutuhkan.
