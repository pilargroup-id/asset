# Asset Permission System

## Principle

Authorization is not hardcoded by department name. IT, HCGA, Legal, or future departments use the same engine.

## Subject vs access scope

`subject_type` answers **who receives the permission**:

- `USER`
- `COMPANY`
- `DEPARTMENT`

`access_scope_type` answers **how broad the data access is**:

- `GLOBAL`
- `COMPANY`
- `DEPARTMENT`

The two concepts must not be mixed.

## Effective permission resolution

For the authenticated `/auth/me`, backend matches assignments against:

- `USER` -> `user.id`
- `DEPARTMENT` -> all IDs in `user.departments[]` plus current department context IDs
- `COMPANY` -> all IDs in `user.companies[]` plus current company context ID

Matching grants are additive / UNION.

Example:

```text
USER Azi       -> ASSET_VIEW -> DEPARTMENT 8
DEPARTMENT IT  -> ASSET_VIEW -> COMPANY comp-pnm-0001
COMPANY PNM    -> ASSET_VIEW -> GLOBAL
```

Effective result is GLOBAL because at least one matching grant is GLOBAL.

There is no DENY and no subject priority such as USER > DEPARTMENT > COMPANY. A narrower assignment never removes access granted by another matching assignment.

## Redundancy

Cross-subject redundancy is valid and harmless. Exact duplicates are blocked by DB uniqueness:

```text
permission_id
+ subject_type
+ subject_id
+ access_scope_type
+ access_scope_id
```

## API

```http
GET    /api/permissions/effective
GET    /api/permissions
GET    /api/permissions/assignments
POST   /api/permissions/assignments
DELETE /api/permissions/assignments/:id
```

Create example:

```json
{
  "permission_code": "ASSET_VIEW",
  "subject_type": "DEPARTMENT",
  "subject_id": "8",
  "access_scope_type": "GLOBAL",
  "access_scope_id": ""
}
```

Department-scoped example:

```json
{
  "permission_code": "ASSET_UPDATE",
  "subject_type": "DEPARTMENT",
  "subject_id": "8",
  "access_scope_type": "DEPARTMENT",
  "access_scope_id": "8"
}
```

## Bootstrap

Initial administrators are explicit USER subjects with GLOBAL access for all active permissions.

```env
BOOTSTRAP_ADMIN_USER_IDS=<uuid-1>,<uuid-2>
```

Run:

```bash
npm run db:bootstrap
```

Bootstrap assignments are persistent DB records. Clearing the environment variable afterward does not revoke them.

There is no special rule making IT automatically full access.
