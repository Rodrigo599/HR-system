-- HR Compass - Full Schema Migration
-- Consolidates all tables, enums, RLS policies, and indexes
-- Generated from types/database.ts + integrations/supabase/types.ts

-- ============================================================
-- 1. ENUMS
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'colaborador', 'analista');
CREATE TYPE public.evaluation_status AS ENUM ('pending_self', 'pending_manager', 'completed', 'closed');
CREATE TYPE public.evaluation_type AS ENUM ('cultural', 'performance', 'kpi');
CREATE TYPE public.pdi_task_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Sectors (departments)
CREATE TABLE public.sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    sector_id UUID REFERENCES public.sectors(id),
    manager_id UUID REFERENCES public.profiles(id),
    preferred_language TEXT NOT NULL DEFAULT 'pt' CHECK (preferred_language IN ('pt', 'es')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (separate from profile for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Evaluation topics (configurable per sector)
CREATE TABLE public.evaluation_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type public.evaluation_type NOT NULL,
    sector_id UUID REFERENCES public.sectors(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evaluations
CREATE TABLE public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    assigned_to UUID REFERENCES auth.users(id) NOT NULL,
    status public.evaluation_status NOT NULL DEFAULT 'pending_self',
    type public.evaluation_type NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2099),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evaluation responses (scores per topic)
CREATE TABLE public.evaluation_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
    topic_id UUID REFERENCES public.evaluation_topics(id) NOT NULL,
    self_score NUMERIC,
    manager_score NUMERIC,
    final_score NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- KPIs
CREATE TABLE public.kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC NOT NULL,
    unit TEXT,
    sector_id UUID REFERENCES public.sectors(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- KPI results (monthly scores)
CREATE TABLE public.kpi_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID REFERENCES public.kpis(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    score NUMERIC NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2099),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PDIs (Personal Development Plans)
CREATE TABLE public.pdis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PDI tasks (with approval workflow)
CREATE TABLE public.pdi_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdi_id UUID REFERENCES public.pdis(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    link TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    due_date DATE,
    status public.pdi_task_status NOT NULL DEFAULT 'pending',
    reviewer_id UUID REFERENCES auth.users(id),
    review_comment TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dependents (family members for birthday alerts)
CREATE TABLE public.dependents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    relationship TEXT NOT NULL,
    consent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_manager_id ON public.profiles(manager_id);
CREATE INDEX idx_profiles_sector_id ON public.profiles(sector_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_evaluations_assigned_to ON public.evaluations(assigned_to);
CREATE INDEX idx_evaluations_created_by ON public.evaluations(created_by);
CREATE INDEX idx_evaluations_month_year ON public.evaluations(month, year);
CREATE INDEX idx_evaluation_responses_evaluation_id ON public.evaluation_responses(evaluation_id);
CREATE INDEX idx_kpi_results_kpi_id ON public.kpi_results(kpi_id);
CREATE INDEX idx_kpi_results_user_month_year ON public.kpi_results(user_id, month, year);
CREATE INDEX idx_pdis_user_id ON public.pdis(user_id);
CREATE INDEX idx_pdi_tasks_pdi_id ON public.pdi_tasks(pdi_id);
CREATE INDEX idx_pdi_tasks_status ON public.pdi_tasks(status);
CREATE INDEX idx_dependents_profile_id ON public.dependents(profile_id);
CREATE INDEX idx_dependents_birth_month_day ON public.dependents(
    EXTRACT(MONTH FROM birth_date),
    EXTRACT(DAY FROM birth_date)
);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;

-- Admin full access on all tables
CREATE POLICY "admin_all_sectors" ON public.sectors FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_profiles" ON public.profiles FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_user_roles" ON public.user_roles FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_evaluation_topics" ON public.evaluation_topics FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_evaluations" ON public.evaluations FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_evaluation_responses" ON public.evaluation_responses FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_kpis" ON public.kpis FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_kpi_results" ON public.kpi_results FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_pdis" ON public.pdis FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_pdi_tasks" ON public.pdi_tasks FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_dependents" ON public.dependents FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Profiles: users can read all profiles, update their own
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT
    USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
    USING (user_id = auth.uid());

-- User roles: users can read their own roles
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT
    USING (user_id = auth.uid());

-- Sectors: everyone can read
CREATE POLICY "sectors_select_all" ON public.sectors FOR SELECT
    USING (true);

-- Evaluation topics: everyone can read
CREATE POLICY "evaluation_topics_select_all" ON public.evaluation_topics FOR SELECT
    USING (true);

-- Evaluations: users see their own (assigned or created), gestors see team
CREATE POLICY "evaluations_select_own" ON public.evaluations FOR SELECT
    USING (assigned_to = auth.uid() OR created_by = auth.uid());
CREATE POLICY "evaluations_insert_gestor" ON public.evaluations FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
    );
CREATE POLICY "evaluations_update_participant" ON public.evaluations FOR UPDATE
    USING (assigned_to = auth.uid() OR created_by = auth.uid());

-- Evaluation responses: users can manage responses for their evaluations
CREATE POLICY "eval_responses_select" ON public.evaluation_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.evaluations e
            WHERE e.id = evaluation_id AND (e.assigned_to = auth.uid() OR e.created_by = auth.uid())
        )
    );
CREATE POLICY "eval_responses_insert" ON public.evaluation_responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.evaluations e
            WHERE e.id = evaluation_id AND (e.assigned_to = auth.uid() OR e.created_by = auth.uid())
        )
    );
