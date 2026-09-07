# Asset Depreciation

## Scope

Depreciation applies only to categories/assets marked depreciable. Consumables do not use serialized Asset depreciation.

## Policy hierarchy

```text
Department policy template
-> optional category default
-> Asset depreciation snapshot
-> later revision if explicitly changed
```

Changing a policy template does not silently rewrite existing Asset depreciation configuration.

## Tables

- `depreciation_policies`
- `category_depreciation_defaults`
- `asset_depreciation_configs`
- `asset_depreciation_revisions`
- `asset_depreciation_ledger`

## MVP calculation

Schema is future-ready for multiple methods, but calculation implemented by current backend is `STRAIGHT_LINE`.

Important snapshot values include:

- purchase cost
- method
- useful life months
- salvage type/value
- depreciation start date

## Revision rule

A revision records effective date, old/new values, reason and actor. Historical finalized periods must not be rewritten silently.

## Permission

Read and management are controlled through `DEPRECIATION_VIEW` / `DEPRECIATION_MANAGE` plus effective access scope resolved from `permission_assignments`.
