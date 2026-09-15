# Asset API Payload Cookbook

Dokumen ini fokus pada **body yang FE kirim**. Untuk permission dan business side effect, lihat API reference/domain document.

## Master Data

### Category create

```json
{
  "code": "LAPTOP",
  "name": "Laptop",
  "tracking_type": "SERIALIZED_ASSET",
  "is_depreciable": 1,
  "is_active": 1
}
```

### Category attribute create

```json
{
  "category_id": 1,
  "attribute_code": "RAM_GB",
  "attribute_name": "RAM (GB)",
  "data_type": "NUMBER",
  "is_required": 1,
  "sort_order": 10,
  "is_active": 1
}
```

### Location create flat

```json
{
  "code": "DG",
  "name": "Duta Garden",
  "parent_id": null,
  "location_type": "SITE",
  "company_id": "comp-pnm-0001",
  "is_active": 1
}
```

### Location create child

```json
{
  "code": "DG-ITROOM",
  "name": "IT Room",
  "parent_id": 1,
  "location_type": "ROOM",
  "company_id": "comp-pnm-0001",
  "is_active": 1
}
```

`location_type` hanyalah convention UI saat ini.

### Vendor

```json
{
  "code": "VND-001",
  "name": "PT Vendor",
  "contact_name": "Budi",
  "phone": "021...",
  "email": "vendor@example.com",
  "address": "...",
  "notes": "...",
  "is_active": 1
}
```

### Brand / Model / UOM

```json
{ "name":"Lenovo", "code":"LENOVO", "is_active":1 }
```

```json
{ "brand_id":1, "name":"ThinkPad E14", "code":"E14", "is_active":1 }
```

```json
{ "code":"PCS", "name":"Pieces", "is_active":1 }
```

---

# Permission

## Department IT gets Asset View for IT only

```json
{
  "permission_code": "ASSET_VIEW",
  "subject_type": "DEPARTMENT",
  "subject_id": "8",
  "access_scope_type": "DEPARTMENT",
  "access_scope_id": "8"
}
```

## Department IT gets global view

```json
{
  "permission_code": "ASSET_VIEW",
  "subject_type": "DEPARTMENT",
  "subject_id": "8",
  "access_scope_type": "GLOBAL",
  "access_scope_id": ""
}
```

## One user gets company scope

```json
{
  "permission_code": "ASSET_UPDATE",
  "subject_type": "USER",
  "subject_id": "<uuid>",
  "access_scope_type": "COMPANY",
  "access_scope_id": "comp-pnm-0001"
}
```

---

# Numbering

```json
{
  "managing_department_id": 8,
  "company_id": "comp-pnm-0001",
  "sequence_type": "ASSET",
  "name": "IT Asset PNM",
  "prefix": "IT-AST",
  "department_token": "IT",
  "company_token": "PNM",
  "pattern": "{PREFIX}-{YY}-{SEQ:5}",
  "sequence_length": 5,
  "starting_sequence": 1,
  "reset_period": "YEARLY",
  "is_active": true
}
```

---

# Asset

## Create basic Asset

```json
{
  "asset_name": "Lenovo ThinkPad E14",
  "category_id": 1,
  "brand_id": 1,
  "model_id": 2,
  "serial_number": "SN123",
  "managing_department_id": 8,
  "company_id": "comp-pnm-0001",
  "current_location_id": 1,
  "status": "AVAILABLE",
  "asset_condition": "GOOD",
  "purchase_date": "2026-09-01",
  "purchase_cost": 12000000,
  "vendor_id": 1,
  "warranty_until": "2029-09-01",
  "notes": "Primary laptop",
  "attributes": [
    { "attribute_id": 10, "value": "Intel Core i7" },
    { "attribute_id": 11, "value": 16 }
  ]
}
```

Omit `asset_number` untuk auto numbering.

## Update Asset master only

```json
{
  "serial_number": "SN124",
  "asset_condition": "FAIR",
  "notes": "Minor scratch",
  "attributes": [
    { "attribute_id": 11, "value": 32 }
  ]
}
```

Jangan kirim company/managing_department/location/status/current_assignment/asset_number di PUT.

## Assign to USER

```json
{
  "assignment_type": "USER",
  "assigned_user_id": "<uuid>",
  "assigned_user_name_snapshot": "Budi Finance",
  "assigned_at": "2026-09-15T09:00:00+07:00",
  "purpose": "Daily work"
}
```

## Assign to DEPARTMENT

```json
{
  "assignment_type": "DEPARTMENT",
  "assigned_department_id": 7,
  "assigned_department_name_snapshot": "Finance",
  "purpose": "Shared Finance printer"
}
```

## Assign to LOCATION

```json
{
  "assignment_type": "LOCATION",
  "assigned_location_id": 5,
  "assigned_location_name_snapshot": "Meeting Room 1",
  "purpose": "Meeting display"
}
```

## Assign SHARED_POOL

```json
{
  "assignment_type": "SHARED_POOL",
  "purpose": "Shared IT troubleshooting laptop"
}
```

## Return

