# Asset Maintenance

## Create maintenance

```http
POST /api/assets/:id/maintenance
```

Permission: `ASSET_MAINTENANCE` dalam Asset scope.

Asset RETIRED/DISPOSED/VOID tidak dapat masuk maintenance. LOST saat ini tidak diblokir oleh code create maintenance; lihat implementation notes bila rule bisnis ingin melarang LOST.

Required:

- `maintenance_type` (free text)

Optional:

- `vendor_id`
- `start_date` default now
- `cost`
- `problem_description`
- `notes`
- technically `status`, tetapi FE **direkomendasikan tidak mengirim** dan biarkan default OPEN

Side effects:

- insert `asset_maintenances`
- Asset status `MAINTENANCE`
- history `MAINTENANCE_STARTED`
- activity action `MAINTENANCE_CREATE`

## Complete maintenance

```http
PATCH /api/assets/:id/maintenance/:maintenanceId/complete
```

Optional:

- `completion_date` default now
- `result`
- `cost` override existing jika dikirim
- `notes` override existing jika dikirim

Side effects:

- maintenance status forced `COMPLETED`
- completion date/result/completed_by set
- Asset status = `ASSIGNED` jika Asset masih mempunyai current_assignment_id, selain itu `AVAILABLE`
- history `MAINTENANCE_COMPLETED`
- activity action `MAINTENANCE_COMPLETE`

## Status enum reality

Schema menyediakan OPEN / IN_PROGRESS / COMPLETED / CANCELED.

Current public workflow hanya create + complete. Tidak ada endpoint khusus update status IN_PROGRESS atau CANCEL. Karena itu FE MVP cukup menampilkan OPEN dan COMPLETED sebagai actionable states sampai backend ditambah.

## `maintenance_type`

Saat ini `VARCHAR(100)` free text, bukan master table atau enum. Jika FE membuat dropdown REPAIR/PREVENTIVE/INSPECTION, daftar tersebut adalah UI convention, bukan backend contract.
