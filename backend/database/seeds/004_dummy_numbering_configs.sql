-- Dummy ASSET numbering configuration for the IT department (PilarGroup department id 8,
-- code SIT, company comp-pnm-0001) so POST /api/assets can auto-generate asset_number
-- when the field is left blank ("Active ASSET numbering configuration not found" otherwise).
INSERT INTO numbering_configs
  (managing_department_id, company_id, sequence_type, name, prefix, company_token, department_token, pattern, sequence_length, starting_sequence, current_sequence, reset_period, is_active, created_by)
SELECT 8, 'comp-pnm-0001', 'ASSET', 'IT Asset Numbering', 'AST', 'PNM', 'IT', '{PREFIX}/{DEPARTMENT}/{YYYY}/{SEQ}', 6, 1, 0, 'NEVER', 1, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM numbering_configs
  WHERE managing_department_id = 8 AND sequence_type = 'ASSET' AND is_active = 1
);
