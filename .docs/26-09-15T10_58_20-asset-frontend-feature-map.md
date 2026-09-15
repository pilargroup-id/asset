# Asset Frontend Feature Map

Dokumen ini menjawab **fitur/page apa yang FE perlu buat**, data apa yang dipakai, dan kapan field harus muncul.

## 1. App initialization

On authenticated app load:

1. `GET /api/auth/me`
2. `GET /api/permissions/effective`
3. cache effective permission untuk UI visibility; backend tetap authoritative.

Jangan hardcode `department === IT`.

## 2. Dashboard

Page: Dashboard.

Endpoint: `GET /api/dashboard`.

Cards Asset dari `assets.total` dan `assets.by_status`.

Consumable low-stock list dari `consumables.low_stock`.

Jika section response null karena user tidak punya VIEW domain terkait, jangan tampilkan section.

## 3. Asset list

Endpoint: `GET /api/assets`.

FE controls:

- search
- status filter
- category filter
- location filter
- pagination
- Create button if ASSET_CREATE

No current API filter `managing_department_id`/`company_id` explicitly; effective scope already restricts rows but FE cannot currently narrow by those query fields without backend enhancement.

## 4. Asset create/edit form

Core selectors:

- Category from master categories tracking_type SERIALIZED_ASSET
- Brand
- Model optionally filtered by brand
- Managing Department from directory
- Company from directory
- Location
- Vendor

After category selection fetch category_attributes and render dynamic fields by data_type.

Create status dropdown only REGISTERED/AVAILABLE.

Edit form **must not show editable** asset_number, managing_department, company, current_location, lifecycle status, current assignment. Berikan dedicated action buttons instead.

## 5. Asset detail

Data:

- `GET /assets/:id`
- `GET /assets/:id/history`
- depreciation endpoint if user has DEPRECIATION_VIEW

Recommended tabs:

- Overview
- Custom Attributes
- Assignment History
- Transfer History
- Maintenance
- Depreciation
- External References
- Timeline/History

## 6. Assignment modal conditional UI

Select `assignment_type` first.

```text
USER -> show user picker; hide department/location target
DEPARTMENT -> show department picker
LOCATION -> show location picker
SHARED_POOL -> no target picker; show purpose
```

Snapshot name fields can be filled from selected directory/master display values.

## 7. Return modal

Show:

- returned_at
- return_condition enum
- return_location picker
- note

Current assignment details should be displayed read-only for context.

## 8. Transfer modal

Show current company/department/location read-only, plus optional destination selectors.

Require FE-side at least one changed destination before submit. Backend also rejects unchanged transfer.

## 9. Lifecycle action

Only offer LOST/RETIRED/DISPOSED/VOID. If Asset has active assignment, UI should guide user to Return first.

## 10. Maintenance

MVP actions:

- Start Maintenance
- Complete Maintenance

Do not expose IN_PROGRESS/CANCELED transition button until backend endpoint exists.

## 11. Consumable list/detail

List filters category/active/search. Detail shows balances + transaction history.

## 12. Consumable movement form

Select movement_type first, then fields change using matrix from enum doc.

Examples:

```text
ISSUE -> from location + qty + recipient type + conditional recipient + purpose
TRANSFER -> from + to + qty
ADJUSTMENT -> location + signed qty + notes
RECEIVE -> destination + qty + unit cost/reference optional
```

Button permission should map to movement-specific permission.

## 13. Depreciation

Admin pages:

- Policy list/create/edit
- Category default mapping

Asset detail:

- Suggest policy
- Configure
- Revision history
- Generate through date
- Ledger table
- Finalize period

MVP method UI should only present STRAIGHT_LINE.

## 14. Master Data

Pages/tabs:

- Categories
- Category Attributes
- Locations
- Vendors
- Brands
- Models
- UOMs

Location hierarchy can be tree or flat. Since `location_type` is free text backend, if UI uses dropdown it must be a product convention.

## 15. Permission Management

Three-step form:

1. Permission code
2. Subject type + subject picker
3. Access scope type + conditional scope picker

Show effective permissions separately from assignment list so admin dapat memahami union/redundancy.

## 16. Numbering

Admin form harus preview pattern client-side only as convenience; backend tetap authoritative. Jangan edit current_sequence manual.

## 17. Import

Flow:

```text
select type
-> download template
-> select file
-> preview
-> summary + row table
-> commit
-> download errors if token
```

Commit button boleh tetap aktif jika ada WARNING/INVALID karena backend commit row non-invalid dan returns failed; UX dapat meminta confirmation.

## 18. Export

Current backend export adalah direct report type download; no field selection UI needed unless backend changed.

## 19. Activity Log

Filters: module/action/user/entity/source/correlation. For import summary, make `correlation_id` clickable to show row-level entity logs.

## 20. Pages that backend **does not currently support as JSON global list**

Backend belum punya global JSON endpoints terpisah untuk:

- all assignments across assets
- all transfers
- all maintenance records
- report JSON

Data tersebut tersedia per Asset history atau XLSX exports. Jika FE membutuhkan dedicated global operational pages dengan pagination/search, backend endpoint baru perlu dibuat. Jangan mencoba mengambil seluruh Assets lalu merge di browser.
