# Asset API for Future Ticket Integration

## Purpose

This document is intentionally separate so it can be handed to the future multi-department Ticket project.

Asset is the source of truth for physical Asset assignment. Ticket is the source of truth for ticket/incident/request records. The systems may use different projects and databases.

**Do not query the Asset database directly from Ticket.** Use the internal API.

## Internal authentication

Asset internal endpoints use:

```http
X-Internal-Secret: <shared secret>
```

Asset environment:

```env
INTERNAL_API_SECRET=
```

The future Ticket backend receives the same secret through its own environment. The browser/frontend must never receive this secret.

## 1. Find assets currently assigned to a requester

```http
GET /api/internal/assets/assigned?user_id=<PILARGROUP_USER_UUID>
```

Optional filters:

```text
managing_department_id
company_id
```

Example IT ticket:

```http
GET /api/internal/assets/assigned?user_id=<uuid>&managing_department_id=8
```

Conceptual response item:

```json
{
  "id": 123,
  "asset_number": "IT-26-00001",
  "asset_name": "Lenovo ThinkPad E14",
  "serial_number": "...",
  "managing_department_id": 8,
  "company_id": "comp-pnm-0001",
  "status": "ASSIGNED",
  "asset_condition": "GOOD",
  "category_id": 1,
  "category_name": "Laptop",
  "brand_name": "Lenovo",
  "model_name": "ThinkPad E14",
  "assignment_id": 10,
  "assigned_user_id": "<uuid>",
  "assigned_at": "..."
}
```

No purchase cost/book value is returned by this lookup endpoint.

### Recommended Ticket UX

When requester submits a ticket to a managing department:

```text
requester UUID
+ ticket target department
-> Ticket backend calls Asset lookup
-> show matching current assets
-> requester/agent selects relevant asset
```

Do not automatically attach every asset owned by the requester. If only one relevant asset exists, the Ticket UI may auto-select it.

## 2. Link a created Ticket to an Asset

```http
POST /api/internal/assets/:assetId/external-references
Content-Type: application/json
X-Internal-Secret: ...
```

Body:

```json
{
  "source_system": "ticket",
  "reference_type": "TICKET",
  "reference_id": "<ticket-owned-id>",
  "reference_number": "TKT-IT-26-00001",
  "linked_by_user_id": "<optional requester/agent PilarGroup UUID>"
}
```

The operation is idempotent for the same:

```text
asset_id + source_system + reference_type + reference_id
```

The link creates:

- `asset_external_references` record;
- `asset_history` event `EXTERNAL_REFERENCE_LINKED`;
- `activity_logs` event with `source=INTERNAL_API`.

Asset does not copy Ticket description, status, comments, SLA or other Ticket-owned business data.

## 3. Read external links for an Asset

```http
GET /api/internal/assets/:assetId/external-references
```

Optional:

```text
?source_system=ticket
```

## What Ticket should store

Ticket DB should keep a logical Asset reference plus snapshots useful for historical display, for example:

```text
asset_id
asset_number_snapshot
asset_name_snapshot
asset_category_snapshot
```

Do not create cross-database foreign keys.

## Multi-department behavior

The integration has no IT-specific logic.

IT example:

```text
Ticket target department = IT
-> filter managing_department_id = IT ID
```

HCGA example:

```text
Ticket target department = HCGA
-> filter managing_department_id = HCGA ID
```

Legal or future departments can use the same pattern if they manage Asset records.
