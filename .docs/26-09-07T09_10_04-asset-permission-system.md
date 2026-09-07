# Asset Permission System

## Principle

Authentication identifies the user through PilarGroup. Asset authorization decides **what action the user may perform and in what organizational scope**.

Do not hardcode department names such as `IT` or `HCGA` into authorization logic. There is no automatic `IT = full access` behavior.

## Scope types

```text
GLOBAL
COMPANY
DEPARTMENT
```

Examples:

```text
ASSET_UPDATE + DEPARTMENT + department_id=8
CONSUMABLE_REPORT + COMPANY + company_id=comp-pnm-0001
ACTIVITY_LOG_VIEW + GLOBAL
```

## PilarGroup identifier contract

```text
user_permissions.user_id       = CHAR(36)       # /auth/me.id UUID
user_permissions.company_id    = VARCHAR(64)    # e.g. comp-pnm-0001
user_permissions.department_id = BIGINT UNSIGNED
```

`/auth/me.internal_id` is not the canonical authorization user ID.

User/company/department are central PilarGroup references and intentionally are not duplicated as local identity master tables.

## Seeded permissions

```text
DASHBOARD_VIEW

ASSET_VIEW
ASSET_CREATE
ASSET_UPDATE
ASSET_ASSIGN
ASSET_TRANSFER
ASSET_MAINTENANCE
ASSET_RETIRE
ASSET_REPORT

CONSUMABLE_VIEW
CONSUMABLE_MANAGE
CONSUMABLE_RECEIVE
CONSUMABLE_ISSUE
CONSUMABLE_TRANSFER
CONSUMABLE_ADJUST
CONSUMABLE_WRITE_OFF
CONSUMABLE_REPORT

DEPRECIATION_VIEW
DEPRECIATION_MANAGE

MASTER_VIEW
MASTER_MANAGE
NUMBERING_MANAGE
PERMISSION_MANAGE
IMPORT_DATA
EXPORT_DATA
ACTIVITY_LOG_VIEW
ACTIVITY_LOG_EXPORT
DIRECTORY_VIEW
```

## Enforcement flow

```text
authenticate
→ requireApp(asset)
→ requirePermission(action)
→ controller
→ service scope validation
→ model/database
```

Middleware verifies that the user has the required permission code. The service then validates `GLOBAL`, `COMPANY`, or `DEPARTMENT` scope against the actual company/managing department being accessed.

List/report queries build scope-aware SQL. Import validates scope per row in the backend. Export applies the user's authorized scope to the generated dataset.

## Permission management

`PERMISSION_MANAGE` controls permission administration.

A non-global permission administrator cannot create/revoke grants outside the scope they themselves are allowed to manage. A `GLOBAL` grant requires the actor to hold `PERMISSION_MANAGE` with `GLOBAL` scope.

## Bootstrap administrators

Initial global administrators are explicitly configured with PilarGroup user UUIDs:

```env
BOOTSTRAP_ADMIN_USER_IDS=550e8400-e29b-41d4-a716-446655440000,another-user-uuid
```

Then:

```bash
npm run db:bootstrap
```

The bootstrap script creates normal `GLOBAL` permission rows in `user_permissions`. Removing the environment value afterward does not revoke them.

After initial setup, permission management should use the normal authorization flow rather than repeated bootstrap as an operational workflow.

## Historical context

Business history/activity logs may store user, department, and company name snapshots alongside central IDs. This preserves readable historical context if the central directory changes later.
