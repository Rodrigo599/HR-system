-- HR Compass Onda 3a: 1:1 recorrentes
-- Migration: 2026-05-04
-- Notas:
--   - manager_id/report_id referenciam auth.users(id) seguindo padrao do projeto
--     (evaluations.assigned_to, pdis.user_id). Permite RLS direta com auth.uid()
--     sem JOIN extra via profiles.
--   - recurrence_rule NULL = 1:1 ad-hoc (unico evento). Texto = recorrencia (MVP).

-- ============================================================
-- 1. TABELAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.one_on_ones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  recurrence_rule TEXT NULL CHECK (recurrence_rule IS NULL OR recurrence_rule IN ('weekly','biweekly','monthly')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.one_on_one_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  one_on_one_id UUID NOT NULL REFERENCES public.one_on_ones(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  addressed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.one_on_one_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  one_on_one_id UUID NOT NULL REFERENCES public.one_on_ones(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'observation' CHECK (type IN ('decision','action','observation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_one_on_ones_manager ON public.one_on_ones(manager_id);
CREATE INDEX IF NOT EXISTS idx_one_on_ones_report  ON public.one_on_ones(report_id);
CREATE INDEX IF NOT EXISTS idx_one_on_ones_scheduled ON public.one_on_ones(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_one_on_one_topics_parent ON public.one_on_one_topics(one_on_one_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_notes_parent  ON public.one_on_one_notes(one_on_one_id);

-- ============================================================
-- 3. TRIGGER updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_one_on_ones_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_one_on_ones_updated_at ON public.one_on_ones;
CREATE TRIGGER trg_one_on_ones_updated_at
  BEFORE UPDATE ON public.one_on_ones
  FOR EACH ROW EXECUTE FUNCTION public.touch_one_on_ones_updated_at();

-- ============================================================
-- 4. RLS
-- ============================================================
ALTER TABLE public.one_on_ones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_on_one_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_on_one_notes  ENABLE ROW LEVEL SECURITY;

-- one_on_ones SELECT: ambos do par OU admin
DROP POLICY IF EXISTS "one_on_ones_select" ON public.one_on_ones;
CREATE POLICY "one_on_ones_select" ON public.one_on_ones FOR SELECT
  USING (
    manager_id = auth.uid()
    OR report_id = auth.uid()
    OR public.user_has_role('admin')
  );

-- one_on_ones INSERT: gestor cria pra si mesmo como manager
DROP POLICY IF EXISTS "one_on_ones_insert" ON public.one_on_ones;
CREATE POLICY "one_on_ones_insert" ON public.one_on_ones FOR INSERT
  WITH CHECK (
    manager_id = auth.uid()
    OR public.user_has_role('admin')
  );

-- one_on_ones UPDATE: gestor (status, notes)
DROP POLICY IF EXISTS "one_on_ones_update" ON public.one_on_ones;
CREATE POLICY "one_on_ones_update" ON public.one_on_ones FOR UPDATE
  USING (
    manager_id = auth.uid()
    OR public.user_has_role('admin')
  )
  WITH CHECK (
    manager_id = auth.uid()
    OR public.user_has_role('admin')
  );

-- one_on_one_topics: ambos do par leem e escrevem; admin ve tudo
DROP POLICY IF EXISTS "one_on_one_topics_select" ON public.one_on_one_topics;
CREATE POLICY "one_on_one_topics_select" ON public.one_on_one_topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.one_on_ones o
      WHERE o.id = one_on_one_topics.one_on_one_id
        AND (o.manager_id = auth.uid() OR o.report_id = auth.uid())
    )
    OR public.user_has_role('admin')
  );

DROP POLICY IF EXISTS "one_on_one_topics_insert" ON public.one_on_one_topics;
CREATE POLICY "one_on_one_topics_insert" ON public.one_on_one_topics FOR INSERT
  WITH CHECK (
    author_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.one_on_ones o
      WHERE o.id = one_on_one_topics.one_on_one_id
        AND (o.manager_id = auth.uid() OR o.report_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "one_on_one_topics_update" ON public.one_on_one_topics;
CREATE POLICY "one_on_one_topics_update" ON public.one_on_one_topics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.one_on_ones o
      WHERE o.id = one_on_one_topics.one_on_one_id
        AND (o.manager_id = auth.uid() OR o.report_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.one_on_ones o
      WHERE o.id = one_on_one_topics.one_on_one_id
        AND (o.manager_id = auth.uid() OR o.report_id = auth.uid())
    )
  );

-- one_on_one_notes: mesmo padrao
DROP POLICY IF EXISTS "one_on_one_notes_select" ON public.one_on_one_notes;
CREATE POLICY "one_on_one_notes_select" ON public.one_on_one_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.one_on_ones o
      WHERE o.id = one_on_one_notes.one_on_one_id
        AND (o.manager_id = auth.uid() OR o.report_id = auth.uid())
    )
    OR public.user_has_role('admin')
  );

DROP POLICY IF EXISTS "one_on_one_notes_insert" ON public.one_on_one_notes;
CREATE POLICY "one_on_one_notes_insert" ON public.one_on_one_notes FOR INSERT
  WITH CHECK (
    author_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.one_on_ones o
      WHERE o.id = one_on_one_notes.one_on_one_id
        AND (o.manager_id = auth.uid() OR o.report_id = auth.uid())
    )
  );
