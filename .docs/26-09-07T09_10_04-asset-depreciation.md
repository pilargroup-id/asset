# Asset Depreciation

## Scope

Depreciation applies only to serialized assets/categories configured as depreciable. Consumables do not use the serialized-asset depreciation lifecycle.

## Hierarchy

```text
Department/company policy template
        ↓
Category default policy
        ↓
Asset depreciation snapshot
        ↓
Optional effective revision
        ↓
Periodic ledger
```

## Policy

Core policy fields include:

```text
managing_department_id
optional company_id
name
method
useful_life_months
salvage_value_type
salvage_value
is_active
```

The schema is future-ready, while MVP calculation behavior is focused on `STRAIGHT_LINE`.

## Asset configuration snapshot

When a policy is applied, the asset stores the relevant values as its own depreciation configuration. Editing the default policy later does not automatically rewrite an existing asset's historical terms.

## Ledger

Periodic ledger rows contain:

```text
period_year
period_month
opening_book_value
depreciation_amount
accumulated_depreciation
closing_book_value
calculation_method
is_final
```

## Revision

A depreciation change after an asset is already running creates a revision with an effective date/period. Finalized historical periods are not rewritten. New calculations use the effective configuration for future periods.

## Authorization

Viewing depreciation requires `DEPRECIATION_VIEW`. Policy/config/revision/generation/finalization operations require `DEPRECIATION_MANAGE`, with organizational scope checked against the affected asset/policy.
