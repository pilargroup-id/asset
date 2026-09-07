# Asset Backend Setup Runbook

## Project structure

```text
asset/
├── .docs/
├── .git/
├── backend/
└── frontend/
```

Import preview state directory:

```text
backend/storage/import-previews/.gitkeep
```

Runtime JSON is temporary and ignored by Git.

## PilarGroup application

```env
APP_NAME=asset
APP_SLUG=asset
```

The new `asset` app must be assigned in PilarGroup. Legacy `assetit` can be inactivated separately.

## Environment

From `backend/`:

```bash
cp .env.example .env.local
```

Configure:

```text
JWT_SECRET
INTERNAL_SYNC_SECRET
PILARGROUP_URL
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

Import defaults:

```env
IMPORT_MAX_FILE_MB=20
IMPORT_PREVIEW_TTL_MINUTES=60
```

No import/export filesystem path environment variables are required.

## Install

```bash
npm install
```

## Database

Fresh database:

```bash
npm run db:setup
```

This runs migrations and permission seeds.

Final migrations:

```text
001_master_configuration.sql
002_permissions.sql
003_serialized_assets.sql
004_consumables.sql
005_depreciation.sql
006_data_management_audit.sql
```

There are no `import_batches` / `import_batch_rows` tables.

## Bootstrap initial administrators

Use PilarGroup UUID(s) from `/auth/me.id`:

```env
BOOTSTRAP_ADMIN_USER_IDS=uuid-1,uuid-2
```

Run once:

```bash
npm run db:bootstrap
```

The grants are persisted in `user_permissions`; removing the env value afterward does not revoke them.

Do not use `/auth/me.internal_id` here.

## Development

```bash
npm run dev
```

Optional central auto-login:

```env
DEV_AUTH_ENABLED=true
DEV_AUTH_USERNAME=
DEV_AUTH_PASSWORD=
```

The dev flow still obtains a real PilarGroup token.

## Syntax QA

From `backend/`:

```bash
npm run check
```

## Import temporary storage behavior

`backend/storage/import-previews/` contains only expiring JSON created after the uploaded workbook has already been parsed from memory.

```text
preview commit  → preview JSON removed
preview cancel  → preview JSON removed
preview expired → cleanup removes JSON
error result    → JSON removed after TTL
```

Uploaded workbooks, exports, templates, and error XLSX binaries are never saved there.

## Production notes

- Keep `.env` out of Git.
- Ensure the application process has write/delete permission to `backend/storage/import-previews/`.
- The directory is ephemeral application state; do not treat it as backup data.
- Business history remains in MariaDB Activity Log / transaction tables.
