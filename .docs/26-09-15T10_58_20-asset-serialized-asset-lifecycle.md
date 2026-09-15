# Serialized Asset Lifecycle and Operations

## Asset create

Required:

```text
asset_name
category_id (must SERIALIZED_ASSET)
managing_department_id
company_id
```

Optional core fields:

`asset_number`, `brand_id`, `model_id`, `serial_number`, `current_location_id`, `status`, `asset_condition`, `purchase_date`, `purchase_cost`, `vendor_id`, `warranty_until`, `notes`, `attributes`.

Jika `asset_number` kosong, backend generate dari active `ASSET` numbering.

Initial `status` hanya boleh `REGISTERED` atau `AVAILABLE`. Jika tidak dikirim model default create menjadi `AVAILABLE` pada current implementation.

## Asset custom attributes

Payload:

```json
{
  "attributes": [
    { "attribute_id": 11, "value": "Intel Core i7" },
    { "attribute_id": 12, "value": 16 }
  ]
}
```

Backend memastikan attribute active dan belongs to category Asset.

## Normal update

Normal PUT ditujukan untuk master/descriptive fields saja.

Allowed model fields:

- asset_name
- category_id
- brand_id
- model_id
- serial_number
- asset_condition
- purchase_date
- purchase_cost
- vendor_id
- warranty_until
- notes
- attributes

Explicitly forbidden through normal update:

- asset_number
- managing_department_id
- company_id
- current_location_id
- status
- current_assignment_id

Gunakan business endpoint untuk field tersebut.

## Assignment

```http
POST /api/assets/:id/assign
```

Asset harus tidak memiliki `current_assignment_id`, dan status tidak boleh LOST/RETIRED/DISPOSED/VOID.

### USER

```json
{
  "assignment_type": "USER",
  "assigned_user_id": "<uuid>",
  "assigned_user_name_snapshot": "Budi",
  "assigned_at": "2026-09-15T10:00:00+07:00",
  "purpose": "Laptop kerja Finance"
}
```

### DEPARTMENT

```json
{
  "assignment_type": "DEPARTMENT",
  "assigned_department_id": 7,
  "assigned_department_name_snapshot": "Finance"
}
```

### LOCATION

```json
{
  "assignment_type": "LOCATION",
  "assigned_location_id": 3,
  "assigned_location_name_snapshot": "Meeting Room"
}
```

LOCATION assignment juga mengubah `assets.current_location_id`.

### SHARED_POOL

```json
{ "assignment_type": "SHARED_POOL", "purpose": "Shared meeting laptop" }
```

Assign side effects:

1. insert `asset_assignments`;
2. `assets.status=ASSIGNED`;
3. `assets.current_assignment_id=<new id>`;
4. Asset History `ASSIGNED`;
5. Activity Log `ASSIGN`.

## Return

```http
POST /api/assets/:id/return
```

Optional body:

```json
{
  "returned_at": "2026-09-15T15:00:00+07:00",
  "return_condition": "GOOD",
  "return_location_id": 1,
  "return_note": "Returned complete"
}
```

Defaults:

- returned_at = now
- return_condition = current Asset condition
- return_location_id = current Asset location

Side effects:

- active assignment row ditutup;
- Asset status AVAILABLE;
- current_assignment_id NULL;
- location/condition diperbarui;
- history `RETURNED`;
- Activity Log `RETURN`.

## Transfer

```http
POST /api/assets/:id/transfer
```

At least one destination harus berbeda:

```json
{
  "to_location_id": 2,
  "to_company_id": "comp-pnm-0001",
  "to_managing_department_id": 8,
  "transfer_date": "...",
  "reason": "Relocation",
  "notes": "..."
}
```

Omitted destination memakai current value. Actor harus punya `ASSET_TRANSFER` pada origin Asset dan destination company/department.

Transfer tidak mengubah assignment row. Jika business ingin assignment ikut berubah, lakukan Assignment/Return sesuai flow terpisah.

## Terminal lifecycle

```http
PATCH /api/assets/:id/lifecycle
```

Body:

```json
{ "status": "RETIRED", "reason": "End of useful life" }
```

Allowed terminal statuses:

- LOST
- RETIRED
- DISPOSED
- VOID

Active assignment harus di-return dulu.

## History endpoint

```http
GET /api/assets/:id/history
```

Response data berisi:

- asset current state
- `history`
- `assignments`
- `transfers`
- `maintenances`
- `external_references`

FE Asset Detail dapat membuat tabs/timeline dari data ini.
