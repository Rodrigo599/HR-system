-- HR Compass: Fase 3 — Conteúdo do gestor (treinamento / leitura / processo)
-- Migration: 2026-05-03
--
-- Modelo:
--   content_items: item criado pelo gestor (treinamento, leitura, processo)
--   content_assignments: relacao item <-> colaborador alvo, com status individual.
--                       Eh a fusao de "audiencia" + "progresso" — fan-out na criacao.

-- ============================================================
-- 1. ENUMs
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.content_type AS ENUM ('training', 'reading', 'process');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('not_seen', 'seen', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. TABELAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  type public.content_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT,
  file_url TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_items_created_by ON public.content_items(created_by);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON public.content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_items_due_date ON public.content_items(due_date) WHERE due_date IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.content_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status public.content_status NOT NULL DEFAULT 'not_seen',
  seen_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_content_assignments_item ON public.content_assignments(item_id);
CREATE INDEX IF NOT EXISTS idx_content_assignments_user ON public.content_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_content_assignments_user_status ON public.content_assignments(user_id, status);

-- ============================================================
-- 3. TRIGGER updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_items_updated_at ON public.content_items;
CREATE TRIGGER trg_content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_content_assignments_updated_at ON public.content_assignments;
CREATE TRIGGER trg_content_assignments_updated_at
  BEFORE UPDATE ON public.content_assignments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_assignments ENABLE ROW LEVEL SECURITY;

-- ---------- content_items ----------

-- SELECT: criador, admin, ou colaborador atribuido, ou gestor cujo time tem assignment
DROP POLICY IF EXISTS "content_items_select" ON public.content_items;
CREATE POLICY "content_items_select" ON public.content_items FOR SELECT
  USING (
    created_by = auth.uid()
    OR public.user_has_role('admin')
    OR EXISTS (
      SELECT 1 FROM public.content_assignments a
      WHERE a.item_id = content_items.id
        AND (
          a.user_id = auth.uid()
          OR (public.user_has_role('gestor') AND a.user_id IN (SELECT public.get_my_team_user_ids()))
        )
    )
  );

-- INSERT: gestor ou admin (gestor cria pra si)
DROP POLICY IF EXISTS "content_items_insert" ON public.content_items;
CREATE POLICY "content_items_insert" ON public.content_items FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND (public.user_has_role('admin') OR public.user_has_role('gestor'))
  );

-- UPDATE/DELETE: criador ou admin
DROP POLICY IF EXISTS "content_items_update" ON public.content_items;
CREATE POLICY "content_items_update" ON public.content_items FOR UPDATE
  USING (created_by = auth.uid() OR public.user_has_role('admin'));

DROP POLICY IF EXISTS "content_items_delete" ON public.content_items;
CREATE POLICY "content_items_delete" ON public.content_items FOR DELETE
  USING (created_by = auth.uid() OR public.user_has_role('admin'));

-- ---------- content_assignments ----------

-- SELECT: o proprio colaborador, criador do item, admin, ou gestor cujo user_id pertence ao time
DROP POLICY IF EXISTS "content_assignments_select" ON public.content_assignments;
CREATE POLICY "content_assignments_select" ON public.content_assignments FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.user_has_role('admin')
    OR EXISTS (
      SELECT 1 FROM public.content_items i
      WHERE i.id = content_assignments.item_id AND i.created_by = auth.uid()
    )
    OR (public.user_has_role('gestor') AND user_id IN (SELECT public.get_my_team_user_ids()))
  );

-- INSERT: criador do item, admin, ou gestor cujo target esta no time
DROP POLICY IF EXISTS "content_assignments_insert" ON public.content_assignments;
CREATE POLICY "content_assignments_insert" ON public.content_assignments FOR INSERT
  WITH CHECK (
    public.user_has_role('admin')
    OR EXISTS (
      SELECT 1 FROM public.content_items i
      WHERE i.id = content_assignments.item_id AND i.created_by = auth.uid()
    )
  );

-- UPDATE: o proprio colaborador (pra mudar status), o criador do item, ou admin
DROP POLICY IF EXISTS "content_assignments_update" ON public.content_assignments;
CREATE POLICY "content_assignments_update" ON public.content_assignments FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.user_has_role('admin')
    OR EXISTS (
      SELECT 1 FROM public.content_items i
      WHERE i.id = content_assignments.item_id AND i.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "content_assignments_delete" ON public.content_assignments;
CREATE POLICY "content_assignments_delete" ON public.content_assignments FOR DELETE
  USING (
    public.user_has_role('admin')
    OR EXISTS (
      SELECT 1 FROM public.content_items i
      WHERE i.id = content_assignments.item_id AND i.created_by = auth.uid()
    )
  );

-- ============================================================
-- 5. AGREGADO POR ITEM (KPI gestor)
-- ============================================================
CREATE OR REPLACE FUNCTION public.content_item_progress(p_item_id UUID)
RETURNS TABLE (
  total_assigned INTEGER,
  total_seen INTEGER,
  total_in_progress INTEGER,
  total_completed INTEGER,
  completion_rate NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH counts AS (
    SELECT
      COUNT(*)::INTEGER AS total_assigned,
      COUNT(*) FILTER (WHERE status IN ('seen','in_progress','completed'))::INTEGER AS total_seen,
      COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER AS total_in_progress,
      COUNT(*) FILTER (WHERE status = 'completed')::INTEGER AS total_completed
    FROM public.content_assignments
    WHERE item_id = p_item_id
  )
  SELECT
    total_assigned,
    total_seen,
    total_in_progress,
    total_completed,
    CASE WHEN total_assigned = 0 THEN 0
         ELSE ROUND((total_completed::NUMERIC / total_assigned) * 100, 1)
    END AS completion_rate
  FROM counts;
$$;

GRANT EXECUTE ON FUNCTION public.content_item_progress(UUID) TO authenticated;

-- ============================================================
-- FIM
-- ============================================================
