-- HR Compass: Fase 2 — Privacidade graduada + Fase 2.5 (feedback de clima)
-- Migration: 2026-05-01

-- ============================================================
-- 1. KPI RESULTS — restaurar privacidade
-- ============================================================
-- Em 2026-04-16 a policy de SELECT virou "authenticated_read_kpis" (todos os logados),
-- o que vaza resultados pessoais entre colegas. Voltamos ao padrao correto:
-- colaborador ve so os proprios resultados; gestor ve os do time; admin ve tudo.

DROP POLICY IF EXISTS "authenticated_read_kpis" ON public.kpi_results;
DROP POLICY IF EXISTS "kpi_results_select_own" ON public.kpi_results;
DROP POLICY IF EXISTS "kpi_results_select_team" ON public.kpi_results;
DROP POLICY IF EXISTS "kpi_results_select_admin" ON public.kpi_results;

CREATE POLICY "kpi_results_select_own" ON public.kpi_results FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "kpi_results_select_team" ON public.kpi_results FOR SELECT
  USING (
    public.user_has_role('gestor')
    AND user_id IN (SELECT public.get_my_team_user_ids())
  );

CREATE POLICY "kpi_results_select_admin" ON public.kpi_results FOR SELECT
  USING (public.user_has_role('admin'));

-- ============================================================
-- 2. KPIS (definicoes) — colaborador ve so o proprio setor
-- ============================================================
-- KPIs sao definicoes globais por setor. Colaborador deve ver KPIs do seu setor +
-- KPIs sem setor (globais). Gestor ve do setor proprio. Admin ve tudo.

DROP POLICY IF EXISTS "kpis_select_sector" ON public.kpis;
DROP POLICY IF EXISTS "kpis_select_admin" ON public.kpis;
DROP POLICY IF EXISTS "kpis_select_authenticated" ON public.kpis;

CREATE POLICY "kpis_select_sector" ON public.kpis FOR SELECT
  USING (
    sector_id IS NULL
    OR sector_id = public.get_my_sector_id()
  );

CREATE POLICY "kpis_select_admin" ON public.kpis FOR SELECT
  USING (public.user_has_role('admin'));

-- ============================================================
-- 3. DEPENDENTS — apenas proprio + admin
-- ============================================================
-- Dados sensiveis (nome de filhos, datas). Mantemos a policy de gestor que ja existe
-- via 20260416_fase2_permissions_schema (gestor_manage_team_dependents).
-- Aqui garantimos que admin ve tudo via security-definer (sem recursao).

DROP POLICY IF EXISTS "dependents_select_admin" ON public.dependents;
CREATE POLICY "dependents_select_admin" ON public.dependents FOR SELECT
  USING (public.user_has_role('admin'));

-- ============================================================
-- 4. FEEDBACK DE CLIMA — extensao em smart_form_responses
-- ============================================================
-- Reutiliza a tabela existente. Sem schema change drastico:
-- - assigned_to / assigned_by / phase ja existem (migration 2026-04-17)
-- - flag is_anonymous via metadata JSONB (data->>'_is_anonymous')
-- - period via metadata JSONB (data->>'_period' = 'YYYY-MM')

-- Permitir que gestor crie atribuicoes (linhas com user_id = auth.uid mas
-- assigned_to apontando pro liderado, sem submitted_at).
-- A policy de write existente (eval_responses_write) ja contempla esse caso
-- pelo bloco gestor + get_my_team_user_ids.

-- Funcao agregadora de feedback: retorna media e contagem por campo escalar
-- de um formulario num determinado periodo. Garantia de privacidade: nao retorna
-- nenhum dado individual, apenas o agregado (>= 3 respostas pra evitar reidentificacao).
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
      (value::TEXT)::NUMERIC AS num_value
    FROM public.smart_form_responses r,
         jsonb_each(r.data) AS kv(key, value)
    WHERE r.form_id = p_form_id
      AND (r.data->>'_period') = p_period
      AND jsonb_typeof(r.data->key) = 'number'
      -- Authorization: only the form owner / admin / managers of the assigned users
      -- may aggregate. Restrict via standard RLS context.
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
  -- Privacidade: so retorna agregados com 3+ respostas para impedir reidentificacao
  HAVING COUNT(*) >= 3;
$$;

GRANT EXECUTE ON FUNCTION public.aggregate_feedback_by_form(UUID, TEXT) TO authenticated;

-- ============================================================
-- 5. INDICES de apoio
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_kpi_results_user_id ON public.kpi_results(user_id);
CREATE INDEX IF NOT EXISTS idx_pdis_user_id ON public.pdis(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON public.profiles(manager_id);

-- ============================================================
-- FIM
-- ============================================================