```json
{
  "returned_at": "2026-09-15T17:00:00+07:00",
  "return_condition": "GOOD",
  "return_location_id": 1,
  "return_note": "Complete"
}
```

## Transfer location only

```json
{
  "to_location_id": 2,
  "transfer_date": "2026-09-15T11:00:00+07:00",
  "reason": "Office relocation"
}
```

## Transfer managing department/company

```json
{
  "to_company_id": "comp-other-0002",
  "to_managing_department_id": 1,
  "to_location_id": 10,
  "reason": "Custodian transfer",
  "notes": "Approved operational transfer"
}
```

## Start maintenance

```json
{
  "maintenance_type": "REPAIR",
  "vendor_id": 2,
  "start_date": "2026-09-15T10:00:00+07:00",
  "cost": 0,
  "problem_description": "Cannot boot",
  "notes": "Diagnostics"
}
```

Do not send `status` from FE MVP.

## Complete maintenance

```json
{
  "completion_date": "2026-09-16T15:00:00+07:00",
  "result": "SSD replaced",
  "cost": 850000,
  "notes": "Tested OK"
}
```

## Lifecycle

```json
{ "status":"RETIRED", "reason":"End of useful life" }
```

---

# Consumable

## Create

```json
{
  "name": "Canon GI-71 Black",
  "category_id": 20,
  "brand_id": 3,
  "variant": "Black",
  "uom_id": 1,
  "managing_department_id": 8,
  "company_id": "comp-pnm-0001",
  "minimum_stock": 5,
  "notes": "Printer ink"
}
```

## RECEIVE

```json
{
  "movement_type": "RECEIVE",
  "to_location_id": 1,
  "quantity": 10,
  "unit_cost": 95000,
  "reference_number": "PO-2026-001",
  "transaction_date": "2026-09-15T10:00:00+07:00"
}
```

## ISSUE USER

```json
{
  "movement_type": "ISSUE",
  "from_location_id": 1,
  "quantity": 2,
  "recipient_type": "USER",
  "recipient_user_id": "<uuid>",
  "recipient_user_name_snapshot": "Budi",
  "purpose": "Printer Finance"
}
```

## ISSUE DEPARTMENT

```json
{
  "movement_type": "ISSUE",
  "from_location_id": 1,
  "quantity": 2,
  "recipient_type": "DEPARTMENT",
  "recipient_department_id": 7,
  "recipient_department_name_snapshot": "Finance"
}
```

## ISSUE ASSET

```json
{
  "movement_type": "ISSUE",
  "from_location_id": 1,
  "quantity": 1,
  "recipient_type": "ASSET",
  "recipient_asset_id": 123,
  "purpose": "Refill printer"
}
```

## ISSUE LOCATION

```json
{
  "movement_type": "ISSUE",
  "from_location_id": 1,
  "quantity": 10,
  "recipient_type": "LOCATION",
  "recipient_location_id": 12,
  "purpose": "Pantry stock"
}
```

## ISSUE GENERAL_USAGE

```json
{
  "movement_type": "ISSUE",
  "from_location_id": 1,
  "quantity": 3,
  "recipient_type": "GENERAL_USAGE",
  "purpose": "General office usage"
}
```

## TRANSFER

```json
{
  "movement_type": "TRANSFER",
  "from_location_id": 1,
  "to_location_id": 2,
  "quantity": 5
}
```

## ADJUSTMENT subtract

```json
{
  "movement_type": "ADJUSTMENT",
  "to_location_id": 1,
  "quantity": -2,
  "notes": "Stock count correction"
}
```

---

# Depreciation

## Create policy

```json
{
  "managing_department_id": 8,
  "company_id": "comp-pnm-0001",
  "name": "IT Laptop 48M",
  "method": "STRAIGHT_LINE",
  "useful_life_months": 48,
  "salvage_value_type": "FIXED",
  "salvage_value": 0,
  "is_active": true
}
```

## Category default

```json
{
  "category_id": 1,
  "managing_department_id": 8,
  "company_id": "comp-pnm-0001",
  "depreciation_policy_id": 1
}
```

## Configure Asset from policy

```json
{
  "depreciation_policy_id": 1,
  "depreciation_start_date": "2026-09-01"
}
```

## Configure manually

```json
{
  "depreciation_method": "STRAIGHT_LINE",
  "useful_life_months": 60,
  "salvage_value_type": "PERCENT",
  "salvage_value": 10,
  "depreciation_start_date": "2026-09-01"
}
```

## Revision

```json
{
  "effective_date": "2027-01-01",
  "reason": "Revised useful life",
  "useful_life_months": 54,
  "salvage_value": 0
}
```

## Generate / finalize

```json
{ "through_date":"2026-12-31" }
```

```json
{ "period_year":2026, "period_month":9 }
```

---

# Import

Preview multipart:

```text
file=<xlsx/xls/csv>
```

Commit:

```json
{ "preview_token":"<token>" }
```

---

# Internal Ticket link

```json
{
  "source_system":"ticket",
  "reference_type":"TICKET",
  "reference_id":"ticket-uuid",
  "reference_number":"TKT-IT-26-00001",
  "linked_by_user_id":"<uuid>"
}
```
