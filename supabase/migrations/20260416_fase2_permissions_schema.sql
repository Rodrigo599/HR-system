-- HR Compass Fase 2: Permissions + Schema + RLS Overhaul
-- Migration: 2026-04-16
-- PRDs: MAPA-PERMISSOES, ONBOARDING-ADMIN, VISAO-GESTOR, VISAO-ADMIN

-- ============================================================
-- 1. SCHEMA CHANGES
-- ============================================================

-- profiles: active flag for deactivation (PRD-ONBOARDING-ADMIN)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(active);

-- profiles: birth_date for birthday alerts (PRD-VISAO-GESTOR sec 3.3)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Unique constraints to prevent duplicates (PRD-FORMULARIOS)
ALTER TABLE public.evaluations
  ADD CONSTRAINT evaluations_unique_assignment UNIQUE (assigned_to, type, month, year);
ALTER TABLE public.kpi_results
  ADD CONSTRAINT kpi_results_unique_entry UNIQUE (kpi_id, user_id, month, year);

-- Notifications table (in-app, PRD-VISAO-GESTOR sec 7)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_submitted', 'task_reviewed', 'evaluation_ready', 'reminder', 'escalation', 'birthday', 'new_team_member')),
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications RLS: users see only their own
CREATE POLICY "user_own_notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- 2. RLS HELPER FUNCTIONS (reuse existing + add new)
-- ============================================================

-- get_my_team_profile_ids: returns profile IDs of direct reports
CREATE OR REPLACE FUNCTION public.get_my_team_profile_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.profiles
  WHERE manager_id = public.current_profile_id();
$$;

-- get_my_team_user_ids: returns auth user IDs of direct reports
CREATE OR REPLACE FUNCTION public.get_my_team_user_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT user_id FROM public.profiles
  WHERE manager_id = public.current_profile_id();
$$;

-- get_my_sector_id: returns sector_id of current user
CREATE OR REPLACE FUNCTION public.get_my_sector_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT sector_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- 3. RLS OVERHAUL: PROFILES
-- ============================================================
-- Current: everyone can read all profiles
-- New: keep it (needed for name lookups), but restrict based on context

-- No change needed for profiles SELECT - all authenticated users can read all profiles
-- (needed for dropdowns: select gestor, select collaborador, etc.)

-- Gestor can update team profiles (sector, manager changes by admin only,
-- but gestor needs to see them)
-- Actually per PRD, only admin edits profiles. Keep current policies.

-- ============================================================
-- 4. RLS OVERHAUL: EVALUATIONS
-- ============================================================

-- Gestor can see evaluations for their team members
DROP POLICY IF EXISTS "evaluations_select_team" ON public.evaluations;
CREATE POLICY "evaluations_select_team" ON public.evaluations FOR SELECT
  USING (
    assigned_to IN (SELECT public.get_my_team_user_ids())
    AND public.user_has_role('gestor')
  );

-- Gestor can create evaluations for their team
DROP POLICY IF EXISTS "evaluations_insert_gestor" ON public.evaluations;
CREATE POLICY "evaluations_insert_gestor" ON public.evaluations FOR INSERT
  WITH CHECK (
    (
      public.user_has_role('admin')
    ) OR (
      public.user_has_role('gestor')
      AND assigned_to IN (SELECT public.get_my_team_user_ids())
    )
  );

-- Gestor can update evaluations they created or for their team
DROP POLICY IF EXISTS "evaluations_update_participant" ON public.evaluations;
CREATE POLICY "evaluations_update_participant" ON public.evaluations FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR (public.user_has_role('gestor') AND assigned_to IN (SELECT public.get_my_team_user_ids()))
  );

-- ============================================================
-- 5. RLS OVERHAUL: EVALUATION RESPONSES
-- ============================================================

-- Gestor can see/manage responses for team evaluations
DROP POLICY IF EXISTS "eval_responses_select_team" ON public.evaluation_responses;
CREATE POLICY "eval_responses_select_team" ON public.evaluation_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_id
        AND e.assigned_to IN (SELECT public.get_my_team_user_ids())
    )
    AND public.user_has_role('gestor')
  );

DROP POLICY IF EXISTS "eval_responses_update_team" ON public.evaluation_responses;
CREATE POLICY "eval_responses_update_team" ON public.evaluation_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_id
        AND e.assigned_to IN (SELECT public.get_my_team_user_ids())
    )
    AND public.user_has_role('gestor')
  );

-- ============================================================
-- 6. RLS OVERHAUL: KPI RESULTS
-- ============================================================

-- Gestor can see KPI results for their team
DROP POLICY IF EXISTS "kpi_results_select_team" ON public.kpi_results;
CREATE POLICY "kpi_results_select_team" ON public.kpi_results FOR SELECT
  USING (
    user_id IN (SELECT public.get_my_team_user_ids())
    AND public.user_has_role('gestor')
  );

-- Gestor can insert KPI results for their team
DROP POLICY IF EXISTS "kpi_results_insert_team" ON public.kpi_results;
CREATE POLICY "kpi_results_insert_team" ON public.kpi_results FOR INSERT
  WITH CHECK (
    user_id IN (SELECT public.get_my_team_user_ids())
    AND public.user_has_role('gestor')
  );

-- ============================================================
-- 7. RLS OVERHAUL: PDIs (gestor can also create for team)
-- ============================================================

DROP POLICY IF EXISTS "pdis_insert_team" ON public.pdis;
CREATE POLICY "pdis_insert_team" ON public.pdis FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR (
      public.user_has_role('gestor')
      AND user_id IN (SELECT public.get_my_team_user_ids())
    )
    OR public.user_has_role('admin')
  );

-- Gestor can update team PDIs
DROP POLICY IF EXISTS "pdis_update_team" ON public.pdis;
CREATE POLICY "pdis_update_team" ON public.pdis FOR UPDATE
  USING (
    user_id IN (SELECT public.get_my_team_user_ids())
    AND public.user_has_role('gestor')
  );

-- Drop old insert policy that only allowed own
DROP POLICY IF EXISTS "pdis_insert_own" ON public.pdis;

-- ============================================================
-- 8. RLS: PDI TASKS - gestor can also insert for team
-- ============================================================

DROP POLICY IF EXISTS "pdi_tasks_insert_team" ON public.pdi_tasks;
CREATE POLICY "pdi_tasks_insert_team" ON public.pdi_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdis p WHERE p.id = pdi_id AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.pdis p
      JOIN public.profiles pr ON pr.user_id = p.user_id
      WHERE p.id = pdi_id AND pr.manager_id = public.current_profile_id()
    )
    OR public.user_has_role('admin')
  );

-- Drop old insert policy
DROP POLICY IF EXISTS "pdi_tasks_insert_own" ON public.pdi_tasks;

-- ============================================================
-- 9. RLS: DEPENDENTS - gestor can manage team dependents
-- ============================================================

DROP POLICY IF EXISTS "gestor_manage_team_dependents" ON public.dependents;
CREATE POLICY "gestor_manage_team_dependents" ON public.dependents
  FOR ALL USING (
    profile_id IN (SELECT public.get_my_team_profile_ids())
    AND public.user_has_role('gestor')
  );

-- ============================================================
-- 10. Updated trigger for auto-creating profiles
-- Now includes active=true and handles full_name from metadata
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        true
    );
    -- Default role: colaborador
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'colaborador');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
