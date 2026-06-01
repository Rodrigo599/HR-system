-- HR Compass: Fix bugs #17 e #18
-- Migration: 2026-04-16

-- ============================================================
-- Bug #17 — Admin ve TODAS as avaliacoes (nao so por team)
-- ============================================================
-- Contexto: a policy admin_all_evaluations (schema original) usa FOR ALL
-- com EXISTS na tabela user_roles. A fase2 adicionou evaluations_select_team
-- para gestor, mas nao ha uma policy SELECT explicita para admin via
-- user_has_role() (funcao SECURITY DEFINER sem recursao).
-- Este fix garante que admin sempre ve tudo via funcao sem recursao.

DROP POLICY IF EXISTS "admin_all_evaluations" ON public.evaluations;
CREATE POLICY "admin_all_evaluations" ON public.evaluations FOR ALL
  USING (public.user_has_role('admin'));

-- ============================================================
-- Bug #18 — KPI results visiveis para todos os usuarios autenticados
-- ============================================================
-- Contexto: KPIs são indicadores organizacionais (NPS, Ocupação, etc.).
-- Nao faz sentido cada usuario ver somente os proprios resultados.
-- A policy kpi_results_select_own limita a leitura ao user_id do registro,
-- o que impede Gestor e Colaborador de enxergarem os KPIs do setor.
-- Fix: substituir por policy que permite qualquer usuario autenticado
-- ler todos os kpi_results.

-- Remove policies de SELECT que restringem por user_id
DROP POLICY IF EXISTS "kpi_results_select_own" ON public.kpi_results;
DROP POLICY IF EXISTS "kpi_results_select_team" ON public.kpi_results;

-- Todos os usuarios autenticados podem ler todos os kpi_results
CREATE POLICY "authenticated_read_kpis" ON public.kpi_results FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Manter INSERT/UPDATE restritos: admin via policy existente,
-- gestor pode inserir para o proprio time (policy kpi_results_insert_team da fase2).
-- Colaborador nao insere KPIs diretamente — isso e responsabilidade do gestor/admin.

-- Garantir que a policy de insert do gestor (criada na fase2) usa user_has_role
-- para evitar recursao (a fase2 ja usa public.user_has_role — sem alteracao necessaria).
