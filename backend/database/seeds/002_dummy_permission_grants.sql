-- Dummy grant: gives user "azi" (Azi Fauzi, IT/SIT dept) the PERMISSION_MANAGE permission
-- so the Permission List page (GET /api/permissions) stops returning
-- "Permission PERMISSION_MANAGE is required".
INSERT INTO permission_assignments
  (permission_id, subject_type, subject_id, access_scope_type, access_scope_id, is_active, created_by, updated_by)
SELECT id, 'USER', 'bd625aff-7fc4-44e9-b95c-549f99f47991', 'GLOBAL', '', 1, NULL, NULL
FROM master_permissions
WHERE code = 'PERMISSION_MANAGE'
ON DUPLICATE KEY UPDATE is_active = 1, updated_at = CURRENT_TIMESTAMP;

-- Dummy grant: gives user "azi" the DIRECTORY_VIEW permission so the Subject ID
-- search dropdown (GET /api/directory/users|departments|companies) stops returning
-- "Permission DIRECTORY_VIEW is required".
INSERT INTO permission_assignments
  (permission_id, subject_type, subject_id, access_scope_type, access_scope_id, is_active, created_by, updated_by)
SELECT id, 'USER', 'bd625aff-7fc4-44e9-b95c-549f99f47991', 'GLOBAL', '', 1, NULL, NULL
FROM master_permissions
WHERE code = 'DIRECTORY_VIEW'
ON DUPLICATE KEY UPDATE is_active = 1, updated_at = CURRENT_TIMESTAMP;
