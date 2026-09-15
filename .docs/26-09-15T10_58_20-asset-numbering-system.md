# Asset Numbering System

## Goal

Nomor Asset/Consumable configurable per managing department dan optional company. Tidak ada hardcode `IT-...`/`GA-...` dalam source.

## Create config

```http
POST /api/numbering
```

Required:

- `managing_department_id`
- `sequence_type`: `ASSET` / `CONSUMABLE`
- `name`
- `pattern`

Optional:

- `company_id`
- `prefix`
- `company_token`
- `department_token`
- `sequence_length` default 6, valid 1..20
- `starting_sequence` default 1
- `reset_period` default `NEVER`
- `is_active` default true

Example:

```json
{
  "managing_department_id": 8,
  "company_id": "comp-pnm-0001",
  "sequence_type": "ASSET",
  "name": "IT Asset PNM",
  "prefix": "IT-AST",
  "pattern": "{PREFIX}-{YY}-{SEQ:5}",
  "starting_sequence": 1,
  "reset_period": "YEARLY"
}
```

Output example: `IT-AST-26-00001`.

## Supported tokens

- `{PREFIX}` -> `prefix`
- `{COMPANY}` -> `company_token`
- `{DEPARTMENT}` -> `department_token`
- `{YYYY}`
- `{YY}`
- `{MM}`
- `{SEQ}` -> pad using `sequence_length`
- `{SEQ:n}` -> pad n digits

`COMPANY`/`DEPARTMENT` token **tidak otomatis resolve central directory**. Admin harus mengisi token text pada config.

## Selection priority

Generator lookup:

```text
managing_department_id exact
+ sequence_type exact
+ is_active=1
+ (company_id exact OR company_id NULL)
order exact company before NULL
```

Artinya config company-specific override department fallback.

## Sequence state

`current_sequence` di-maintain backend dalam transaction/row lock saat generation.

Create config menginisialisasi:

```text
current_sequence = starting_sequence - 1
```

Sehingga nomor pertama = starting_sequence.

## Reset

- NEVER -> terus naik.
- YEARLY -> bila `last_reset_key` != current year, next kembali starting_sequence.
- MONTHLY -> bila key YYYY-MM berubah, next kembali starting_sequence.

## Update restrictions

PUT dapat mengubah:

- name
- prefix
- company_token
- department_token
- pattern
- sequence_length
- starting_sequence
- reset_period
- is_active

Current implementation **tidak mengubah** managing_department_id, company_id, sequence_type, current_sequence via normal update model.

## Existing numbers

Mengubah config tidak mengubah `assets.asset_number`/`consumables.consumable_code` yang sudah terbit.
