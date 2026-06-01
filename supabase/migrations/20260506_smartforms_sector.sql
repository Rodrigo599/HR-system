-- Onda 4: SmartForms filtrados por setor
-- Forms com sector_id=NULL são universais (valem pra todos os setores).
-- Forms com sector_id especifico só aparecem ao avaliar colaboradores daquele setor.
-- Forms existentes ficam com sector_id=NULL (comportamento universal preservado).

ALTER TABLE smart_forms ADD COLUMN IF NOT EXISTS sector_id uuid REFERENCES sectors(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS smart_forms_sector_id_idx ON smart_forms(sector_id);