CREATE POLICY "eval_responses_update" ON public.evaluation_responses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.evaluations e
            WHERE e.id = evaluation_id AND (e.assigned_to = auth.uid() OR e.created_by = auth.uid())
        )
    );

-- KPIs: everyone can read
CREATE POLICY "kpis_select_all" ON public.kpis FOR SELECT
    USING (true);

-- KPI results: users see their own, gestors can insert
CREATE POLICY "kpi_results_select_own" ON public.kpi_results FOR SELECT
    USING (user_id = auth.uid());
CREATE POLICY "kpi_results_insert" ON public.kpi_results FOR INSERT
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "kpi_results_update_own" ON public.kpi_results FOR UPDATE
    USING (user_id = auth.uid());

-- PDIs: users see their own
CREATE POLICY "pdis_select_own" ON public.pdis FOR SELECT
    USING (user_id = auth.uid());
CREATE POLICY "pdis_insert_own" ON public.pdis FOR INSERT
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "pdis_update_own" ON public.pdis FOR UPDATE
    USING (user_id = auth.uid());

-- PDIs: gestors can see team PDIs
CREATE POLICY "pdis_select_team" ON public.pdis FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = pdis.user_id AND p.manager_id = auth.uid()
        )
    );

-- PDI tasks: users can manage their own tasks
CREATE POLICY "pdi_tasks_select_own" ON public.pdi_tasks FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.pdis p WHERE p.id = pdi_id AND p.user_id = auth.uid())
    );
CREATE POLICY "pdi_tasks_insert_own" ON public.pdi_tasks FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.pdis p WHERE p.id = pdi_id AND p.user_id = auth.uid())
    );
CREATE POLICY "pdi_tasks_update_own" ON public.pdi_tasks FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM public.pdis p WHERE p.id = pdi_id AND p.user_id = auth.uid())
    );

-- PDI tasks: gestors can view and review team tasks
CREATE POLICY "pdi_tasks_select_team" ON public.pdi_tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pdis p
            JOIN public.profiles pr ON pr.user_id = p.user_id
            WHERE p.id = pdi_id AND pr.manager_id = auth.uid()
        )
    );
CREATE POLICY "gestor_review_pdi_tasks" ON public.pdi_tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.pdis p
            JOIN public.profiles pr ON pr.user_id = p.user_id
            WHERE p.id = pdi_id AND pr.manager_id = auth.uid()
        )
    );

-- Dependents: user manages own, gestor views team
CREATE POLICY "user_own_dependents" ON public.dependents FOR ALL
    USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "gestor_view_team_dependents" ON public.dependents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = dependents.profile_id AND p.manager_id = auth.uid()
        )
    );

-- ============================================================
-- 5. TRIGGERS (updated_at auto-update)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_sectors BEFORE UPDATE ON public.sectors
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_evaluation_topics BEFORE UPDATE ON public.evaluation_topics
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_evaluations BEFORE UPDATE ON public.evaluations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_evaluation_responses BEFORE UPDATE ON public.evaluation_responses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_kpis BEFORE UPDATE ON public.kpis
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_pdis BEFORE UPDATE ON public.pdis
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_pdi_tasks BEFORE UPDATE ON public.pdi_tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_dependents BEFORE UPDATE ON public.dependents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 6. DATA MIGRATIONS (pdi_tasks status alignment)
-- ============================================================

-- Align existing pdi_tasks completed flag with status enum
UPDATE public.pdi_tasks SET status = 'approved' WHERE completed = true AND status = 'pending';
UPDATE public.pdi_tasks SET status = 'pending' WHERE completed = false AND status NOT IN ('submitted', 'rejected');

-- ============================================================
-- 7. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    -- Default role: colaborador
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'colaborador');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
