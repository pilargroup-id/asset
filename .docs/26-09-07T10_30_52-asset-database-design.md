# Asset Database Design

## Identity contract

| Concept | Type | Source |
|---|---|---|
| User | `CHAR(36)` UUID | `/auth/me.id` |
| Department | `BIGINT UNSIGNED` | PilarGroup department ID |
| Company | `VARCHAR(64)` | PilarGroup company ID |

`internal_id` from `/auth/me` is not the canonical Asset authorization identifier.

## Main table groups

### Master / configuration

- `master_categories`
- `master_category_attributes`
- `master_locations`
- `master_vendors`
- `master_brands`
- `master_models`
- `master_uoms`
- `numbering_configs`
- `numbering_sequences`

### Authorization

- `master_permissions`
- `permission_assignments`

### Serialized asset

- `assets`
- `asset_attribute_values`
- `asset_assignments`
- `asset_transfers`
- `asset_maintenances`
- `asset_history`
- `asset_external_references`

### Consumable

- `consumables`
- `consumable_stock_balances`
- `consumable_stock_transactions`

### Depreciation

- `depreciation_policies`
- `category_depreciation_defaults`
- `asset_depreciation_configs`
- `asset_depreciation_revisions`
- `asset_depreciation_ledger`

### Audit

- `activity_logs`

There are intentionally no permanent `import_batches`, `import_batch_rows`, or `export_history` tables.

## `permission_assignments`

Core fields:

```text
permission_id
subject_type
subject_id
access_scope_type
access_scope_id
is_active
created_by
updated_by
created_at
updated_at
```

Examples:

```text
DEPARTMENT 8 -> ASSET_VIEW -> GLOBAL
```

All users whose `/auth/me.departments[]` contains department 8 inherit that grant.

```text
DEPARTMENT 1 -> ASSET_UPDATE -> DEPARTMENT 1
```

The target department receives management access only for department 1 scope.

```text
USER <uuid> -> ASSET_VIEW -> COMPANY comp-pnm-0001
```

Only that user gets company-scoped Asset view access.

Exact duplicate assignments are prevented by a unique constraint. Different matching assignments are allowed and merged as a union.

## `asset_external_references`

Purpose: logical links from Asset to external systems without cross-database FK.

Core fields:

```text
asset_id
source_system
reference_type
reference_id
reference_number
linked_by_user_id
linked_at
```

For future Ticket integration:

```text
source_system    = ticket
reference_type   = TICKET
reference_id     = <ticket-owned opaque id>
reference_number = <human-readable ticket number>
```

Asset does not copy full ticket data.

## Activity log

`activity_logs` is immutable through normal user-facing APIs and stores meaningful audit metadata/diffs.

Export is represented only here, for example:

```text
module = EXPORT
action = EXPORT
new_values = {
  export_type,
  format,
  row_count,
  filename,
  filters,
  effective_scopes
}
```

## Business history vs audit

`asset_history` answers: "what happened to this asset?"

`activity_logs` answers: "who/system did what in the application?"

An external Ticket link creates an Asset history event and an Activity Log event, while ticket details remain owned by Ticket.
