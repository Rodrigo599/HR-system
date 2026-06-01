-- Fix: manager_id policies use wrong comparison
-- manager_id stores profiles.id (not auth.uid which is user_id)
-- All policies comparing manager_id = auth.uid() must be fixed

-- Helper: get current user's profile id (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Fix pdis_select_team: gestor sees team's PDIs
DROP POLICY IF EXISTS "pdis_select_team" ON public.pdis;
CREATE POLICY "pdis_select_team" ON public.pdis FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = pdis.user_id
              AND p.manager_id = public.current_profile_id()
        )
    );

-- Fix pdi_tasks_select_team: gestor sees team's tasks
DROP POLICY IF EXISTS "pdi_tasks_select_team" ON public.pdi_tasks;
CREATE POLICY "pdi_tasks_select_team" ON public.pdi_tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pdis p
            JOIN public.profiles pr ON pr.user_id = p.user_id
            WHERE p.id = pdi_id
              AND pr.manager_id = public.current_profile_id()
        )
    );

-- Fix gestor_review_pdi_tasks: gestor can approve/reject team's tasks
DROP POLICY IF EXISTS "gestor_review_pdi_tasks" ON public.pdi_tasks;
CREATE POLICY "gestor_review_pdi_tasks" ON public.pdi_tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.pdis p
            JOIN public.profiles pr ON pr.user_id = p.user_id
            WHERE p.id = pdi_id
              AND pr.manager_id = public.current_profile_id()
        )
    );
