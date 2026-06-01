-- ============================================================
-- HR Compass: Unificar SmartForms + Avaliações
-- Migration: 2026-04-17
-- Plano: TI-20260417 Fase 1
-- ============================================================

-- 1A. Dropar tabelas antigas duplicadas
DROP TABLE IF EXISTS public.smartform_submissions CASCADE;
DROP TABLE IF EXISTS public.smartforms CASCADE;

-- 1B. Expandir smart_form_responses para suportar avaliacoes
ALTER TABLE public.smart_form_responses
  ADD COLUMN IF NOT EXISTS phase TEXT CHECK (phase IN ('self', 'manager')),
  ADD COLUMN IF NOT EXISTS evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_sf_responses_assigned ON public.smart_form_responses(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sf_responses_evaluation ON public.smart_form_responses(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_sf_responses_phase ON public.smart_form_responses(evaluation_id, phase);

-- 1C. Adicionar form_id em evaluations
ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS form_id UUID REFERENCES public.smart_forms(id);

CREATE INDEX IF NOT EXISTS idx_evaluations_form_id ON public.evaluations(form_id);

-- 1D. RLS: gestor pode ler/escrever smart_form_responses vinculadas a evaluations do time
DROP POLICY IF EXISTS "eval_responses_read" ON public.smart_form_responses;
CREATE POLICY "eval_responses_read" ON public.smart_form_responses FOR SELECT
  USING (
    -- Proprio usuario
    user_id = auth.uid()
    -- Ou admin
    OR public.user_has_role('admin')
    -- Ou gestor do time (via evaluation linkada)
    OR (
      evaluation_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.evaluations e
        WHERE e.id = smart_form_responses.evaluation_id
          AND (
            e.assigned_to = auth.uid()
            OR e.created_by = auth.uid()
            OR (public.user_has_role('gestor') AND e.assigned_to IN (SELECT public.get_my_team_user_ids()))
          )
      )
    )
  );

DROP POLICY IF EXISTS "eval_responses_write" ON public.smart_form_responses;
CREATE POLICY "eval_responses_write" ON public.smart_form_responses FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.user_has_role('admin')
    OR (
      evaluation_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.evaluations e
        WHERE e.id = smart_form_responses.evaluation_id
          AND (
            e.assigned_to = auth.uid()
            OR e.created_by = auth.uid()
            OR (public.user_has_role('gestor') AND e.assigned_to IN (SELECT public.get_my_team_user_ids()))
          )
      )
    )
  );

DROP POLICY IF EXISTS "eval_responses_update" ON public.smart_form_responses;
CREATE POLICY "eval_responses_update" ON public.smart_form_responses FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.user_has_role('admin')
  );

-- 1E. Seed: inserir SmartForm templates de avaliação
INSERT INTO public.smart_forms (name, slug, status, category, config)
VALUES (
  'Avaliação Cultural',
  'avaliacao-cultural-v2',
  'active',
  'evaluation',
  '{
    "steps": [{
      "title": {"pt": "Competências Culturais", "es": "Competencias Culturales"},
      "subtitle": {"pt": "Avalie de 1 a 10", "es": "Evalua de 1 a 10"},
      "fields": [
        {"type": "scale", "name": "trabalho-equipe", "label": {"pt": "Trabalho em equipe", "es": "Trabajo en equipo"}, "required": true, "min": 1, "max": 10},
        {"type": "scale", "name": "comunicacao", "label": {"pt": "Comunicação", "es": "Comunicación"}, "required": true, "min": 1, "max": 10},
        {"type": "scale", "name": "proatividade", "label": {"pt": "Proatividade", "es": "Proactividad"}, "required": true, "min": 1, "max": 10},
        {"type": "scale", "name": "pontualidade", "label": {"pt": "Pontualidade", "es": "Puntualidad"}, "required": true, "min": 1, "max": 10},
        {"type": "scale", "name": "atendimento-hospede", "label": {"pt": "Atendimento ao hóspede", "es": "Atención al huésped"}, "required": true, "min": 1, "max": 10},
        {"type": "scale", "name": "cumprimento-processos", "label": {"pt": "Cumprimento de processos", "es": "Cumplimiento de procesos"}, "required": true, "min": 1, "max": 10},
        {"type": "textarea", "name": "comentarios-culturais", "label": {"pt": "Comentários gerais", "es": "Comentarios generales"}}
      ]
    }],
    "submit": {"pt": "Enviar avaliação", "es": "Enviar evaluación"}
  }'::jsonb
),
(
  'Avaliação de Desempenho',
  'avaliacao-desempenho',
  'active',
  'evaluation',
  '{
    "steps": [{
      "title": {"pt": "Indicadores de Desempenho", "es": "Indicadores de Desempeno"},
      "subtitle": {"pt": "Avalie de 1 a 10", "es": "Evalua de 1 a 10"},
      "fields": [
        {"type": "scale", "name": "qualidade-trabalho", "label": {"pt": "Qualidade do trabalho", "es": "Calidad del trabajo"}, "required": true, "min": 1, "max": 10},
        {"type": "scale", "name": "produtividade", "label": {"pt": "Produtividade", "es": "Productividad"}, "required": true, "min": 1, "max": 10},
        {"type": "scale", "name": "resolucao-problemas", "label": {"pt": "Resolucao de problemas", "es": "Resolucion de problemas"}, "required": true, "min": 1, "max": 10},
        {"type": "scale", "name": "autonomia", "label": {"pt": "Autonomia", "es": "Autonomia"}, "required": true, "min": 1, "max": 10},
        {"type": "textarea", "name": "comentarios-desempenho", "label": {"pt": "Comentários gerais", "es": "Comentarios generales"}}
      ]
    }],
    "submit": {"pt": "Enviar avaliação", "es": "Enviar evaluación"}
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- 1F. Marcar tabelas antigas como deprecated
COMMENT ON TABLE public.evaluation_topics IS 'DEPRECATED 2026-04-17: substituido por SmartForms config JSONB. Manter ate validacao completa.';
COMMENT ON TABLE public.evaluation_responses IS 'DEPRECATED 2026-04-17: substituido por smart_form_responses. Manter ate validacao completa.';

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
