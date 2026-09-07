CREATE TABLE IF NOT EXISTS master_brands (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(80) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_master_brands_name (name), UNIQUE KEY uq_master_brands_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS master_models (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  brand_id BIGINT UNSIGNED NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(80) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_master_models_brand_name (brand_id, name),
  KEY idx_master_models_brand (brand_id),
  CONSTRAINT fk_master_models_brand FOREIGN KEY (brand_id) REFERENCES master_brands(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS master_uoms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_master_uoms_code (code), UNIQUE KEY uq_master_uoms_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS master_vendors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(80) NULL,
  name VARCHAR(180) NOT NULL,
  contact_name VARCHAR(150) NULL,
  phone VARCHAR(80) NULL,
  email VARCHAR(180) NULL,
  address TEXT NULL,
  notes TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_master_vendors_code (code), KEY idx_master_vendors_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS master_locations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id BIGINT UNSIGNED NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(180) NOT NULL,
  location_type VARCHAR(80) NULL,
  company_id VARCHAR(64) NULL COMMENT 'Central PilarGroup company id string; intentionally no FK',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_master_locations_code (code), KEY idx_master_locations_parent (parent_id), KEY idx_master_locations_company (company_id),
  CONSTRAINT fk_master_locations_parent FOREIGN KEY (parent_id) REFERENCES master_locations(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS master_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(180) NOT NULL,
  tracking_type ENUM('SERIALIZED_ASSET','CONSUMABLE') NOT NULL,
  is_depreciable TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_master_categories_code (code), KEY idx_master_categories_tracking (tracking_type, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS master_category_attributes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  attribute_code VARCHAR(80) NOT NULL,
  attribute_name VARCHAR(150) NOT NULL,
  data_type ENUM('TEXT','NUMBER','DATE','BOOLEAN','JSON') NOT NULL DEFAULT 'TEXT',
  is_required TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_category_attribute (category_id, attribute_code),
  CONSTRAINT fk_category_attributes_category FOREIGN KEY (category_id) REFERENCES master_categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS numbering_configs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  managing_department_id BIGINT UNSIGNED NOT NULL COMMENT 'Central PilarGroup department id; intentionally no FK',
  company_id VARCHAR(64) NULL COMMENT 'Central PilarGroup company id string; intentionally no FK',
  sequence_type ENUM('ASSET','CONSUMABLE') NOT NULL,
  name VARCHAR(150) NOT NULL,
  prefix VARCHAR(50) NULL,
  company_token VARCHAR(50) NULL,
  department_token VARCHAR(50) NULL,
  pattern VARCHAR(255) NOT NULL,
  sequence_length SMALLINT UNSIGNED NOT NULL DEFAULT 6,
  starting_sequence BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_sequence BIGINT UNSIGNED NOT NULL DEFAULT 0,
  reset_period ENUM('NEVER','YEARLY','MONTHLY') NOT NULL DEFAULT 'NEVER',
  last_reset_key VARCHAR(20) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_numbering_lookup (managing_department_id, company_id, sequence_type, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
