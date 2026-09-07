# Asset Backend Architecture

## Project identity

- Project name / app slug: `asset`
- Backend: Express.js
- Central authentication source: `pilargroup.id`
- Central user identity: `/auth/me.id` UUID
- Department identity: integer ID from PilarGroup
- Company identity: opaque string such as `comp-pnm-0001`
- Local database owns Asset business data and local authorization only.

## Root structure

```text
asset/
├── .docs/
├── .git/
├── backend/
└── frontend/
```

Backend follows the existing template layering:

```text
routes -> middleware -> controllers -> services -> models -> MariaDB
```

Cross-cutting layers:

- PilarGroup JWT authentication and `/auth/me`
- local permission assignment resolution
- PilarGroup directory client
- numbering engine
- activity log
- import preview temporary storage
- internal integration API

## Authentication

Normal application routes use:

```text
JWT
-> authenticate
-> fetch/resolve current /auth/me
-> requireApp('asset')
-> local permission check
```

There is no child-app login/logout audit. Authentication audit belongs to PilarGroup.

## Authorization

Authorization uses `permission_assignments`, not hardcoded IT/HCGA logic.

A permission assignment has two independent dimensions:

```text
subject_type      = USER | COMPANY | DEPARTMENT
subject_id        = who receives the permission

access_scope_type = GLOBAL | COMPANY | DEPARTMENT
access_scope_id   = what data scope is granted
```

All assignments matching the current `/auth/me` are merged additively. There is no DENY rule and no hidden priority rule. If any matching grant is GLOBAL for a permission, effective access for that permission is global.

## Asset integration boundary

Asset is integration-ready for the future multi-department Ticket system.

The Ticket backend must not query the Asset DB directly. It uses Asset internal APIs protected by `X-Internal-Secret`.

Current integration primitives:

- lookup current assets assigned to a PilarGroup user;
- optional filter by managing department and company;
- link an external record such as a Ticket to an Asset;
- show external references in Asset history/detail context.

Asset remains source of truth for physical assets. Ticket remains source of truth for tickets.

## Import / export storage

Uploaded spreadsheets are parsed in memory and are not stored.

Import preview state is temporary JSON only:

```text
backend/storage/import-previews/<token>.json
```

The directory contains `.gitkeep`; runtime JSON files are ignored by Git. Preview/result state expires by TTL and is removed after commit/cancel/expiry.

Export/template/error XLSX files are generated in memory and streamed to the client. They are not stored and there is no `export_history` table.

## Audit

Permanent audit is stored in `activity_logs`.

Important examples:

- import summary;
- per-entity CREATE/UPDATE caused by an import, sharing one correlation ID;
- export metadata and row count;
- permission assignment grant/revoke;
- external Ticket/reference link;
- asset/consumable/depreciation operations.

Business history such as assignment, return, transfer and maintenance remains separate from Activity Log.
