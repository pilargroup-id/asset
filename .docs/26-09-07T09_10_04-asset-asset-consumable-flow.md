# Asset and Consumable Business Flow

## Serialized Asset

A serialized asset represents one physical unit.

Typical lifecycle:

```text
REGISTERED
  ↓
AVAILABLE
  ↓
ASSIGNED
  ↓
RETURNED / AVAILABLE
```

Other valid paths include maintenance, lost, retirement, disposal, and void according to endpoint/business rules.

### Creation

Asset creation establishes:

- immutable issued asset number;
- category/tracking type;
- company owner;
- managing department;
- current location;
- purchase/warranty data;
- optional custom attribute values;
- optional depreciation configuration through the depreciation module.

### Assignment

Assignment is a transaction. Supported conceptual targets include USER, DEPARTMENT, LOCATION, and SHARED_POOL. The transaction stores historical target snapshots where applicable and updates the asset current assignment pointer.

### Return

Return closes the active assignment. It records return date, condition, destination location, notes, and actor. It does not merely set a holder field to null.

### Transfer

Transfer records old and new organizational/location context before updating the current asset state. Company/managing-department transfer is subject to authorization and business constraints.

### Maintenance

Maintenance has its own record containing type, vendor, dates, cost, problem/result, status, and notes. Maintenance events are also reflected in asset history.

### History

`asset_history` is the business timeline. `activity_logs` is the user/application audit timeline. They are intentionally different.

## Consumable

Consumables are quantity-based, not per-unit serialized objects.

### Stock balance

`consumable_stock_balances` stores current quantity per location for efficient reads.

### Stock ledger

Every stock change is represented by `consumable_stock_transactions`. Business stock should never be silently changed with a direct CRUD update.

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

### ISSUE recipient

ISSUE must carry recipient/purpose context. Recipient can represent a user, department, asset, location, or general usage according to the movement validation. This enables consumable usage reporting.

### Transfer

A location transfer changes source/destination balances but does not create/destroy total stock.

### Negative stock

Default implementation:

```text
ALLOW_NEGATIVE_CONSUMABLE_STOCK=false
```

This is an implementation default, not a hardcoded department rule.
