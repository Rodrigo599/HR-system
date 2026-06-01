-- HR Compass: Fase 4 — Fluxo SIMULTANEO CEGO de avaliacao
-- Migration: 2026-05-03
--
-- Modelagem:
--   - Coluna flow_type em evaluations: 'sequential' (legado, default) ou 'blind_simultaneous'.
--   - Novos status: leader_submitted, self_submitted, both_submitted.
--   - Status final continua sendo 'completed' (apos both_submitted, fluxo termina).
--
-- Logica:
--   sequential  : pending_self -> pending_manager -> completed (existente, NAO mudar)
--   blind       : pending_self -> [self_submitted | leader_submitted] -> both_submitted -> completed
--                 Cada lado registra independentemente. A partir de both_submitted, ambos podem ver.

-- ============================================================
-- 1. ALTER enum evaluation_status
-- ============================================================
DO $$ BEGIN
  ALTER TYPE public.evaluation_status ADD VALUE IF NOT EXISTS 'leader_submitted';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.evaluation_status ADD VALUE IF NOT EXISTS 'self_submitted';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.evaluation_status ADD VALUE IF NOT EXISTS 'both_submitted';
EXCEPTION WHEN others THEN NULL; END $$;

-- ============================================================
-- 2. Coluna flow_type
-- ============================================================
ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS flow_type TEXT
    NOT NULL DEFAULT 'sequential'
    CHECK (flow_type IN ('sequential', 'blind_simultaneous'));

CREATE INDEX IF NOT EXISTS idx_evaluations_flow_type ON public.evaluations(flow_type);

-- ============================================================
-- 3. Funcao auxiliar: derivar proximo status no fluxo blind
-- ============================================================
-- Recebe o status atual e qual lado acabou de submeter ('self' ou 'manager').
-- Retorna o novo status. NAO atualiza tabela — chamada pelo backend.
CREATE OR REPLACE FUNCTION public.derive_blind_status(
  current_status TEXT,
  side TEXT
)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE
    -- Liderado submeteu
    WHEN side = 'self' AND current_status IN ('pending_self', 'pending_manager') THEN 'self_submitted'
    WHEN side = 'self' AND current_status = 'leader_submitted' THEN 'both_submitted'
    WHEN side = 'self' AND current_status = 'self_submitted' THEN 'self_submitted'
    -- Gestor submeteu
    WHEN side = 'manager' AND current_status IN ('pending_self', 'pending_manager') THEN 'leader_submitted'
    WHEN side = 'manager' AND current_status = 'self_submitted' THEN 'both_submitted'
    WHEN side = 'manager' AND current_status = 'leader_submitted' THEN 'leader_submitted'
    -- Ja completo nao muda
    WHEN current_status IN ('both_submitted', 'completed', 'closed') THEN current_status
    ELSE current_status
  END;
$$;

GRANT EXECUTE ON FUNCTION public.derive_blind_status(TEXT, TEXT) TO authenticated;

-- ============================================================
-- 4. Reforco RLS — gestor NAO ve resposta do liderado em fluxo blind
--                  ate both_submitted
-- ============================================================
-- A policy eval_responses_read existente permitia gestor ver tudo do time.
-- Em fluxo blind precisamos esconder a resposta do outro lado ate ambos submeterem.
DROP POLICY IF EXISTS "eval_responses_read" ON public.smart_form_responses;
CREATE POLICY "eval_responses_read" ON public.smart_form_responses FOR SELECT
  USING (
    -- Proprio usuario sempre ve sua resposta
    user_id = auth.uid()
    -- Admin ve tudo
    OR public.user_has_role('admin')
    -- Vinculo com avaliacao
    OR (
      evaluation_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.evaluations e
        WHERE e.id = smart_form_responses.evaluation_id
          AND (
            -- Sequencial: comportamento antigo
            e.flow_type = 'sequential' AND (
              e.assigned_to = auth.uid()
              OR e.created_by = auth.uid()
              OR (public.user_has_role('gestor') AND e.assigned_to IN (SELECT public.get_my_team_user_ids()))
            )
            -- Blind: somente proprio user OU after both_submitted/completed
            OR e.flow_type = 'blind_simultaneous' AND (
              smart_form_responses.user_id = auth.uid()
              OR e.status IN ('both_submitted', 'completed', 'closed')
            )
          )
      )
    )
  );

-- ============================================================
-- FIM
-- ============================================================
