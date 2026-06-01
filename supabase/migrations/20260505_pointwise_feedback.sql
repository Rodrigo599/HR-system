-- HR Compass Onda 3c: feedback pontual (kudos / ajuste / observacao)
-- Migration: 2026-05-05
-- Notas:
--   - from_user_id / to_user_id referenciam auth.users(id) (mesmo padrao de
--     evaluations.assigned_to, pdis.user_id, one_on_ones.manager_id).
--   - Visibilidade "private" = somente from e to enxergam. "with_manager" =
--     gestor do destinatario tambem enxerga (via get_my_team_user_ids).
--   - Sem updated_at: feedback pontual e imutavel; quem se arrependeu deleta
--     e reescreve.

-- ============================================================
-- 1. TABELA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pointwise_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('kudos','adjustment','observation')),
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'with_manager'
    CHECK (visibility IN ('private','with_manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pointwise_feedback_from
  ON public.pointwise_feedback(from_user_id);
CREATE INDEX IF NOT EXISTS idx_pointwise_feedback_to
  ON public.pointwise_feedback(to_user_id);
CREATE INDEX IF NOT EXISTS idx_pointwise_feedback_created
  ON public.pointwise_feedback(created_at DESC);

-- ============================================================
-- 3. RLS
-- ============================================================
ALTER TABLE public.pointwise_feedback ENABLE ROW LEVEL SECURITY;

-- SELECT: autor, destinatario, gestor do destinatario (se with_manager),
-- gestor do autor (se with_manager) e admin
DROP POLICY IF EXISTS "pointwise_feedback_select" ON public.pointwise_feedback;
CREATE POLICY "pointwise_feedback_select" ON public.pointwise_feedback
  FOR SELECT
  USING (
    from_user_id = auth.uid()
    OR to_user_id = auth.uid()
    OR (
      visibility = 'with_manager'
      AND (
        to_user_id   IN (SELECT public.get_my_team_user_ids())
        OR from_user_id IN (SELECT public.get_my_team_user_ids())
      )
    )
    OR public.user_has_role('admin')
  );

-- INSERT: usuario so escreve em nome proprio (from_user_id = auth.uid())
DROP POLICY IF EXISTS "pointwise_feedback_insert" ON public.pointwise_feedback;
CREATE POLICY "pointwise_feedback_insert" ON public.pointwise_feedback
  FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- DELETE: somente o autor pode apagar (admin tambem, por consistencia)
DROP POLICY IF EXISTS "pointwise_feedback_delete" ON public.pointwise_feedback;
CREATE POLICY "pointwise_feedback_delete" ON public.pointwise_feedback
  FOR DELETE
  USING (
    from_user_id = auth.uid()
    OR public.user_has_role('admin')
  );

COMMENT ON TABLE public.pointwise_feedback IS
  'Feedback pontual (kudos/ajuste/observacao) fora do ciclo formal. Onda 3c.';
