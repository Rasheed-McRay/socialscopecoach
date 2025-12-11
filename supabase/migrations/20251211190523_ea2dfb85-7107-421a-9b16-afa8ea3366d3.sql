-- Remove the INSERT policy that allows users to self-assign any role
-- The handle_new_user_role trigger already creates roles securely on signup
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;