CREATE TABLE IF NOT EXISTS master_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_master_permissions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL COMMENT 'Central PilarGroup user UUID from auth/me.id; intentionally no FK',
  permission_id BIGINT UNSIGNED NOT NULL,
  scope_type ENUM('GLOBAL','COMPANY','DEPARTMENT') NOT NULL,
  company_id VARCHAR(64) NULL COMMENT 'Required when scope_type=COMPANY; optional context for DEPARTMENT',
  department_id BIGINT UNSIGNED NULL COMMENT 'Required when scope_type=DEPARTMENT',
  granted_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_permissions_user (user_id), KEY idx_user_permissions_scope (scope_type, company_id, department_id),
  CONSTRAINT fk_user_permissions_permission FOREIGN KEY (permission_id) REFERENCES master_permissions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
