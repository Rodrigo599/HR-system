-- Tabela de junção KPI ↔ Setores (muitos-para-muitos)
CREATE TABLE public.kpi_sectors (
  kpi_id    UUID REFERENCES public.kpis(id) ON DELETE CASCADE NOT NULL,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (kpi_id, sector_id)
);

-- Migrar dados existentes de kpis.sector_id → kpi_sectors
INSERT INTO public.kpi_sectors (kpi_id, sector_id)
SELECT id, sector_id FROM public.kpis WHERE sector_id IS NOT NULL;

-- Limpar sector_id (agora gerenciado por kpi_sectors)
UPDATE public.kpis SET sector_id = NULL;

-- RLS
ALTER TABLE public.kpi_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_kpi_sectors" ON public.kpi_sectors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "all_read_kpi_sectors" ON public.kpi_sectors
  FOR SELECT USING (true);
