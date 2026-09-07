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
