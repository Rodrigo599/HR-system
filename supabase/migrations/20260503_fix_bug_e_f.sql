-- HR Compass: Fix BUG-E e BUG-F — 2026-05-03
--
-- BUG-E: trigger server-side que garante anonimato independente do cliente.
--        Sem isso, um cliente com bug ou adulterado pode deixar user_id preenchido
--        mesmo numa resposta marcada como anonima — vazamento de identidade silencioso.
--
-- BUG-F: unicidade de assignment por (form, pessoa, periodo).
--        Sem constraint, duplo-clique em "Atribuir" gera 2 rows; colaborador ve
--        2 formularios pendentes e o agregado conta a pessoa duas vezes.

-- ============================================================
-- BUG-E: trigger BEFORE UPDATE — zera user_id/assigned_to se anonimo
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_feedback_anonymity()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.data->>'_is_anonymous')::boolean IS TRUE THEN
    NEW.user_id  := NULL;
    NEW.assigned_to := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_anonymity ON public.smart_form_responses;
CREATE TRIGGER trg_enforce_anonymity
  BEFORE UPDATE ON public.smart_form_responses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_feedback_anonymity();

-- ============================================================
-- BUG-F: UNIQUE parcial para assignments (evita duplicatas)
-- ============================================================
-- Aplica unicidade APENAS em rows que sao assignments (marker _is_assignment=true).
-- Respostas normais (sem assigned_to ou sem marker) nao sao afetadas.

DROP INDEX IF EXISTS public.idx_sfr_unique_assignment;
CREATE UNIQUE INDEX idx_sfr_unique_assignment
  ON public.smart_form_responses (form_id, assigned_to, (data->>'_period'))
  WHERE assigned_to IS NOT NULL
    AND (data->>'_is_assignment')::boolean IS TRUE;

-- ============================================================
-- FIM
-- ============================================================
