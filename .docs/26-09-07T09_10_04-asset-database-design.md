# Asset Database Design

## Principles

- No duplicated employee/user master when PilarGroup is the source.
- User/department/company references are logical external IDs and do not have cross-database FK constraints.
- Historical records keep snapshots where needed.
- Serialized assets and consumables are separate domains.
- Operational state never replaces transaction history.
- Activity Log is separate from business history.
- Import preview/result state is temporary JSON, not a database entity.

## External identifier types

| Reference | Source | DB type |
|---|---|---|
| User | `/auth/me.id` | `CHAR(36)` |
| Department | department `id` | `BIGINT UNSIGNED` |
| Company | company `id` | `VARCHAR(64)` |

Example:

```text
user_id       = 550e8400-e29b-41d4-a716-446655440000
department_id = 8
company_id    = comp-pnm-0001
```

## Master/configuration

| Table | Purpose |
|---|---|
| `master_brands` | Brand master |
| `master_models` | Model master |
| `master_uoms` | Consumable UOM |
| `master_vendors` | Purchase/repair/supplier vendor |
| `master_locations` | Hierarchical locations |
| `master_categories` | Category + tracking type + depreciable flag |
| `master_category_attributes` | Category custom attribute definitions |
| `numbering_configs` | Configurable ASSET/CONSUMABLE numbering |

System-controlled tracking types:

```text
SERIALIZED_ASSET
CONSUMABLE
```

## Authorization

| Table | Purpose |
|---|---|
| `master_permissions` | Seeded permission definitions |
| `user_permissions` | User permission grants with GLOBAL/COMPANY/DEPARTMENT scope |

There is no local `users` employee master.

## Serialized asset

| Table | Purpose |
|---|---|
| `assets` | Current per-unit state |
| `asset_attribute_values` | Category custom attribute values |
| `asset_assignments` | Assignment lifecycle; return closes an assignment |
| `asset_transfers` | Location/company/managing-department transfer history |
| `asset_maintenances` | Maintenance records |
| `asset_history` | Consolidated business timeline |

`asset_number` is unique and immutable through ordinary update. Scope/location/holder/status changes use business transactions.

## Consumable

| Table | Purpose |
|---|---|
| `consumables` | Consumable master |
| `consumable_stock_balances` | Current quantity by consumable + location |
| `consumable_stock_transactions` | Stock movement ledger |

Movement types:

```text
OPENING_BALANCE
RECEIVE
ISSUE
TRANSFER
ADJUSTMENT
WRITE_OFF
RETURN
```

## Depreciation

| Table | Purpose |
|---|---|
| `depreciation_policies` | Reusable policy template |
| `category_depreciation_defaults` | Default mapping by category/scope |
| `asset_depreciation_configs` | Asset snapshot configuration |
| `asset_depreciation_revisions` | Effective revisions |
| `asset_depreciation_ledger` | Periodic depreciation history |

## Data management / audit

### No import tables

The final design intentionally does **not** contain:

```text
import_batches
import_batch_rows
```

Preview/error state lives only as expiring JSON under:

```text
backend/storage/import-previews/
```

Those files are temporary application state and are not business history.

### `export_history`

Stores export audit metadata only:

```text
export_number
export_type
format
filters
scope_snapshot
row_count
filename      # download filename metadata, not a filesystem path
created_by
created_at
```

No export binary is stored.

### `activity_logs`

Immutable audit table containing:

```text
user snapshots
module
action
source
correlation_id
entity reference
meaningful old_values / new_values
request metadata
status/error
created_at
```

For import:

```text
source         = IMPORT
correlation_id = import_reference UUID
```

One import summary and all related per-entity logs share the same `correlation_id`.

## Migration order

```text
001_master_configuration.sql
002_permissions.sql
003_serialized_assets.sql
004_consumables.sql
005_depreciation.sql
006_data_management_audit.sql
```

Consolidated reference:

```text
backend/database/schema/asset-schema.sql
```
