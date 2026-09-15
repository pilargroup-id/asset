# Asset Consumable System

## Concept

Consumable tidak memiliki physical-unit assignment lifecycle. Master disimpan pada `consumables`; quantity per location pada balance; semua perubahan stock melalui movement ledger.

## Create

Required:

- name
- category_id dengan tracking_type CONSUMABLE
- uom_id
- managing_department_id
- company_id

Optional:

- consumable_code; kosong -> numbering `CONSUMABLE`
- brand_id
- variant
- minimum_stock
- notes
- is_active

## Normal update

Allowed:

- name
- category_id
- brand_id
- variant
- uom_id
- minimum_stock
- notes
- is_active

Forbidden:

- consumable_code
- managing_department_id
- company_id

Current code tidak menyediakan dedicated Consumable ownership transfer endpoint. Lihat implementation notes sebelum FE membuat fitur pindah managing department/company untuk consumable.

## Stock movement endpoint

```http
POST /api/consumables/:id/movements
```

Common fields:

```json
{
  "movement_type": "...",
  "quantity": 2,
  "from_location_id": null,
  "to_location_id": null,
  "unit_cost": null,
  "recipient_type": null,
  "purpose": null,
  "reference_number": null,
  "notes": null,
  "transaction_date": null
}
```

### OPENING_BALANCE

Use untuk initial stock onboarding melalui operational endpoint; import opening stock juga menghasilkan movement ini.

```json
{ "movement_type":"OPENING_BALANCE", "to_location_id":1, "quantity":20 }
```

### RECEIVE

```json
{ "movement_type":"RECEIVE", "to_location_id":1, "quantity":10, "reference_number":"PO-001" }
```

### RETURN

Stock kembali ke location:

```json
{ "movement_type":"RETURN", "to_location_id":1, "quantity":1 }
```

### ISSUE

Harus mempunyai recipient:

```json
{
  "movement_type":"ISSUE",
  "from_location_id":1,
  "quantity":2,
  "recipient_type":"USER",
  "recipient_user_id":"<uuid>",
  "recipient_user_name_snapshot":"Budi",
  "purpose":"Printer Finance"
}
```

Lihat enum reference untuk target field per recipient_type.

### TRANSFER

```json
{ "movement_type":"TRANSFER", "from_location_id":1, "to_location_id":2, "quantity":3 }
```

Location harus berbeda. Total overall stock tetap, per-location berubah.

### ADJUSTMENT

```json
{ "movement_type":"ADJUSTMENT", "to_location_id":1, "quantity":-2, "notes":"Physical count correction" }
```

Quantity boleh positif atau negatif tetapi tidak 0.

### WRITE_OFF

```json
{ "movement_type":"WRITE_OFF", "from_location_id":1, "quantity":2, "notes":"Damaged" }
```

## Negative stock

Default:

```env
ALLOW_NEGATIVE_CONSUMABLE_STOCK=false
```

Jika movement membuat balance < 0 backend return 409 `INSUFFICIENT_STOCK` dengan current quantity dan requested delta.

## Detail/history

`GET /api/consumables/:id` menambahkan `balances`.

`GET /api/consumables/:id/history` mengembalikan master, balances, transactions.

## Low stock dashboard

Low stock ditentukan dari total SUM balance seluruh location `<= minimum_stock`. Ini bukan per-location minimum threshold.
