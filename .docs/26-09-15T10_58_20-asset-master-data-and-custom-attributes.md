# Asset Master Data and Custom Attributes

## Master endpoints

Base:

```http
GET  /api/master/:type
GET  /api/master/:type/:id
POST /api/master/:type
PUT  /api/master/:type/:id
```

Supported `:type`:

- `categories`
- `category_attributes`
- `locations`
- `vendors`
- `brands`
- `models`
- `uoms`

Read membutuhkan `MASTER_VIEW`. Create/update membutuhkan `MASTER_MANAGE` **dengan GLOBAL access scope** menurut service sekarang.

## Category

Create minimum:

```json
{
  "code": "LAPTOP",
  "name": "Laptop",
  "tracking_type": "SERIALIZED_ASSET"
}
```

Optional:

```json
{ "is_depreciable": 1, "is_active": 1 }
```

`tracking_type` menentukan apakah category dapat dipilih di Asset atau Consumable.

## Category Attributes

Create minimum:

```json
{
  "category_id": 1,
  "attribute_code": "RAM",
  "attribute_name": "RAM",
  "data_type": "NUMBER"
}
```

Optional `is_required`, `sort_order`, `is_active`.

Asset FE flow recommended:

```text
user pilih category
-> GET /api/master/category_attributes?category_id=<id>&is_active=1
-> render field sesuai data_type
-> submit [{attribute_id, value}]
```

Backend memvalidasi attribute berasal dari category Asset dan active.

## Location

Create minimum:

```json
{ "code": "DG", "name": "Duta Garden" }
```

Optional:

```json
{
  "parent_id": null,
  "location_type": "SITE",
  "company_id": "comp-pnm-0001",
  "is_active": 1
}
```

### Apa fungsi `location_type`?

Saat ini **metadata/free text**. Tidak ada enum atau behavior yang berubah berdasarkan value. Ia disiapkan agar UI/report dapat membedakan node hierarchy, contoh `SITE`, `BUILDING`, `FLOOR`, `ROOM`, `WAREHOUSE`.

Karena backend tidak memvalidasi value, FE jangan menganggap daftar contoh tersebut sebagai enum resmi kecuali product memutuskan standard.

### Apa fungsi `parent_id`?

Membuat hierarchy lokasi. Contoh:

```text
Duta Garden (SITE)
└─ Main Office (BUILDING)
   └─ Floor 2 (FLOOR)
      └─ IT Room (ROOM)
```

Jika organisasi cukup membutuhkan flat locations, `parent_id` dan `location_type` dapat dibiarkan NULL.

## Brand / Model

Brand:

```json
{ "name": "Lenovo", "code": "LENOVO", "is_active": 1 }
```

Model:

```json
{ "brand_id": 1, "name": "ThinkPad E14", "code": "E14", "is_active": 1 }
```

Model `brand_id` optional di schema, namun import Asset mencari `model_name` dengan current/selected brand bila tersedia.

## UOM

Consumable wajib memiliki UOM.

```json
{ "code": "PCS", "name": "Pieces", "is_active": 1 }
```

## Vendor

Digunakan pada purchase information Asset dan maintenance provider.

Create minimal:

```json
{ "name": "PT Vendor Example" }
```

Optional `code`, `contact_name`, `phone`, `email`, `address`, `notes`, `is_active`.

## Master list filters implemented

`GET /api/master/:type` menerima generic query keys berikut bila kolom ada pada table:

- `is_active`
- `tracking_type`
- `company_id`
- `category_id`
- `brand_id`
- `parent_id`

Tidak ada pagination master saat ini.

## Deactivation

Tidak ada DELETE endpoint master. Gunakan `PUT` dengan `is_active=0` jika type mendukung field itu. Ini menjaga historical reference.
