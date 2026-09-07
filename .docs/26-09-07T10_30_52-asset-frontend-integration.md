# Asset Frontend Integration Guide

## Authentication

Frontend uses the normal PilarGroup JWT flow. Do not expose `INTERNAL_API_SECRET` to the Asset frontend; that secret is backend-to-backend only.

## Permission-aware UI

Use:

```http
GET /api/permissions/effective
```

to understand the current user's effective local permissions. Effective grants are already merged across USER, DEPARTMENT and COMPANY subjects.

Do not implement frontend logic such as:

```text
if department == IT then full access
```

Backend remains authoritative for authorization.

## Permission management UI

Create assignment fields:

```text
permission_code
subject_type        USER | COMPANY | DEPARTMENT
subject_id
access_scope_type   GLOBAL | COMPANY | DEPARTMENT
access_scope_id
```

For GLOBAL scope, send empty/null `access_scope_id`; backend normalizes it to empty string.

List assignments:

```http
GET /api/permissions/assignments
```

Useful filters include subject type/id, permission code and access scope.

## Import UX

Recommended flow:

```text
Download backend template
-> upload
-> Preview
-> show row status/errors/warnings
-> Commit
-> if error_file_token exists, download errors
```

Frontend does not upload the original file again on commit.

## Export UX

Call `/api/export/:type` with blob response. The backend streams XLSX directly; there is no export-history screen/table unless a future requirement is added. Audit is visible through Activity Log.

## Asset detail

`GET /api/assets/:id/history` includes:

- asset
- business history
- assignments
- transfers
- maintenances
- external references

This lets Asset UI display that an external Ticket/reference has been linked without owning Ticket business data.
