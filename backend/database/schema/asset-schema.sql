-- Asset consolidated schema
-- Generated from migrations 001-006. Run migrations in order for deployment.

-- ============================================================================
-- 001_master_configuration.sql
-- ============================================================================
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

-- ============================================================================
-- 002_permissions.sql
-- ============================================================================
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

-- ============================================================================
-- 003_serialized_assets.sql
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_number VARCHAR(150) NOT NULL,
  asset_name VARCHAR(200) NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  brand_id BIGINT UNSIGNED NULL,
  model_id BIGINT UNSIGNED NULL,
  serial_number VARCHAR(180) NULL,
  managing_department_id BIGINT UNSIGNED NOT NULL COMMENT 'Central PilarGroup department id',
  company_id VARCHAR(64) NOT NULL COMMENT 'Central PilarGroup company id string',
  current_location_id BIGINT UNSIGNED NULL,
  status ENUM('REGISTERED','AVAILABLE','ASSIGNED','MAINTENANCE','LOST','RETIRED','DISPOSED','VOID') NOT NULL DEFAULT 'REGISTERED',
  asset_condition ENUM('NEW','GOOD','FAIR','POOR','DAMAGED') NOT NULL DEFAULT 'GOOD',
  purchase_date DATE NULL,
  purchase_cost DECIMAL(18,2) NULL,
  vendor_id BIGINT UNSIGNED NULL,
  warranty_until DATE NULL,
  current_assignment_id BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_assets_asset_number (asset_number), KEY idx_assets_scope (managing_department_id, company_id), KEY idx_assets_status (status), KEY idx_assets_category (category_id), KEY idx_assets_location (current_location_id), KEY idx_assets_serial (serial_number),
  CONSTRAINT fk_assets_category FOREIGN KEY (category_id) REFERENCES master_categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_assets_brand FOREIGN KEY (brand_id) REFERENCES master_brands(id) ON DELETE SET NULL,
  CONSTRAINT fk_assets_model FOREIGN KEY (model_id) REFERENCES master_models(id) ON DELETE SET NULL,
  CONSTRAINT fk_assets_location FOREIGN KEY (current_location_id) REFERENCES master_locations(id) ON DELETE SET NULL,
  CONSTRAINT fk_assets_vendor FOREIGN KEY (vendor_id) REFERENCES master_vendors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_attribute_values (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  attribute_id BIGINT UNSIGNED NOT NULL,
  value_text TEXT NULL,
  value_number DECIMAL(24,6) NULL,
  value_date DATE NULL,
  value_boolean TINYINT(1) NULL,
  value_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_asset_attribute_value (asset_id, attribute_id),
  CONSTRAINT fk_asset_attribute_values_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  CONSTRAINT fk_asset_attribute_values_attribute FOREIGN KEY (attribute_id) REFERENCES master_category_attributes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  assignment_type ENUM('USER','DEPARTMENT','LOCATION','SHARED_POOL') NOT NULL,
  assigned_user_id CHAR(36) NULL,
  assigned_user_name_snapshot VARCHAR(180) NULL,
  assigned_department_id BIGINT UNSIGNED NULL,
  assigned_department_name_snapshot VARCHAR(180) NULL,
  assigned_location_id BIGINT UNSIGNED NULL,
  assigned_location_name_snapshot VARCHAR(180) NULL,
  purpose VARCHAR(255) NULL,
  assigned_at DATETIME NOT NULL,
  assigned_by CHAR(36) NOT NULL,
  returned_at DATETIME NULL,
  returned_by CHAR(36) NULL,
  return_condition ENUM('NEW','GOOD','FAIR','POOR','DAMAGED') NULL,
  return_location_id BIGINT UNSIGNED NULL,
  return_note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_asset_assignments_asset (asset_id, assigned_at), KEY idx_asset_assignments_user (assigned_user_id),
  CONSTRAINT fk_asset_assignments_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,
  CONSTRAINT fk_asset_assignments_location FOREIGN KEY (assigned_location_id) REFERENCES master_locations(id) ON DELETE SET NULL,
  CONSTRAINT fk_asset_assignments_return_location FOREIGN KEY (return_location_id) REFERENCES master_locations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS asset_transfers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  transfer_date DATETIME NOT NULL,
  from_location_id BIGINT UNSIGNED NULL,
  to_location_id BIGINT UNSIGNED NULL,
  from_company_id VARCHAR(64) NULL,
  to_company_id VARCHAR(64) NULL,
  from_managing_department_id BIGINT UNSIGNED NULL,
  to_managing_department_id BIGINT UNSIGNED NULL,
  reason VARCHAR(255) NULL,
  notes TEXT NULL,
  transferred_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_asset_transfers_asset (asset_id, transfer_date),
  CONSTRAINT fk_asset_transfers_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,
  CONSTRAINT fk_asset_transfers_from_location FOREIGN KEY (from_location_id) REFERENCES master_locations(id) ON DELETE SET NULL,
  CONSTRAINT fk_asset_transfers_to_location FOREIGN KEY (to_location_id) REFERENCES master_locations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_maintenances (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  maintenance_type VARCHAR(100) NOT NULL,
  vendor_id BIGINT UNSIGNED NULL,
  start_date DATETIME NOT NULL,
  completion_date DATETIME NULL,
  cost DECIMAL(18,2) NULL,
  problem_description TEXT NULL,
  result TEXT NULL,
  status ENUM('OPEN','IN_PROGRESS','COMPLETED','CANCELED') NOT NULL DEFAULT 'OPEN',
  notes TEXT NULL,
  created_by CHAR(36) NOT NULL,
  completed_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_asset_maintenances_asset (asset_id, status),
  CONSTRAINT fk_asset_maintenances_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,
  CONSTRAINT fk_asset_maintenances_vendor FOREIGN KEY (vendor_id) REFERENCES master_vendors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  event_date DATETIME NOT NULL,
  reference_type VARCHAR(80) NULL,
  reference_id BIGINT UNSIGNED NULL,
  description VARCHAR(500) NULL,
  details JSON NULL,
  performed_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_asset_history_asset (asset_id, event_date),
  CONSTRAINT fk_asset_history_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_external_references (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  source_system VARCHAR(80) NOT NULL COMMENT 'External system slug, e.g. ticket',
  reference_type VARCHAR(80) NOT NULL COMMENT 'External reference type, e.g. TICKET',
  reference_id VARCHAR(128) NOT NULL COMMENT 'Opaque id owned by the external system',
  reference_number VARCHAR(150) NULL COMMENT 'Human-readable external number snapshot',
  linked_by_user_id CHAR(36) NULL COMMENT 'Optional PilarGroup user UUID responsible for the link',
  linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_asset_external_reference (asset_id, source_system, reference_type, reference_id),
  KEY idx_asset_external_reference_asset (asset_id, linked_at),
  KEY idx_asset_external_reference_source (source_system, reference_type, reference_id),
  CONSTRAINT fk_asset_external_reference_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 004_consumables.sql
-- ============================================================================
CREATE TABLE IF NOT EXISTS consumables (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  consumable_code VARCHAR(150) NOT NULL,
  name VARCHAR(200) NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  brand_id BIGINT UNSIGNED NULL,
  variant VARCHAR(180) NULL,
  uom_id BIGINT UNSIGNED NOT NULL,
  managing_department_id BIGINT UNSIGNED NOT NULL,
  company_id VARCHAR(64) NOT NULL,
  minimum_stock DECIMAL(18,4) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_consumables_code (consumable_code), KEY idx_consumables_scope (managing_department_id, company_id), KEY idx_consumables_category (category_id),
  CONSTRAINT fk_consumables_category FOREIGN KEY (category_id) REFERENCES master_categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_consumables_brand FOREIGN KEY (brand_id) REFERENCES master_brands(id) ON DELETE SET NULL,
  CONSTRAINT fk_consumables_uom FOREIGN KEY (uom_id) REFERENCES master_uoms(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consumable_stock_balances (
  consumable_id BIGINT UNSIGNED NOT NULL,
  location_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(18,4) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (consumable_id, location_id),
  CONSTRAINT fk_consumable_balances_consumable FOREIGN KEY (consumable_id) REFERENCES consumables(id) ON DELETE RESTRICT,
  CONSTRAINT fk_consumable_balances_location FOREIGN KEY (location_id) REFERENCES master_locations(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consumable_stock_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  transaction_number VARCHAR(150) NOT NULL,
  consumable_id BIGINT UNSIGNED NOT NULL,
  movement_type ENUM('OPENING_BALANCE','RECEIVE','ISSUE','TRANSFER','ADJUSTMENT','WRITE_OFF','RETURN') NOT NULL,
  from_location_id BIGINT UNSIGNED NULL,
  to_location_id BIGINT UNSIGNED NULL,
  quantity DECIMAL(18,4) NOT NULL,
  unit_cost DECIMAL(18,4) NULL,
  recipient_type ENUM('USER','DEPARTMENT','ASSET','LOCATION','GENERAL_USAGE') NULL,
  recipient_user_id CHAR(36) NULL,
  recipient_user_name_snapshot VARCHAR(180) NULL,
  recipient_department_id BIGINT UNSIGNED NULL,
  recipient_department_name_snapshot VARCHAR(180) NULL,
  recipient_asset_id BIGINT UNSIGNED NULL,
  recipient_location_id BIGINT UNSIGNED NULL,
  purpose VARCHAR(255) NULL,
  reference_number VARCHAR(150) NULL,
  notes TEXT NULL,
  transaction_date DATETIME NOT NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_consumable_tx_number (transaction_number), KEY idx_consumable_tx_consumable (consumable_id, transaction_date), KEY idx_consumable_tx_type (movement_type), KEY idx_consumable_tx_recipient_user (recipient_user_id),
  CONSTRAINT fk_consumable_tx_consumable FOREIGN KEY (consumable_id) REFERENCES consumables(id) ON DELETE RESTRICT,
  CONSTRAINT fk_consumable_tx_from_location FOREIGN KEY (from_location_id) REFERENCES master_locations(id) ON DELETE SET NULL,
  CONSTRAINT fk_consumable_tx_to_location FOREIGN KEY (to_location_id) REFERENCES master_locations(id) ON DELETE SET NULL,
  CONSTRAINT fk_consumable_tx_recipient_asset FOREIGN KEY (recipient_asset_id) REFERENCES assets(id) ON DELETE SET NULL,
  CONSTRAINT fk_consumable_tx_recipient_location FOREIGN KEY (recipient_location_id) REFERENCES master_locations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 005_depreciation.sql
-- ============================================================================
CREATE TABLE IF NOT EXISTS depreciation_policies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  managing_department_id BIGINT UNSIGNED NOT NULL,
  company_id VARCHAR(64) NULL,
  name VARCHAR(180) NOT NULL,
  method ENUM('STRAIGHT_LINE','DECLINING_BALANCE','MANUAL') NOT NULL DEFAULT 'STRAIGHT_LINE',
  useful_life_months INT UNSIGNED NOT NULL,
  salvage_value_type ENUM('FIXED','PERCENT') NOT NULL DEFAULT 'FIXED',
  salvage_value DECIMAL(18,4) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_depreciation_policies_scope (managing_department_id, company_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS category_depreciation_defaults (
  category_id BIGINT UNSIGNED NOT NULL,
  managing_department_id BIGINT UNSIGNED NOT NULL,
  company_id VARCHAR(64) NULL,
  depreciation_policy_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (category_id, managing_department_id, depreciation_policy_id),
  KEY idx_category_dep_default_lookup (category_id, managing_department_id, company_id),
  CONSTRAINT fk_category_dep_default_category FOREIGN KEY (category_id) REFERENCES master_categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_category_dep_default_policy FOREIGN KEY (depreciation_policy_id) REFERENCES depreciation_policies(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_depreciation_configs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  depreciation_policy_id BIGINT UNSIGNED NULL,
  purchase_cost_snapshot DECIMAL(18,2) NOT NULL,
  depreciation_method ENUM('STRAIGHT_LINE','DECLINING_BALANCE','MANUAL') NOT NULL,
  useful_life_months INT UNSIGNED NOT NULL,
  salvage_value_type ENUM('FIXED','PERCENT') NOT NULL DEFAULT 'FIXED',
  salvage_value DECIMAL(18,4) NOT NULL DEFAULT 0,
  depreciation_start_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_asset_dep_config_active (asset_id, is_active),
  CONSTRAINT fk_asset_dep_config_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,
  CONSTRAINT fk_asset_dep_config_policy FOREIGN KEY (depreciation_policy_id) REFERENCES depreciation_policies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_depreciation_revisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  effective_date DATE NOT NULL,
  old_values JSON NOT NULL,
  new_values JSON NOT NULL,
  reason VARCHAR(500) NOT NULL,
  changed_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY idx_asset_dep_revisions_asset (asset_id, effective_date),
  CONSTRAINT fk_asset_dep_revisions_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_depreciation_ledger (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id BIGINT UNSIGNED NOT NULL,
  period_year SMALLINT UNSIGNED NOT NULL,
  period_month TINYINT UNSIGNED NOT NULL,
  opening_book_value DECIMAL(18,2) NOT NULL,
  depreciation_amount DECIMAL(18,2) NOT NULL,
  accumulated_depreciation DECIMAL(18,2) NOT NULL,
  closing_book_value DECIMAL(18,2) NOT NULL,
  calculation_method ENUM('STRAIGHT_LINE','DECLINING_BALANCE','MANUAL') NOT NULL,
  is_final TINYINT(1) NOT NULL DEFAULT 0,
  generated_by CHAR(36) NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY uq_asset_dep_period (asset_id, period_year, period_month), KEY idx_dep_ledger_period (period_year, period_month),
  CONSTRAINT fk_asset_dep_ledger_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 006_data_management_audit.sql
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(36) NULL,
  username_snapshot VARCHAR(180) NULL,
  user_name_snapshot VARCHAR(180) NULL,
  department_id_snapshot BIGINT UNSIGNED NULL,
  department_name_snapshot VARCHAR(180) NULL,
  company_id_snapshot VARCHAR(64) NULL,
  company_name_snapshot VARCHAR(180) NULL,
  module VARCHAR(80) NOT NULL,
  action VARCHAR(100) NOT NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'APPLICATION',
  correlation_id CHAR(36) NULL,
  entity_type VARCHAR(80) NULL,
  entity_id BIGINT UNSIGNED NULL,
  entity_reference VARCHAR(180) NULL,
  entity_name_snapshot VARCHAR(255) NULL,
  description VARCHAR(500) NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(80) NULL,
  user_agent VARCHAR(500) NULL,
  request_method VARCHAR(20) NULL,
  request_path VARCHAR(500) NULL,
  status ENUM('SUCCESS','FAILED') NOT NULL DEFAULT 'SUCCESS',
  error_message VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_logs_user (user_id, created_at),
  KEY idx_activity_logs_entity (entity_type, entity_id, created_at),
  KEY idx_activity_logs_module_action (module, action, created_at),
  KEY idx_activity_logs_correlation (correlation_id, created_at),
  KEY idx_activity_logs_source (source, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

