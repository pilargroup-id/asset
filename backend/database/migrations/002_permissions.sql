CREATE TABLE IF NOT EXISTS master_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_master_permissions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permission_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  permission_id BIGINT UNSIGNED NOT NULL,
  subject_type ENUM('USER','COMPANY','DEPARTMENT') NOT NULL COMMENT 'Who receives the permission',
  subject_id VARCHAR(64) NOT NULL COMMENT 'USER=auth/me.id UUID, COMPANY=company id, DEPARTMENT=department id as string',
  access_scope_type ENUM('GLOBAL','COMPANY','DEPARTMENT') NOT NULL COMMENT 'How broad the granted data access is',
  access_scope_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'Empty for GLOBAL; company id for COMPANY; department id for DEPARTMENT',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permission_assignment (permission_id, subject_type, subject_id, access_scope_type, access_scope_id),
  KEY idx_permission_assignments_subject (subject_type, subject_id, is_active),
  KEY idx_permission_assignments_scope (access_scope_type, access_scope_id, is_active),
  KEY idx_permission_assignments_permission (permission_id, is_active),
  CONSTRAINT fk_permission_assignments_permission FOREIGN KEY (permission_id) REFERENCES master_permissions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
