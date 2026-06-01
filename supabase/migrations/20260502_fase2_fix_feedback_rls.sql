-- ============================================================
-- HR Compass: Fix Fase 2.5 — bugs críticos do Feedback de Clima
-- Migration: 2026-05-02
-- Plano: TI-20260502 fix-hr-compass-feedback-fase2
--
-- Corrige:
--   BUG-A: submitted_at NOT NULL DEFAULT now() impedia distinguir
--          assignment pendente de resposta submetida.
--   BUG-B: gestor não conseguia inserir assignment porque nenhuma
--          policy de INSERT aceitava (assigned_by = auth.uid()).
--   BUG-C: own_responses FOR ALL sem WITH CHECK fazia UPDATE
--          anônimo (user_id=null) ser rejeitado silenciosamente.
-- ============================================================

-- ------------------------------------------------------------
-- BUG-A: submitted_at deve ser nullable e sem default
-- ------------------------------------------------------------
-- Assignment pendente = submitted_at IS NULL.
-- Antes da migration, a coluna tinha DEFAULT now() + NOT NULL,
-- então o filtro .is('submitted_at', null) sempre retornava vazio.
ALTER TABLE public.smart_form_responses
  ALTER COLUMN submitted_at DROP DEFAULT;

ALTER TABLE public.smart_form_responses
  ALTER COLUMN submitted_at DROP NOT NULL;

-- ------------------------------------------------------------
-- BUG-C: separar own_responses em policies por comando
-- ------------------------------------------------------------
-- A policy original era FOR ALL USING (user_id = auth.uid()).
-- Sem WITH CHECK explícito, o USING também é avaliado contra o
-- valor novo. Quando o colaborador submete uma resposta anônima,
-- o app seta user_id=null no UPDATE — null = auth.uid() não é
-- true, então o UPDATE falha sem erro visível.
DROP POLICY IF EXISTS "own_responses" ON public.smart_form_responses;

-- SELECT: dono lê suas próprias respostas
CREATE POLICY "own_responses_select" ON public.smart_form_responses
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: dono cria suas próprias respostas
CREATE POLICY "own_responses_insert" ON public.smart_form_responses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: dono pode atualizar suas próprias respostas OU
-- responder uma assignment direcionada a ele. Aceita o usuário
-- limpar user_id/assigned_to ao submeter resposta anônima.
CREATE POLICY "own_responses_update" ON public.smart_form_responses
  FOR UPDATE
  USING (user_id = auth.uid() OR assigned_to = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    OR user_id IS NULL
    OR (data ->> '_is_anonymous')::boolean IS TRUE
  );

-- DELETE: dono pode deletar suas próprias respostas
CREATE POLICY "own_responses_delete" ON public.smart_form_responses
  FOR DELETE
  USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- BUG-B: gestor pode criar assignments (escopo restrito)
-- ------------------------------------------------------------
-- A policy eval_responses_write existente exige
-- user_id=auth.uid() OU admin OU evaluation_id IS NOT NULL.
-- Assignment de feedback tem user_id=colaborador e
-- evaluation_id=null, então é rejeitada para gestor.
-- Em PG, policies do mesmo comando são OR (permissive default),
-- então adicionamos uma policy específica sem alterar a antiga.
--
-- IMPORTANTE: como policies INSERT combinam por OR, esta policy
-- precisa ser estritamente o "caminho do gestor atribuindo
-- feedback ao seu liderado". Validamos:
--   1. quem está chamando tem role 'gestor'
--   2. assigned_by é o próprio (não pode atribuir em nome de terceiro)
--   3. assigned_to está no time do gestor (escopo)
--   4. é de fato um assignment (flag _is_assignment no payload)
-- Sem essas guardas, a policy bypassaria todas as outras INSERT.
DROP POLICY IF EXISTS "manager_assign_feedback" ON public.smart_form_responses;
CREATE POLICY "manager_assign_feedback" ON public.smart_form_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_role('gestor')
    AND assigned_by = auth.uid()
    AND assigned_to IN (SELECT public.get_my_team_user_ids())
    AND (data->>'_is_assignment') = 'true'
  );

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
