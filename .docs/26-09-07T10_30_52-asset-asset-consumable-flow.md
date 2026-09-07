# Asset and Consumable Business Flow

## Serialized Asset

Serialized Asset is tracked per physical unit.

Core lifecycle operations are explicit business transactions:

```text
Create/Register
-> Available
-> Assign
-> Return
-> Transfer
-> Maintenance
-> Retire/Dispose/Lost/Void where applicable
```

Assignment, Return, Transfer and Maintenance must not be simulated by directly overwriting current-state fields.

Current state may be cached on `assets`, but transaction/history records remain authoritative for audit.

## Assignment

Targets supported by domain model:

- USER
- DEPARTMENT
- LOCATION
- SHARED_POOL

For USER assignment, the PilarGroup user UUID is stored with name snapshot when provided/resolved.

`assets.current_assignment_id` points to the active assignment for efficient lookup.

## Return

Return closes the active `asset_assignments` record and records return condition/location/note. The Asset becomes available unless another explicit lifecycle rule applies.

## Transfer

Transfer records from/to location, company and managing department. A direct normal Asset update cannot change these fields.

## Maintenance

Maintenance is its own record and appears in Asset history. Completing maintenance restores state according to whether an active assignment still exists.

## External references

Ticket or another future internal system can link to an Asset through `asset_external_references`. This is a logical integration reference, not ownership of the external record.

## Consumable

Consumables use quantity and stock ledger rather than per-unit lifecycle.

Movement types:

- OPENING_BALANCE
- RECEIVE
- ISSUE
- TRANSFER
- ADJUSTMENT
- WRITE_OFF
- RETURN

Each movement creates `consumable_stock_transactions`. Per-location balances are maintained in `consumable_stock_balances` for efficient reads.

## Consumable recipient

ISSUE can identify recipient by:

- USER
- DEPARTMENT
- ASSET
- LOCATION
- GENERAL_USAGE

Recipient snapshots are kept where needed so historical usage stays readable even when central directory data changes.
