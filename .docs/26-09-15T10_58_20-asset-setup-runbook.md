# Asset Setup Runbook

## PilarGroup

Tambahkan app slug `asset` ke central app access. Old `assetit` dapat diinactivate setelah cutover.

## Environment

Start dari `backend/.env.example`.

Required/important:

```env
APP_NAME=asset
APP_SLUG=asset
JWT_SECRET=
INTERNAL_SYNC_SECRET=
INTERNAL_API_SECRET=
PILARGROUP_URL=https://pilargroup.id
PILARGROUP_DIRECTORY_BASE_PATH=/api/internal/directory
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=asset
```

Import:

```env
IMPORT_MAX_FILE_MB=20
IMPORT_PREVIEW_TTL_MINUTES=60
```

Stock:

```env
ALLOW_NEGATIVE_CONSUMABLE_STOCK=false
```

## Install

```bash
cd backend
npm install
```

## DB

```bash
npm run db:migrate
npm run db:seed
```

Fresh migrations: 001..006.

## Bootstrap initial admin

Ambil canonical UUID dari `/auth/me.id`:

```env
BOOTSTRAP_ADMIN_USER_IDS=<uuid1>,<uuid2>
```

```bash
npm run db:bootstrap
```

Bootstrap membuat USER subject + GLOBAL scope untuk semua active permissions. Record persistent.

## Temp preview folder

Repository harus mempunyai:

```text
backend/storage/import-previews/.gitkeep
```

Jangan commit runtime `.json`.

## Development auth

Optional:

```env
DEV_AUTH_ENABLED=true
DEV_AUTH_USERNAME=
DEV_AUTH_PASSWORD=
```

Token tetap diambil dari PilarGroup.

## Checks

```bash
npm run check
npm run start
```

Sanity:

```text
GET /health
GET /api/auth/me
GET /api/permissions/effective
GET /api/dashboard
```

Internal API test harus memastikan request tanpa/secret salah ditolak sebelum endpoint Ticket digunakan.
