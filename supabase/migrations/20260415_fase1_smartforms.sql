-- HR Compass: SmartForms tables
-- Migration: 2026-04-15

-- Form definitions (config-driven, JSON stored)
CREATE TABLE smartforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  category TEXT NOT NULL DEFAULT 'custom' CHECK (category IN ('evaluation', 'onboarding', 'survey', 'feedback', 'custom')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_smartforms_slug ON smartforms (slug);
CREATE INDEX idx_smartforms_status ON smartforms (status);

-- Form submissions (responses stored as JSON)
CREATE TABLE smartform_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES smartforms(id) ON DELETE CASCADE,
  form_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  responses JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_form ON smartform_submissions (form_id);
CREATE INDEX idx_submissions_user ON smartform_submissions (user_id);
CREATE INDEX idx_submissions_assigned ON smartform_submissions (assigned_to);

-- RLS
ALTER TABLE smartforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartform_submissions ENABLE ROW LEVEL SECURITY;

-- Admin can manage all forms
CREATE POLICY "admin_all_smartforms" ON smartforms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Everyone can read active forms
CREATE POLICY "read_active_smartforms" ON smartforms
  FOR SELECT USING (status = 'active');

-- Admin can manage all submissions
CREATE POLICY "admin_all_submissions" ON smartform_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Users can read/write their own submissions
CREATE POLICY "user_own_submissions" ON smartform_submissions
  FOR ALL USING (user_id = auth.uid());

-- Gestors can view submissions assigned to their team
CREATE POLICY "gestor_team_submissions" ON smartform_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = smartform_submissions.assigned_to
        AND p.manager_id = auth.uid()
    )
  );
