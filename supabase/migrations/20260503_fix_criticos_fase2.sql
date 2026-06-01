-- HR Compass: Fix Críticos Fase 2 — revisão de código 2026-05-03
--
-- Corrige:
--   C2: kpis_select_all USING (true) nunca dropada → todo usuário autenticado
--       via todos os KPIs, tornando kpis_select_sector ineficaz.
--   C5: Feedback.tsx apenas validava no front; adicionar função de validação
--       de mínimo de respondentes (validação backend via trigger).

-- ============================================================
-- C2: Dropar policy que anula privacidade de KPIs por setor
-- ============================================================
-- A migration 20260501 criou kpis_select_sector/kpis_select_admin mas
-- esqueceu de dropar kpis_select_all (criada em 20260125170044).
-- Policies de SELECT combinam por OR → kpis_select_all vencia tudo.

DROP POLICY IF EXISTS "kpis_select_all" ON public.kpis;

-- Confirmar que as policies corretas existem (idempotente):
DROP POLICY IF EXISTS "kpis_select_sector" ON public.kpis;
DROP POLICY IF EXISTS "kpis_select_admin" ON public.kpis;

CREATE POLICY "kpis_select_sector" ON public.kpis FOR SELECT
  USING (
    sector_id IS NULL
    OR sector_id = public.get_my_sector_id()
  );

CREATE POLICY "kpis_select_admin" ON public.kpis FOR SELECT
  USING (public.user_has_role('admin'));

-- ============================================================
-- C5: Reforçar k-anonimato na função de agregação
-- ============================================================
-- Adiciona filtro para excluir campos marcadores internos (_*) dos resultados
-- e usa cast mais idiomático para NUMERIC.

CREATE OR REPLACE FUNCTION public.aggregate_feedback_by_form(
  p_form_id UUID,
  p_period TEXT
)
RETURNS TABLE (
  field_name TEXT,
  response_count INTEGER,
  avg_value NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH expanded AS (
    SELECT
      key AS field_name,
      (value#>>'{}')::NUMERIC AS num_value
    FROM public.smart_form_responses r,
         jsonb_each(r.data) AS kv(key, value)
    WHERE r.form_id = p_form_id
      AND (r.data->>'_period') = p_period
      AND jsonb_typeof(value) = 'number'
      AND key NOT LIKE '\_%'
      AND (
        public.user_has_role('admin')
        OR EXISTS (
          SELECT 1 FROM public.smart_forms f
          WHERE f.id = r.form_id AND f.created_by = auth.uid()
        )
        OR (
          public.user_has_role('gestor')
          AND r.assigned_to IN (SELECT public.get_my_team_user_ids())
        )
      )
  )
  SELECT
    field_name,
    COUNT(*)::INTEGER AS response_count,
    AVG(num_value) AS avg_value
  FROM expanded
  GROUP BY field_name
  HAVING COUNT(*) >= 3;
$$;

GRANT EXECUTE ON FUNCTION public.aggregate_feedback_by_form(UUID, TEXT) TO authenticated;

-- ============================================================
-- FIM
-- ============================================================
