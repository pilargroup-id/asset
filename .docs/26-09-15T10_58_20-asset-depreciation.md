# Asset Depreciation

## Preconditions

Asset depreciation hanya dapat dikonfigurasi bila:

1. category `is_depreciable=1`;
2. Asset memiliki `purchase_cost`;
3. ada `depreciation_start_date` atau Asset `purchase_date`;
4. actor punya `DEPRECIATION_MANAGE` di Asset scope.

## Policy

Required create fields:

- `name`
- `managing_department_id`
- `useful_life_months` > 0

Optional:

- `company_id`
- `method` default STRAIGHT_LINE
- `salvage_value_type` default FIXED
- `salvage_value` default 0
- `is_active`

Schema menerima STRAIGHT_LINE/DECLINING_BALANCE/MANUAL, tetapi calculation MVP hanya STRAIGHT_LINE.

## Category default

```http
PUT /api/depreciation/category-default
```

Required:

```json
{
  "category_id": 1,
  "managing_department_id": 8,
  "depreciation_policy_id": 3,
  "company_id": "comp-pnm-0001"
}
```

Policy department harus sama. Jika policy company-specific, company juga harus sama.

Suggestion lookup memakai exact company default lebih dulu lalu fallback company NULL.

## Configure Asset via policy

```json
{
  "depreciation_policy_id": 3,
  "depreciation_start_date": "2026-09-01"
}
```

Backend snapshot policy ke `asset_depreciation_configs`, termasuk current purchase cost.

## Configure Asset manual

Jika tidak mengirim policy:

```json
{
  "depreciation_method": "STRAIGHT_LINE",
  "useful_life_months": 48,
  "salvage_value_type": "FIXED",
  "salvage_value": 0,
  "depreciation_start_date": "2026-09-01"
}
```

`useful_life_months` wajib.

## Revision

```http
POST /api/depreciation/assets/:assetId/revisions
```

Required:

- `effective_date`
- `reason`

Optional changed config fields:

- depreciation_method
- useful_life_months
- salvage_value_type
- salvage_value
- depreciation_start_date

Backend insert revision old/new JSON lalu update active config.

## Ledger generation

```http
POST /api/depreciation/assets/:assetId/generate
```

Optional:

```json
{ "through_date": "2026-12-31" }
```

Default through_date = current date.

Straight-line formula:

```text
salvage = FIXED ? salvage_value : purchase_cost_snapshot * salvage_value / 100
monthly = (purchase_cost_snapshot - salvage) / useful_life_months
```

Generator:

- memulai dari depreciation_start_date jika belum ada final period;
- jika ada final period, lanjut bulan berikutnya;
- tidak melewati useful_life_months;
- tidak menurunkan closing book value di bawah salvage;
- non-final row existing dapat di-update;
- final row tidak di-overwrite.

## Finalize

```http
PATCH /api/depreciation/assets/:assetId/finalize
```

Body:

```json
{ "period_year": 2026, "period_month": 9 }
```

Current service hanya mengecek row period ada melalui affectedRows. FE wajib mengirim year/month valid; backend belum mempunyai explicit month 1..12 validation sebelum query.

## View

`GET /api/depreciation/assets/:assetId` mengembalikan Asset + active config + revisions + ledger.
