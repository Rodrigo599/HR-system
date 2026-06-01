-- SmartForms: formulários dinâmicos HR Compass
-- Fase 2 - Persistência

-- smart_forms: definições dos formulários
CREATE TABLE IF NOT EXISTS public.smart_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('active', 'draft', 'archived')),
  category TEXT NOT NULL DEFAULT 'custom'
    CHECK (category IN ('evaluation', 'onboarding', 'survey', 'feedback', 'custom')),
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- smart_form_responses: respostas submetidas
CREATE TABLE IF NOT EXISTS public.smart_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.smart_forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.smart_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_form_responses ENABLE ROW LEVEL SECURITY;

-- Forms: todos autenticados leem ativos, admin faz CRUD total
CREATE POLICY "read_active_forms" ON public.smart_forms FOR SELECT
  USING (status = 'active' OR public.user_has_role('admin'));
CREATE POLICY "admin_manage_forms" ON public.smart_forms FOR ALL
  USING (public.user_has_role('admin'));

-- Responses: usuario ve/cria as proprias, gestor ve do time, admin ve tudo
CREATE POLICY "own_responses" ON public.smart_form_responses FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "gestor_read_team_responses" ON public.smart_form_responses FOR SELECT
  USING (user_id IN (SELECT public.get_my_team_user_ids()) AND public.user_has_role('gestor'));
CREATE POLICY "admin_all_responses" ON public.smart_form_responses FOR ALL
  USING (public.user_has_role('admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_smart_forms_status ON public.smart_forms(status);
CREATE INDEX IF NOT EXISTS idx_smart_forms_slug ON public.smart_forms(slug);
CREATE INDEX IF NOT EXISTS idx_sf_responses_form ON public.smart_form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_sf_responses_user ON public.smart_form_responses(user_id);
