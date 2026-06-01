-- Fix: infinite recursion in user_roles RLS policy
-- The admin_all_user_roles policy queries user_roles to check if user is admin,
-- which causes infinite recursion. Solution: SECURITY DEFINER function.

-- Create a SECURITY DEFINER function that bypasses RLS to check roles
CREATE OR REPLACE FUNCTION public.user_has_role(check_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::TEXT = check_role
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "admin_all_user_roles" ON public.user_roles;

-- Recreate using the security definer function (no recursion)
CREATE POLICY "admin_all_user_roles" ON public.user_roles FOR ALL
    USING (public.user_has_role('admin'));
