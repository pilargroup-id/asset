# Asset API for Future Ticket Integration

## Ownership boundary

Asset = source of truth physical Asset/current assignment.
Ticket = source of truth ticket/request/incident.

Tidak ada direct DB query atau cross-database FK.

## Authentication

Internal endpoints:

```http
X-Internal-Secret: <INTERNAL_API_SECRET>
```

Secret hanya backend Ticket dan backend Asset. Browser tidak boleh memilikinya.

## Find current Asset assigned to requester

```http
GET /api/internal/assets/assigned?user_id=<uuid>
```

Alias `assigned_user_id` juga diterima sebagai query key.

Optional:

- `managing_department_id` positive integer
- `company_id` string

Lookup hanya mengembalikan assignment type USER yang:

- assigned_user_id match;
- returned_at NULL;
- row assignment adalah `assets.current_assignment_id`.

Response field termasuk asset id/number/name/serial, managing dept, company, location, status, condition, category, brand/model, assignment id/date/purpose. Purchase cost/book value tidak dikembalikan.

## Recommended Ticket flow

```text
requester UUID
+ target ticket department
-> Ticket backend calls Asset with managing_department_id target
-> FE Ticket menampilkan relevant Asset
-> user/agent pilih Asset yang rusak/terkait
-> Ticket dibuat
-> Ticket backend link external reference ke Asset
```

Jangan otomatis attach semua Asset user. Auto-select hanya jika business/UI yakin satu relevant Asset.

## Link Ticket

```http
POST /api/internal/assets/:assetId/external-references
```

```json
{
  "source_system": "ticket",
  "reference_type": "TICKET",
  "reference_id": "<ticket-id>",
  "reference_number": "TKT-IT-26-00001",
  "linked_by_user_id": "<optional uuid>"
}
```

Required: source_system, reference_type, reference_id.

Normalization:

- source_system -> lowercase
- reference_type -> uppercase

Idempotency key secara DB:

```text
asset_id + source_system + reference_type + reference_id
```

Jika link sudah ada service mengembalikan existing record, tidak insert ulang.

New link side effects:

- insert asset_external_references;
- asset_history EXTERNAL_REFERENCE_LINKED;
- activity_logs EXTERNAL_REFERENCE_LINK source INTERNAL_API.

## Read links

```http
GET /api/internal/assets/:assetId/external-references
GET /api/internal/assets/:assetId/external-references?source_system=ticket
```

## What Ticket DB should store

Recommended snapshot:

- asset_id logical reference
- asset_number_snapshot
- asset_name_snapshot
- asset_category_snapshot

Tidak perlu copy purchase/depreciation data. Asset details yang berubah setelah ticket dibuat tidak boleh merusak historical display Ticket.
