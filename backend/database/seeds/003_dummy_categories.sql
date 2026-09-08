-- Dummy master_categories so the Asset "Category" dropdown (GET /api/master/categories)
-- has data to select from when creating a fixed asset.
INSERT INTO master_categories (code, name, tracking_type, is_depreciable, is_active) VALUES
('LAPTOP','Laptop','SERIALIZED_ASSET',1,1),
('DESKTOP','Desktop Computer','SERIALIZED_ASSET',1,1),
('MONITOR','Monitor','SERIALIZED_ASSET',1,1),
('PRINTER','Printer','SERIALIZED_ASSET',1,1),
('MOBILE','Mobile Phone','SERIALIZED_ASSET',1,1),
('NETWORK_EQ','Networking Equipment','SERIALIZED_ASSET',1,1),
('SERVER','Server','SERIALIZED_ASSET',1,1),
('OFFICE_FURN','Office Furniture','SERIALIZED_ASSET',1,1),
('AC_UNIT','Air Conditioner','SERIALIZED_ASSET',1,1),
('VEHICLE','Vehicle','SERIALIZED_ASSET',1,1),
('OFFICE_SUPP','Office Supplies','CONSUMABLE',0,1),
('PRINTER_INK','Printer Ink & Toner','CONSUMABLE',0,1),
('CLEANING_SUPP','Cleaning Supplies','CONSUMABLE',0,1)
ON DUPLICATE KEY UPDATE name=VALUES(name), tracking_type=VALUES(tracking_type), is_depreciable=VALUES(is_depreciable), is_active=1;
