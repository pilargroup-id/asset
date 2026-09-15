# Asset Database Relationship Map

## Serialized Asset

```text
master_categories (SERIALIZED_ASSET)
   │
   ├──< master_category_attributes
   │          │
   │          └──< asset_attribute_values >── assets
   │
   └──< assets
         ├── category_id -> master_categories
         ├── brand_id -> master_brands
         ├── model_id -> master_models
         ├── current_location_id -> master_locations
         ├── vendor_id -> master_vendors
         ├──< asset_assignments
         ├──< asset_transfers
         ├──< asset_maintenances
         ├──< asset_history
         ├──< asset_external_references
         ├──< asset_depreciation_configs
         ├──< asset_depreciation_revisions
         └──< asset_depreciation_ledger
```

`assets.current_assignment_id` adalah logical pointer ke current `asset_assignments.id`; migration tidak mendefinisikan FK untuk field ini karena table assignment dibuat setelah Asset dan state lifecycle dikelola service.

## Consumable

```text
master_categories (CONSUMABLE)
   └──< consumables
         ├── brand_id -> master_brands
         ├── uom_id -> master_uoms
         ├──< consumable_stock_balances >── master_locations
         └──< consumable_stock_transactions
                  ├── from/to location -> master_locations
                  ├── recipient_asset_id -> assets
                  └── recipient_location_id -> master_locations
```

User/department recipient tidak FK lokal karena central directory external.

## Depreciation

```text
depreciation_policies
   ├──< category_depreciation_defaults >── master_categories
   └──< asset_depreciation_configs >── assets

assets
   ├──< asset_depreciation_revisions
   └──< asset_depreciation_ledger
```

Policy adalah template; Asset config adalah snapshot.

## Permission

```text
master_permissions
   └──< permission_assignments
```

subject_id dan access_scope_id sengaja generic string tanpa FK central.

## Audit

`activity_logs` sengaja tidak mempunyai FK ke entity/user agar audit tetap readable walau external directory/entity berubah dan supaya logging tidak gagal karena lifecycle FK.

## Delete semantics penting

- Banyak business FK memakai `ON DELETE RESTRICT` untuk mencegah penghapusan history.
- Optional descriptive master seperti brand/model/vendor/location sering `SET NULL` di Asset.
- `asset_attribute_values` CASCADE jika Asset dihapus di DB, tetapi aplikasi tidak menyediakan normal hard delete Asset.
- Rekomendasi business: deactivate/terminal lifecycle, bukan manual hard delete.
