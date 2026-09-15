# Asset System Overview

## Tujuan

Asset adalah central multi-department Asset Management System Pilar Group. Sistem tidak memiliki business logic khusus `IT` atau `HCGA`; department baru harus bisa ikut menggunakan core yang sama melalui master/config/permission.

## Domain utama

### Serialized Asset

Barang yang dilacak per physical unit. Contoh Laptop, Router, AC, Furniture, Vehicle. Source current-state: `assets`; transaction/history: assignment, transfer, maintenance, depreciation, asset history.

### Consumable

Barang yang dilacak berdasarkan quantity. Contoh toner, ink, battery disposable, stationery. Source movement audit: `consumable_stock_transactions`; current stock cache: `consumable_stock_balances`.

## Ownership terminology

- **Company owner/context**: `company_id`.
- **Managing department**: department yang mengelola Asset/Consumable.
- **Current holder**: target assignment current Asset; dapat USER/DEPARTMENT/LOCATION/SHARED_POOL.
- **Current location**: lokasi fisik cache pada Asset atau per-location balance pada Consumable.
- Managing department tidak harus sama dengan department user pemakai.

## Source of truth

| Concept | Source of truth |
|---|---|
| User / department / company identity | PilarGroup `/auth/me` + internal directory |
| Serialized Asset current state | `assets` |
| Assignment/return history | `asset_assignments` |
| Transfer history | `asset_transfers` |
| Maintenance history | `asset_maintenances` |
| Asset business timeline | `asset_history` |
| Consumable current stock | `consumable_stock_balances` cache |
| Consumable movement audit | `consumable_stock_transactions` |
| Depreciation current config | latest active `asset_depreciation_configs` |
| Depreciation period history | `asset_depreciation_ledger` |
| Application audit | `activity_logs` |
| Permission | `permission_assignments` + `master_permissions` |

## History vs current state

Jangan mengubah current state untuk mensimulasikan transaksi.

Contoh salah:

```text
UPDATE assets SET current_assignment_id = ...
```

Contoh benar:

```text
POST assign
-> insert asset_assignments
-> update current state assets
-> insert asset_history
-> insert activity_logs
```

Prinsip yang sama berlaku untuk return, transfer, maintenance, lifecycle, dan stock movement.

## Integration boundary

- Asset tidak query DB PilarGroup secara langsung untuk directory.
- Future Ticket tidak boleh query DB Asset secara langsung.
- Internal integration menggunakan API dan shared internal secret.
- Tidak ada cross-database FK.

## Current MVP boundaries

Implemented: Asset, Consumable, master data, permission, numbering, maintenance, straight-line depreciation, import/export, activity log, Ticket integration primitives.

Belum otomatis menjadi requirement: QR/barcode, stock opname, approval, document/photo attachment, preventive schedule, notification, procurement integration, disposal approval.
