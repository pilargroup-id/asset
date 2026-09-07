# Asset Setup Runbook

## 1. PilarGroup

Create/activate application slug:

```text
asset
```

The old `assetit` app can be inactivated separately when operationally ready.

## 2. Environment

Start from `backend/.env.example`.

Critical values:

```env
APP_NAME=asset
APP_SLUG=asset
JWT_SECRET=
INTERNAL_SYNC_SECRET=
INTERNAL_API_SECRET=
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=asset
```

`INTERNAL_SYNC_SECRET` is used by Asset when accessing PilarGroup internal directory endpoints.

`INTERNAL_API_SECRET` protects Asset backend-to-backend endpoints intended for trusted internal systems such as the future Ticket backend. They are separate concerns and should not be exposed to browsers.

## 3. Install

```bash
cd backend
npm install
```

## 4. Database

```bash
npm run db:migrate
npm run db:seed
```

Migrations are fresh baseline migrations `001` through `006`.

## 5. Bootstrap administrators

Set one or more PilarGroup UUIDs from `/auth/me.id`:

```env
BOOTSTRAP_ADMIN_USER_IDS=<uuid-1>,<uuid-2>
```

Then:

```bash
npm run db:bootstrap
```

This creates USER-subject GLOBAL `permission_assignments` for all active permissions.

After bootstrap, clear the env value if desired. The DB assignments remain until revoked through permission management.

## 6. Import preview directory

The repository contains:

```text
backend/storage/import-previews/.gitkeep
```

The application creates temporary JSON preview/result records in that directory. Runtime files are ignored by Git and expire automatically.

## 7. Development auth

Development auto-login remains optional via the existing template behavior:

```env
DEV_AUTH_ENABLED=true
DEV_AUTH_USERNAME=
DEV_AUTH_PASSWORD=
```

The token is still obtained from PilarGroup.

## 8. Sanity checks

```bash
npm run check
```

Then run server and verify:

```text
GET /health
GET /api/auth/me
GET /api/permissions/effective
```

For internal integration, verify a request without/with correct `X-Internal-Secret` against `/api/internal/assets/assigned`.
